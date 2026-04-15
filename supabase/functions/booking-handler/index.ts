import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const { action, data } = await req.json()

    // Helper: Microsoft 365 Graph API Email Dispatch
    const sendM365Email = async (m365Config, fromEmail, toEmail, subject, content) => {
      const { client_id, tenant_id, client_secret } = m365Config
      
      const tokenRes = await fetch(`https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id,
          client_secret,
          scope: "https://graph.microsoft.com/.default",
        }),
      })

      if (!tokenRes.ok) {
        const errData = await tokenRes.json()
        throw new Error(errData.error_description || "Authentication with Microsoft 365 failed.")
      }

      const { access_token } = await tokenRes.json()

      const sendRes = await fetch(`https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            subject,
            body: { contentType: "HTML", content },
            toRecipients: [{ emailAddress: { address: toEmail } }],
          },
        }),
      })

      if (!sendRes.ok) {
        const errData = await sendRes.json()
        throw new Error(errData.error?.message || "Failed to send email via Microsoft Graph API.")
      }

      return true
    }

    if (action === "validate-email-settings") {
      const { settings } = data
      if (settings.provider === "MICROSOFT_365") {
        await sendM365Email(
          settings.microsoft365,
          settings.from,
          settings.from, // Send test to self
          "Microsoft 365 Connection Test",
          "Success! Your Microsoft 365 Graph API integration is correctly configured."
        )
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }
      return new Response(JSON.stringify({ success: true, message: "Provider not Microsoft 365, skipped Graph API check." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    if (action === "create-booking") {
      const { 
        eventId, 
        userId, 
        ticketCount, 
        totalPrice, 
        status, 
        customerDetails, 
        selectedSeats 
      } = data

      // 1. Fetch GST Settings
      const { data: gstSettings } = await supabaseClient
        .from("gst_settings")
        .select("*")
        .maybeSingle()

      let gstData = {}
      let finalTotalPrice = totalPrice

      if (gstSettings && gstSettings.is_enabled) {
        const config = gstSettings.tax_config || { cgst: 9, sgst: 9, igst: 0 }
        const totalGstPercent = config.cgst + config.sgst + config.igst
        
        let taxableAmount = 0
        let gstAmount = 0

        if (gstSettings.pricing_type === "inclusive") {
          taxableAmount = totalPrice / (1 + totalGstPercent / 100)
          gstAmount = totalPrice - taxableAmount
        } else {
          taxableAmount = totalPrice
          gstAmount = totalPrice * (totalGstPercent / 100)
          finalTotalPrice = totalPrice + gstAmount
        }

        const timestamp = Date.now().toString().slice(-6)
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
        const invoiceNumber = `${gstSettings.invoice_prefix || "INV"}${timestamp}${random}`

        gstData = {
          taxable_amount: Math.round(taxableAmount * 100) / 100,
          gst_amount: Math.round(gstAmount * 100) / 100,
          gst_breakdown: {
            cgst: Math.round(taxableAmount * (config.cgst / 100) * 100) / 100,
            sgst: Math.round(taxableAmount * (config.sgst / 100) * 100) / 100,
            igst: Math.round(taxableAmount * (config.igst / 100) * 100) / 100,
          },
          invoice_number: invoiceNumber,
          is_gst_applied: true,
          total_price: finalTotalPrice,
          invoice_date: new Date().toISOString()
        }
      }

      const { data: booking, error: bookingError } = await supabaseClient
        .from("bookings")
        .insert({
          event_id: eventId,
          user_id: userId,
          ticket_count: ticketCount,
          total_price: finalTotalPrice,
          status: status || "Pending",
          customer_details: customerDetails,
          selected_seats: selectedSeats,
          ...gstData
        })
        .select()
        .single()

      if (bookingError) throw bookingError
      
      return new Response(JSON.stringify(booking), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    if (action === "confirm-booking") {
      const { bookingId } = data

      const { data: booking, error: bError } = await supabaseClient
        .from("bookings")
        .select("*, events(*)")
        .eq("id", bookingId)
        .single()

      if (bError || !booking) throw new Error("Booking not found")
      if (booking.status === "Confirmed") {
        return new Response(JSON.stringify(booking), { headers: corsHeaders })
      }

      await supabaseClient
        .from("bookings")
        .update({ status: "Confirmed" })
        .eq("id", bookingId)

      const event = booking.events
      if (event && event.organiser_id) {
        const { data: organiser } = await supabaseClient
          .from("organiser_details")
          .select("wallet_balance")
          .eq("id", event.organiser_id)
          .maybeSingle()

        if (organiser) {
          await supabaseClient
            .from("organiser_details")
            .update({ 
              wallet_balance: (organiser.wallet_balance || 0) + booking.total_price 
            })
            .eq("id", event.organiser_id)
        }
      }

      const { data: emailSettings } = await supabaseClient
        .from("email_settings")
        .select("*")
        .maybeSingle()

      if (emailSettings && emailSettings.provider === "MICROSOFT_365") {
        const targetEmail = booking.customer_details?.email || booking.user_id

        try {
          await sendM365Email(
            emailSettings.microsoft365,
            emailSettings.from,
            targetEmail,
            `Booking Confirmed: ${event.title}`,
            `Hi ${booking.customer_details?.name || "Customer"}, your booking #${bookingId} is confirmed!`
          )
        } catch (e) {
          console.error("Email dispatch failed", e)
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    if (action === "validate-scan") {
      const { bookingId, eventId, organiserId } = data

      // 1. Fetch Booking
      const { data: booking, error: bError } = await supabaseClient
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle()

      if (bError || !booking) {
        await supabaseClient.from("pwa_scans").insert({
          booking_id: bookingId,
          event_id: eventId === "manual_or_scan" ? null : eventId,
          organiser_id: organiserId,
          status: "invalid"
        })
        return new Response(JSON.stringify({ success: false, message: "Ticket not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404
        })
      }

      // 2. Event Match Check
      if (eventId !== "manual_or_scan" && booking.event_id !== eventId) {
        await supabaseClient.from("pwa_scans").insert({
          booking_id: bookingId,
          event_id: eventId,
          organiser_id: organiserId,
          status: "invalid"
        })
        return new Response(JSON.stringify({ success: false, message: "Ticket is for a different event" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        })
      }

      // 3. Already Used Check
      if (booking.scanned) {
        await supabaseClient.from("pwa_scans").insert({
          booking_id: bookingId,
          event_id: booking.event_id,
          organiser_id: organiserId,
          status: "already_used"
        })
        return new Response(JSON.stringify({ success: false, message: "Ticket already used" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        })
      }

      // 4. Record Success
      await supabaseClient
        .from("bookings")
        .update({ 
          scanned: true, 
          scanned_at: new Date().toISOString(),
          status: "Scanned"
        })
        .eq("id", bookingId)

      await supabaseClient.from("pwa_scans").insert({
        booking_id: bookingId,
        event_id: booking.event_id,
        organiser_id: organiserId,
        status: "valid"
      })

      return new Response(JSON.stringify({ success: true, message: "Ticket validated successfully! Checked in." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      })
    }

    if (action === "approve-partner") {
      const { requestId, password } = data

      // 1. Fetch the request
      const { data: partnerReq, error: reqError } = await supabaseClient
        .from("partner_requests")
        .select("*")
        .eq("id", requestId)
        .single()

      if (reqError || !partnerReq) throw new Error("Partner request not found")

      // 2. Create Auth User
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: partnerReq.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: `${partnerReq.first_name} ${partnerReq.last_name}`,
          role: partnerReq.type === 'professional_service' ? 'organiser' : 'organiser' 
        }
      })

      if (authError) throw authError

      const newUserId = authData.user.id

      // 3. Update Profile (Role and Category)
      await supabaseClient
        .from("profiles")
        .update({
          role: 'organiser',
          full_name: `${partnerReq.first_name} ${partnerReq.last_name}`,
          phone: partnerReq.phone
        })
        .eq("id", newUserId)

      // 4. Update Organiser Details
      await supabaseClient
        .from("organiser_details")
        .upsert({
          id: newUserId,
          business_name: `${partnerReq.first_name} ${partnerReq.last_name}'s Business`,
          category: partnerReq.category,
          type: partnerReq.type,
          is_approved: true,
          kyc_status: partnerReq.type === 'professional_service' ? 'Not Required' : 'Completed'
        })

      // 5. Update Request Status
      await supabaseClient
        .from("partner_requests")
        .update({
          status: "Access Granted",
          approved_at: new Date().toISOString(),
          access_granted_at: new Date().toISOString()
        })
        .eq("id", requestId)

      return new Response(JSON.stringify({ success: true, userId: newUserId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      })
    }

    return new Response("Invalid Action", { headers: corsHeaders, status: 400 })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin is not configured" }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const body = await request.json();
    const payload = body.booking || body;

    let authUserId = null;
    if (token) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      authUserId = data?.user?.id || null;
    }

    const eventId = payload.eventId || payload.event_id;
    const userId = authUserId || payload.userId || payload.user_id;
    const ticketCount = payload.ticketCount || payload.ticket_count || payload.quantity || 1;
    const totalPrice = payload.totalPrice ?? payload.total_price;
    const customerDetails = payload.customerDetails || payload.customer_details || {};

    if (!eventId || !userId || !ticketCount || totalPrice == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: eventRow, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id,title,location")
      .eq("id", String(eventId))
      .maybeSingle();

    if (eventError) throw eventError;
    if (!eventRow) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isFree = Number(totalPrice) === 0 || payload.status === "Confirmed";
    const bookingInsert = {
      ...payload,
      event_id: String(eventId),
      user_id: userId,
      ticket_count: Number(ticketCount),
      base_amount: Number(payload.base_amount ?? totalPrice),
      platform_charge: Number(payload.platform_charge || 0),
      gst_amount: Number(payload.gst_amount || 0),
      gst_percent: Number(payload.gst_percent || 0),
      partner_bonus: Number(payload.partner_bonus || 0),
      platform_revenue: Number(payload.platform_revenue || 0),
      partner_total: Number(payload.partner_total ?? payload.base_amount ?? totalPrice),
      discount_amount: Number(payload.discount_amount || 0),
      total_price: Number(totalPrice),
      status: isFree ? "Confirmed" : "Pending",
      booking_status: isFree ? "Confirmed" : "Pending",
      payment_status: isFree ? "paid" : "pending",
      scanned: false,
      selected_seats: customerDetails.selected_seats || payload.selected_seats || [],
      showtime_id: payload.showtime_id || customerDetails.showtimeId || null,
      event_name: payload.event_name || eventRow.title || "Event",
      location: payload.location || eventRow.location || "Venue",
      customer_details: customerDetails
    };

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert([bookingInsert])
      .select("*")
      .single();

    if (bookingError) throw bookingError;

    await supabaseAdmin
      .from("bookings")
      .update({ booking_ref: String(booking.id).slice(-8).toUpperCase() })
      .eq("id", booking.id);

    const selectedSeats = customerDetails.selected_seats || payload.selected_seats || [];
    if (Array.isArray(selectedSeats) && selectedSeats.length > 0) {
      await supabaseAdmin.from("seat_bookings").insert(
        selectedSeats.map((seat) => ({
          seat_id: seat.id || seat.seat_id || seat.seat_number,
          user_id: userId,
          order_id: booking.id,
          booking_status: isFree ? "confirmed" : "pending"
        }))
      );
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      booking: { ...booking, booking_ref: String(booking.id).slice(-8).toUpperCase() }
    });
  } catch (error) {
    console.error("Create mobile booking failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

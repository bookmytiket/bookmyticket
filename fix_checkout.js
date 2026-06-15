const fs = require('fs');

const files = [
  '/home/raja/bookmyticket/app/api/booking-session/verify-payment/route.js',
  '/home/raja/bookmyticket/app/api/razorpay/verify/route.js',
  '/home/raja/bookmyticket/app/api/cashfree/webhook/route.js',
  '/home/raja/bookmyticket/app/api/v1/bookings/route.js'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (file.includes('verify-payment')) {
    content = content.replace(/const \{ data: confirmResult, error: confirmErr \} = await supabaseAdmin\.rpc\('atomic_confirm_and_assign_bib', \{[\s\S]*?const assignedBibNumber = confirmResult\?\.bib_number \|\| null;/m, `let assignedBibNumber = null;
        let confirmErr = null;
        let confirmResult = null;
        
        try {
            const { data, error } = await supabaseAdmin.rpc('atomic_confirm_and_assign_bib', {
                p_booking_id: bookingId,
                p_category_name: categoryName,
                p_is_auto: true,
                p_payment_status: 'paid',
                p_booking_ref: bookingId.slice(-8).toUpperCase(),
                p_customer_details: booking.customer_details || {}
            });
            confirmResult = data;
            confirmErr = error;
        } catch (e) {
            confirmErr = e;
        }

        if (confirmErr || !confirmResult || !confirmResult.success) {
            console.error("Atomic confirmation failed (RPC missing?), falling back to JS assignment:", confirmErr || confirmResult);
            // Fallback to JS loop
            assignedBibNumber = await assignBibNumber(session.event_id, bookingId, categoryName, true);
            
            const updatedCustomerDetails = {
                ...(booking.customer_details || {}),
                ...(assignedBibNumber ? { bib_number: assignedBibNumber } : {})
            };

            await supabaseAdmin
                .from("bookings")
                .update({ 
                    status: "Confirmed",
                    payment_status: "paid",
                    confirmed_at: nowIso,
                    booking_ref: bookingId.slice(-8).toUpperCase(),
                    customer_details: updatedCustomerDetails,
                    ...(assignedBibNumber ? { bib_number: assignedBibNumber } : {})
                })
                .eq("id", bookingId);
        } else {
            assignedBibNumber = confirmResult.bib_number;
        }`);
  }
  
  fs.writeFileSync(file, content);
});

console.log("Fixed checkout routes to have fallback");

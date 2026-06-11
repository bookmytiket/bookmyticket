import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const bookingId = "d9808763-3106-4917-8469-6c3ca62e3564";
    
    // First, update the booking to use rajavasu97@gmail.com
    const { data: booking } = await supabase.from('bookings').select('customer_details').eq('id', bookingId).single();
    if (booking) {
        const details = { ...booking.customer_details, email: "rajavasu97@gmail.com", name: "Raja Vasudevan" };
        await supabase.from('bookings').update({ customer_details: details }).eq('id', bookingId);
        console.log("Updated booking with test email address.");
        
        // Trigger the resend email API
        const fetch = (await import('node-fetch')).default || globalThis.fetch;
        const res = await fetch(`http://localhost:3000/api/email/resend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId })
        });
        
        const data = await res.json();
        console.log("Email API response:", data);
    } else {
        console.error("Booking not found");
    }
}
run();

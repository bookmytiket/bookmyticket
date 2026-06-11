import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const { data: booking, error } = await supabase
        .from('bookings')
        .select('id, event_id, bib_number, customer_details')
        .not('bib_number', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
    if (booking) {
        console.log(`Success URL: http://localhost:3000/events/book/success?bookingId=${booking.id}&id=${booking.event_id}`);
    } else {
        console.log("No booking with a BIB number found. I'll mock one.");
        // Find any booking and update it with a mock BIB
        const { data: anyBooking } = await supabase.from('bookings').select('id, event_id, customer_details').limit(1).single();
        if (anyBooking) {
            const updatedDetails = { ...anyBooking.customer_details, bib_number: "TEST-0001" };
            await supabase.from('bookings').update({ bib_number: "TEST-0001", customer_details: updatedDetails }).eq('id', anyBooking.id);
            console.log(`Created mock Success URL: http://localhost:3000/events/book/success?bookingId=${anyBooking.id}&id=${anyBooking.event_id}`);
        }
    }
}
run();

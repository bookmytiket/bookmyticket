require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Starting backfill for distance...");
  const { data: sessions, error: sessionsError } = await supabase
    .from('booking_sessions')
    .select('package_id, participant_data');
  
  if (sessionsError) {
    console.error("Sessions Error:", sessionsError);
    return;
  }

  let updatedBookings = 0;
  for (const s of sessions) {
    if (s.participant_data && s.participant_data.bookingId && s.package_id) {
        const bookingId = s.participant_data.bookingId;
        
        const { data: booking } = await supabase.from('bookings').select('id, customer_details').eq('id', bookingId).single();
        if (booking && booking.customer_details) {
            let details = booking.customer_details;
            let needsUpdate = false;
            
            if (!details.ticket_type) {
                details.ticket_type = s.package_id;
                needsUpdate = true;
            }
            if (!details.category) {
                details.category = s.package_id;
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                await supabase.from('bookings').update({ customer_details: details }).eq('id', bookingId);
                updatedBookings++;
            }
        }
    }
  }
  
  console.log(`Updated ${updatedBookings} bookings with distance/category.`);
}

run();

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Forcing backfill for distance...");
  
  // Find all bookings missing category
  const { data: bookings } = await supabase.from('bookings').select('id, customer_details, event_id');
  
  let updatedBookings = 0;
  for (const b of bookings) {
    let details = b.customer_details || {};
    if (!details.category && !details.ticket_type && !details.distance) {
        // Find default category from event
        const { data: event } = await supabase.from('events').select('dynamic_config').eq('id', b.event_id).single();
        if (event && event.dynamic_config && event.dynamic_config.marathonCategories) {
            const defaultCat = event.dynamic_config.marathonCategories[0];
            if (defaultCat) {
                details.category = defaultCat.category_name || defaultCat.title;
                details.distance = `${defaultCat.distance_km || 5} KM`;
                await supabase.from('bookings').update({ customer_details: details }).eq('id', b.id);
                updatedBookings++;
            }
        }
    }
  }
  
  console.log(`Force backfilled ${updatedBookings} bookings.`);
}

run();

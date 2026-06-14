require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Starting backfill for bookings...");
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, user_id, customer_details');
  
  if (bookingsError) {
    console.error("Bookings Error:", bookingsError);
    return;
  }

  let updatedBookings = 0;
  for (const b of bookings) {
    let existingPhone = b.customer_details?.phone || b.customer_details?.mobile || b.customer_details?.participant?.phone || b.customer_details?.participant?.mobile;
    
    if (!existingPhone && b.user_id) {
      const { data: profile } = await supabase.from('profiles').select('phone, mobile').eq('id', b.user_id).single();
      if (profile && (profile.phone || profile.mobile)) {
        const phone = profile.phone || profile.mobile;
        
        let newDetails = b.customer_details || {};
        newDetails.phone = phone;

        await supabase.from('bookings').update({ 
          customer_details: newDetails
        }).eq('id', b.id);
        updatedBookings++;
      }
    }
  }
  
  console.log(`Updated ${updatedBookings} bookings.`);

  console.log("Starting backfill for marathon_registrations...");
  const { data: mRegs, error: mError } = await supabase
    .from('marathon_registrations')
    .select('id, participant_phone, user_id');
    
  if (mError) {
    console.error("Marathon Reg Error:", mError);
    return;
  }

  let updatedMRegs = 0;
  for (const r of mRegs) {
    if (!r.participant_phone && r.user_id) {
      const { data: profile } = await supabase.from('profiles').select('phone, mobile').eq('id', r.user_id).single();
      if (profile && (profile.phone || profile.mobile)) {
        const phone = profile.phone || profile.mobile;
        await supabase.from('marathon_registrations').update({ participant_phone: phone }).eq('id', r.id);
        updatedMRegs++;
      }
    }
  }
  
  console.log(`Updated ${updatedMRegs} marathon_registrations.`);
  console.log("Done!");
}

run();

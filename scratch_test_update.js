const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUpdate() {
    console.log("Updating booking...");
    // Update a random existing booking to Pending, then to Confirmed
    const { data: bookings, error: fetchErr } = await supabaseAdmin.from('bookings').select('id').limit(1);
    if (fetchErr) {
        console.error("Fetch err:", fetchErr);
        return;
    }
    
    if (bookings.length > 0) {
        const id = bookings[0].id;
        const { error: updateErr } = await supabaseAdmin.from('bookings').update({ status: 'Confirmed' }).eq('id', id);
        console.log("Update Error:", updateErr);
    } else {
        console.log("No bookings found.");
    }
}

testUpdate();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBookings() {
    const { data, error } = await supabaseAdmin.from('bookings').select('id, status, total_price').order('created_at', { ascending: false }).limit(5);
    console.log("Bookings:", data);
    console.log("Error:", error);
}

checkBookings();

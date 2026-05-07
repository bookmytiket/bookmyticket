const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkData() {
    console.log("--- CITIES ---");
    const { data: cities } = await supabase.from('cities').select('name').limit(20);
    console.log(cities);

    console.log("\n--- EVENTS ---");
    const { data: events } = await supabase.from('events').select('title, city, location, district').limit(20);
    console.log(events);
}

checkData();

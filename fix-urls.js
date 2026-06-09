const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixLinks() {
    await supabase.from('social_links').update({ url: 'https://whatsapp.com/channel/bookmyticket' }).eq('platform', 'whatsapp');
    await supabase.from('social_links').update({ url: 'https://instagram.com/bookmyticket' }).eq('platform', 'instagram');
    console.log("Updated URLs in the database.");
}

fixLinks();

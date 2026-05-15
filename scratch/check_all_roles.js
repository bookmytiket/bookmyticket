
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    const email = 'organiser@gmail.com';
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
    
    if (!profile) return;
    const uid = profile.id;

    console.log('--- TABLES ---');
    
    const tables = ['organisers', 'vendors', 'service_providers', 'brand_kyc', 'staff'];
    for (const table of tables) {
        const { data } = await supabase.from(table).select('*').eq('id', uid).maybeSingle();
        console.log(`${table}:`, data);
    }
}

checkUser();

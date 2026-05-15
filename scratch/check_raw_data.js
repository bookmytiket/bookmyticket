
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUser() {
    const email = 'organiser@gmail.com';
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    const uid = profile.id;

    const [organiserResult, vendorResult, providerResult] = await Promise.all([
        supabase.from('organisers').select('*').eq('id', uid).maybeSingle(),
        supabase.from('vendors').select('*').eq('id', uid).maybeSingle(),
        supabase.from('service_providers').select('*').eq('id', uid).maybeSingle()
    ]);

    const organiserRecord = organiserResult.data;
    const vendorRecord = vendorResult.data;
    const providerRecord = providerResult.data;

    console.log('--- RAW DATA ---');
    console.log('Organiser Record Category:', organiserRecord?.category);
    console.log('Vendor Record Category:', vendorRecord?.category);
    console.log('Provider Record Category:', providerRecord?.category);
    console.log('Organiser Record Type:', organiserRecord?.type);
    console.log('Vendor Record Type:', vendorRecord?.type);
}

checkUser();

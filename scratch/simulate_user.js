
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

    let role = profile.role;
    let specializedData = {};

    if (organiserRecord) {
        role = 'organiser';
        specializedData = { ...(vendorRecord || {}), ...organiserRecord };
    }

    const userData = {
        ...(profile || {}),
        ...specializedData,
        role,
    };

    console.log('Simulated User Data:', {
        category: userData.category,
        type: userData.type,
        role: userData.role
    });
}

checkUser();

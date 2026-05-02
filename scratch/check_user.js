
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'rajavasu97@gmail.com');
    
    if (error) {
        console.error('Error fetching profile:', error);
        return;
    }
    
    console.log('--- Profile Data ---');
    console.log(JSON.stringify(profiles, null, 2));

    const { data: brandKyc, error: kycError } = await supabase
        .from('brand_kyc')
        .select('*')
        .eq('brand_id', profiles[0]?.id);
    
    if (kycError) {
        console.error('Error fetching KYC:', kycError);
    } else {
        console.log('--- Brand KYC Data ---');
        console.log(JSON.stringify(brandKyc, null, 2));
    }
}

checkUser();

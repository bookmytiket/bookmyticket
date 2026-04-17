const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testUpdateAsAdmin() {
    const supabaseUser = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: authData, error: authErr } = await supabaseUser.auth.signInWithPassword({
        email: 'hello@bookmyticket.net',
        password: 'Server@Server@1997'
    });

    if (authErr) {
        console.error("Auth err:", authErr);
        return;
    }

    console.log("Logged in as:", authData.user.email);

    // Fetch organiser
    const { data: orgs, error: fErr } = await supabaseUser.from('organisers').select('*').limit(1);
    if (!orgs || !orgs.length) {
        console.log("No organisers found or error:", fErr);
        return;
    }
    const org = orgs[0];
    
    console.log("Attempting to update organiser from client...");
    const { data, error } = await supabaseUser.from('organisers').update({ kyc_status: 'Rejected' }).eq('id', org.id).select();
    
    if (error) {
        console.error("❌ Update failed:", error);
    } else {
        console.log("✅ Update success:", data);
    }
}

testUpdateAsAdmin();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testUpdateIdAsClient() {
    const supabaseUser = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    await supabaseUser.auth.signInWithPassword({
        email: 'hello@bookmyticket.net',
        password: 'Server@Server@1997'
    });

    const { data: orgs } = await supabaseUser.from('organisers').select('*').limit(1);
    if (!orgs.length) return;
    const org = orgs[0];
    
    console.log("Attempting to update organiser from client with ID in payload...");
    const payload = { id: org.id, kyc_status: 'Active' };
    const { data, error } = await supabaseUser.from('organisers').update(payload).select().eq('id', org.id);
    
    if (error) {
        console.error("❌ Update failed:", error);
    } else {
        console.log("✅ Update success. Returned length:", data.length);
    }
}

testUpdateIdAsClient();

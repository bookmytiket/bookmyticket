const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testUpdateOrder() {
    const supabaseUser = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    await supabaseUser.auth.signInWithPassword({
        email: 'hello@bookmyticket.net',
        password: 'Server@Server@1997'
    });

    const { data: orgs } = await supabaseUser.from('organisers').select('*').limit(1);
    const org = orgs[0];
    
    console.log("Attempting to update organiser from client with select() first...");
    const { data, error } = await supabaseUser.from('organisers').update({ kyc_status: 'Active' }).select().eq('id', org.id);
    
    if (error) {
        console.error("❌ Update failed:", error.message);
    } else {
        console.log("✅ Update success. Returned length:", data.length);
    }
}

testUpdateOrder();

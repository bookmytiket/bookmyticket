const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testUpdateInactive() {
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
    
    console.log("Before update:", org.kyc_status);
    
    const payload = { id: org.id, kyc_status: 'Inactive' };
    const { data, error } = await supabaseUser.from('organisers').update(payload).select().eq('id', org.id);
    
    if (error) {
        console.error("❌ Update failed:", error);
    } else {
        console.log("✅ Update success. After update:", data[0].kyc_status);
    }
}

testUpdateInactive();

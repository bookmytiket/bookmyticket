const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUpdate() {
    console.log("Fetching first organiser...");
    const { data: orgs, error: fErr } = await supabase.from('organisers').select('*').limit(1);
    if (fErr || !orgs.length) {
        console.log("No orgs or error:", fErr);
        return;
    }
    const org = orgs[0];
    console.log("Attempting to update organiser:", org.id);

    const { data, error } = await supabase.from('organisers').update({ kyc_status: 'Active' }).eq('id', org.id);
    if (error) {
        console.error("❌ Update failed:", error);
    } else {
        console.log("✅ Update success:", data);
    }
}
testUpdate();

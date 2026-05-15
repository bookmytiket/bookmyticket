const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function initAdminRegistry() {
    console.log("--- Initializing Admin Registry ---");
    
    // 1. Create table if not exists (via SQL if possible, but here we check existence)
    const { error: tableErr } = await supabase.from('platform_admins').select('id').limit(1);
    
    if (tableErr && tableErr.code === '42P01') {
        console.log("Table 'platform_admins' does not exist. Please run the SQL migration provided in the implementation plan.");
        return;
    }

    // 2. Register the primary admin
    const adminEmail = 'hello@bookmyticket.net';
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', adminEmail).maybeSingle();
    
    if (profile) {
        const { error: regErr } = await supabase
            .from('platform_admins')
            .upsert({ id: profile.id, email: adminEmail, role: 'super_admin' });
        
        if (regErr) console.error("Admin registration failed:", regErr);
        else console.log(`Admin ${adminEmail} successfully registered in the platform_admins registry.`);
    } else {
        console.log(`Profile for ${adminEmail} not found. Please sign up first.`);
    }
}

initAdminRegistry();


const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL = 'superadmin@bookmyticket.io';

async function verifySuperAdmin() {
    console.log(`🔍 Verifying ${EMAIL}...`);

    try {
        // 1. Check Auth
        const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        const user = listData.users.find(u => u.email === EMAIL);
        if (!user) {
            console.error('❌ User not found in Auth.');
        } else {
            console.log('✅ User found in Auth. ID:', user.id);
        }

        const userId = user.id;

        // 2. Check Profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (profileError) {
            console.error('❌ Profile not found:', profileError.message);
        } else {
            console.log('✅ Profile found. Role:', profile.role);
        }

        // 3. Check Admins
        const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', userId)
            .single();

        if (adminError) {
            console.error('❌ Admin entry not found:', adminError.message);
        } else {
            console.log('✅ Admin entry found. Role:', admin.role);
        }

        // 4. Test is_admin() via RPC if it exists, or just manually check
        // Check if there's an is_admin function we can call
        const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin', { u_id: userId });
        if (rpcError) {
            console.log('ℹ️ is_admin RPC check skipped (function might not be accessible via RPC):', rpcError.message);
        } else {
            console.log('✅ is_admin() check result:', isAdmin);
        }

    } catch (err) {
        console.error('❌ Verification failed:', err.message);
    }
}

verifySuperAdmin();

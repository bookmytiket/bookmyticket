
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL = 'superadmin@bookmyticket.io';
const PASSWORD = 'SuperAdmin@2026!';
const USERNAME = 'superadmin';

async function provisionSuperAdmin() {
    console.log(`🚀 Starting provisioning for ${EMAIL}...`);

    try {
        // 1. Create User in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: EMAIL,
            password: PASSWORD,
            email_confirm: true,
            user_metadata: { username: USERNAME }
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                console.log('ℹ️ User already exists in Auth. Fetching existing user...');
                const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
                if (listError) throw listError;
                const existingUser = listData.users.find(u => u.email === EMAIL);
                authData.user = existingUser;
            } else {
                throw authError;
            }
        } else {
            console.log('✅ Auth user created successfully.');
        }

        const userId = authData.user.id;
        console.log(`👤 User ID: ${userId}`);

        // 2. Insert/Update into profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: EMAIL,
                username: USERNAME,
                role: 'staff', // Masked role in profiles to avoid RLS circularity
                full_name: 'System Super Admin',
                status: 'Active'
            });

        if (profileError) throw profileError;
        console.log('✅ Profile record synchronized.');

        // 3. Insert/Update into admins table
        const { error: adminError } = await supabase
            .from('admins')
            .upsert({
                id: userId,
                role: 'Super Admin'
            });

        if (adminError) throw adminError;
        console.log('✅ Admin table entry created/updated.');

        console.log('\n✨ Provisioning Complete! ✨');
        console.log('----------------------------');
        console.log(`Email: ${EMAIL}`);
        console.log(`Password: ${PASSWORD}`);
        console.log('----------------------------');

    } catch (err) {
        console.error('❌ Provisioning failed:', err.message);
        process.exit(1);
    }
}

provisionSuperAdmin();

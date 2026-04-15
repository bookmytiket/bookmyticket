
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const NEW_EMAIL = 'hello@bookmyticket.net';
const NEW_PASSWORD = 'Server@Server@1997';
const NEW_USERNAME = 'hello';

async function updateSuperAdmin() {
    console.log(`🚀 Updating Super Admin to ${NEW_EMAIL}...`);

    try {
        // 1. Check if user already exists in Auth
        const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        let user = listData.users.find(u => u.email === NEW_EMAIL);
        let userId;

        if (user) {
            console.log('ℹ️ User exists. Updating password...');
            userId = user.id;
            const { error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
                password: NEW_PASSWORD,
                email_confirm: true,
                user_metadata: { username: NEW_USERNAME }
            });
            if (updateAuthError) throw updateAuthError;
            console.log('✅ Password and metadata updated.');
        } else {
            console.log('ℹ️ Creating new user...');
            const { data: newData, error: createError } = await supabase.auth.admin.createUser({
                email: NEW_EMAIL,
                password: NEW_PASSWORD,
                email_confirm: true,
                user_metadata: { username: NEW_USERNAME }
            });
            if (createError) throw createError;
            userId = newData.user.id;
            console.log('✅ New Auth user created.');
        }

        // 2. Provision in profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: NEW_EMAIL,
                username: NEW_USERNAME,
                role: 'staff',
                full_name: 'Super Admin',
                status: 'Active'
            });
        if (profileError) throw profileError;
        console.log('✅ Profile record synchronized.');

        // 3. Provision in admins table
        const { error: adminError } = await supabase
            .from('admins')
            .upsert({
                id: userId,
                role: 'Super Admin'
            });
        if (adminError) throw adminError;
        console.log('✅ Admin table entry created/updated.');

        console.log('\n✨ Super Admin Credentials Updated! ✨');
        console.log('------------------------------------');
        console.log(`Email: ${NEW_EMAIL}`);
        console.log(`Password: ${NEW_PASSWORD}`);
        console.log('------------------------------------');

    } catch (err) {
        console.error('❌ Update failed:', err.message);
        process.exit(1);
    }
}

updateSuperAdmin();

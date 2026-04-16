
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const accounts = [
    {
        email: 'organiser@gmail.com',
        password: 'A@123b@123',
        role: 'organiser',
        fullName: 'Main Organiser',
        username: 'organiser_main',
        details: { type: 'event_organiser', business_name: 'BookMyTicket Events' }
    },
    {
        email: 'staff@gmail.com',
        password: 'A@123b@123',
        role: 'staff',
        fullName: 'Central Staff',
        username: 'staff_central'
    },
    {
        email: 'sriharini5501@gmail.com',
        password: 'A@123b@123',
        role: 'organiser',
        fullName: 'Sriharini Mehendi',
        username: 'sriharini_mehendi',
        details: { type: 'professional_service', category: 'Mehendi Artist', business_name: 'Sriharini Mehendi Art' }
    },
    {
        email: 'rajavasu97@gmail.com',
        password: 'A@123b@123',
        role: 'user',
        fullName: 'Raja Vasu',
        username: 'rajavasu97'
    }
];

async function run() {
    const { data: { users: allUsers } } = await supabase.auth.admin.listUsers();
    
    for (const acc of accounts) {
        console.log(`Processing ${acc.email}...`);
        
        let user = allUsers.find(u => u.email === acc.email);
        
        if (!user) {
            console.log(`Creating auth user...`);
            const { data, error } = await supabase.auth.admin.createUser({
                email: acc.email,
                password: acc.password,
                email_confirm: true,
                user_metadata: { role: acc.role, full_name: acc.fullName }
            });
            if (error) { console.error("Error creating auth:", error); continue; }
            user = data.user;
        } else {
            console.log(`Updating existing auth user...`);
            await supabase.auth.admin.updateUserById(user.id, { password: acc.password });
        }

        // Profile
        console.log(`Upserting profile...`);
        const { error: pErr } = await supabase.from('profiles').upsert({
            id: user.id,
            email: acc.email,
            full_name: acc.fullName,
            username: acc.username,
            role: acc.role,
            updated_at: new Date().toISOString()
        });
        if (pErr) console.error("Profile Error:", pErr);

        // Details if organiser
        if (acc.details) {
            console.log(`Upserting organiser_details...`);
            const { error: dErr } = await supabase.from('organiser_details').upsert({
                id: user.id,
                ...acc.details,
                is_approved: true,
                kyc_status: 'Verified',
                updated_at: new Date().toISOString()
            });
            if (dErr) console.error("Details Error:", dErr);
        }
        
        console.log(`Finished ${acc.email} ✅`);
    }
}

run();

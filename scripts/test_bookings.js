const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL')).split('=')[1].trim();
const key = env.split('\n').find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY')).split('=')[1].trim();

const supabase = createClient(url, key);

async function check() {
    const { data: users, error: e1 } = await supabase.auth.admin.listUsers();
    console.log("Users:", users.users.length);
    if(users.users.length > 0) {
        const uid = users.users[0].id;
        console.log("Checking bookings for first user:", uid);
        const { data, error } = await supabase.from('bookings').select('*');
        console.log("Total Bookings in DB:", data.length);
        console.log("Sample Booking User ID:", data[0]?.user_id);
    }
}

check();

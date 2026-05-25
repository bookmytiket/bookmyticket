const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL')).split('=')[1].trim();
const key = env.split('\n').find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY')).split('=')[1].trim();

const supabase = createClient(url, key);

async function check() {
    const { data: users } = await supabase.auth.admin.listUsers();
    console.log("Users:", users.users.map(u => ({ id: u.id, email: u.email })));
    
    const { data: bookings } = await supabase.from('bookings').select('*');
    console.log("Total Bookings:", bookings.length);
    console.log("Booking user IDs:", [...new Set(bookings.map(b => b.user_id))]);
}

check();

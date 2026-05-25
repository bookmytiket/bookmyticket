const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const url = env.split('\n').find(l => l.startsWith('EXPO_PUBLIC_SUPABASE_URL')).split('=')[1].trim();
const key = env.split('\n').find(l => l.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY')).split('=')[1].trim();

const supabase = createClient(url, key);

async function check() {
    const { data, error } = await supabase.from('seat_lock_logs').select('*').limit(1);
    console.log(JSON.stringify(data, null, 2));
    if (error) console.error(error);
}

check();

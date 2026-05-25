const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL')).split('=')[1].trim();
const key = env.split('\n').find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY')).split('=')[1].trim();

const supabase = createClient(url, key);

async function check() {
    const { data: d1, error: e1 } = await supabase.from('email_templates').select('id').limit(1);
    console.log("email_templates:", e1 ? e1.message : "exists");
    const { data: d2, error: e2 } = await supabase.from('notification_queue').select('id').limit(1);
    console.log("notification_queue:", e2 ? e2.message : "exists");
}

check();

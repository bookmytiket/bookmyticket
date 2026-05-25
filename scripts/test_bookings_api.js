const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL')).split('=')[1].trim();
const key = env.split('\n').find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY')).split('=')[1].trim();

const supabase = createClient(url, key);

async function check() {
    const { data: users } = await supabase.auth.admin.listUsers();
    const uid = 'f831918a-b902-4037-90f5-19042d5f876e';
    
    console.log("Found user ID:", uid);

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: users.users.find(u => u.id === uid).email,
    });
    
    // We can't easily get the session from admin API without logging in.
    // Let's directly call the server API with a mock auth header or just check what the API returns by mocking getBearerUser.
    
    // Instead of hitting the network, let's just observe what unifiedApi does.
}

check();

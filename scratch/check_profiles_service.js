const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to load from .env.local
const envPath = path.join(process.cwd(), '.env.local');
let supabaseUrl, serviceKey;

if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1];
    serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1];
}

if (!supabaseUrl || !serviceKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function check() {
    console.log("Checking all profiles (Service Role)...");
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Profiles:", profiles);
    }

    console.log("\nChecking platform_admins...");
    const { data: admins } = await supabase.from('platform_admins').select('*');
    console.log("Platform Admins:", admins);
}

check();

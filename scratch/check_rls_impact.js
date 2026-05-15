const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to load from .env.local
const envPath = path.join(process.cwd(), '.env.local');
let supabaseUrl, supabaseKey, serviceKey;

if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1];
    supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1];
    serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1];
}

async function check() {
    const anonClient = createClient(supabaseUrl, supabaseKey);
    const serviceClient = createClient(supabaseUrl, serviceKey);

    console.log("Checking organisers with Anon Key...");
    const { data: anonData, error: anonError } = await anonClient.from('organisers').select('id');
    console.log("Anon Result:", anonError ? anonError.message : `Found ${anonData.length} records`);

    console.log("\nChecking organisers with Service Role...");
    const { data: serviceData, error: serviceError } = await serviceClient.from('organisers').select('id');
    console.log("Service Result:", serviceError ? serviceError.message : `Found ${serviceData.length} records`);
}

check();

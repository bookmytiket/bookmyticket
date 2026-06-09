const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20260609_social_links.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // We can't use raw SQL easily without a custom RPC function.
        // Let's create the table using a postgres function or fallback method if the table doesn't exist.
        // Or simply log to instruct the user. But wait, I can insert the default records manually if the table exists.

        // First try to insert a test record. If it fails with 42P01, the table doesn't exist.
        const { error } = await supabase.from('social_links').select('id').limit(1);

        if (error && error.code === '42P01') {
            console.log("Table 'social_links' does not exist. Please run the SQL migration in the Supabase Dashboard.");
            console.log("Since I cannot run raw SQL directly, I will wait for you to do so, or the UI should use the fallback data now.");
        } else {
            console.log("Table 'social_links' exists. Inserting default rows if empty...");
            const { data: existing } = await supabase.from('social_links').select('*');
            if (!existing || existing.length === 0) {
                await supabase.from('social_links').insert([
                    { platform: 'whatsapp', title: 'WhatsApp Channel', url: 'https://whatsapp.com/channel', is_enabled: true, show_in_navbar: true, show_in_footer: true, show_on_event_page: true, show_on_booking_success: true },
                    { platform: 'instagram', title: 'Instagram Community', url: 'https://instagram.com/community', is_enabled: true, show_in_navbar: true, show_in_footer: true, show_on_event_page: true, show_on_booking_success: true }
                ]);
                console.log("Inserted default social links.");
            } else {
                console.log("Social links already exist.");
            }
        }
    } catch (err) {
        console.error("Migration error:", err);
    }
}

runMigration();


const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
    const MASTER_ADMIN_ID = 'adbfb83d-0081-436b-8cd1-bc57a6c3501d';
    
    console.log("Starting data migration for Master Admin...");

    // 1. Ensure record exists in admins table
    const { data: adminCheck } = await supabase
        .from('admins')
        .select('*')
        .eq('id', MASTER_ADMIN_ID)
        .single();

    if (!adminCheck) {
        console.log("Inserting Master Admin into admins table...");
        const { error: insertError } = await supabase
            .from('admins')
            .insert({ id: MASTER_ADMIN_ID, role: 'Admin' });
        
        if (insertError) {
            console.error("Failed to insert into admins table:", insertError);
        } else {
            console.log("Successfully inserted Master Admin into admins table.");
        }
    } else {
        console.log("Master Admin already exists in admins table.");
    }

    // 2. Update profile role to generic 'staff' (separation)
    // Actually, maybe 'admin' is still preferred for UI display, 
    // but the user asked for "separation". I'll stick to 'staff' in profile.
    console.log("Updating profile role for Master Admin to 'staff'...");
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'staff' })
        .eq('id', MASTER_ADMIN_ID);

    if (updateError) {
        console.error("Failed to update profile role:", updateError);
    } else {
        console.log("Successfully updated profile role to 'staff'.");
    }
}

migrateData();

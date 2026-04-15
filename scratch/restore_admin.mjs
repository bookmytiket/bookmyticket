import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreAdmin() {
    console.log("Starting Master Admin restoration...");
    
    const email = "admin@bookmyticket.net";
    const password = "D0n+$h@rE2k26";
    
    // 1. Create User in Auth
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true
    });
    
    if (authError) {
        if (authError.message.includes("already registered")) {
            console.log("User already exists in Auth. Updating profile instead...");
            // Get user by email
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
            const existing = users.find(u => u.email === email);
            if (existing) {
                await updateProfile(existing.id, email);
            }
        } else {
            console.error("Auth Error:", authError);
            return;
        }
    } else {
        console.log("Auth user created successfully:", user.id);
        await updateProfile(user.id, email);
    }
}

async function updateProfile(userId, email) {
    // 2. Upsert Profile
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            email: email,
            role: 'admin',
            full_name: 'Master Admin',
            username: 'bookmyticket-admin',
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    
    if (profileError) {
        console.error("Profile Error:", profileError);
    } else {
        console.log("Master Admin profile restored successfully!");
    }
}

restoreAdmin();

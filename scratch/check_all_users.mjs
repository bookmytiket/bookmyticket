import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) console.error("Profiles error:", pError);
    else console.log("All Profiles Count:", profiles.length);

    // Try to check auth users (using service role and auth schema if possible)
    const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
    if (uError) console.error("Auth Users error:", uError);
    else console.log("Total Auth Users:", users.length);

    if (users) {
        users.forEach(u => console.log(`User: ${u.email} (${u.id})`));
    }
}

checkAll();

import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
    console.log("Checking admin_security_settings...");
    const { data: settings, error: err1 } = await supabase.from('admin_security_settings').select('*').limit(1);
    if (err1) console.error("Error admin_security_settings:", err1);
    else console.log("settings:", settings);

    console.log("Checking staff_active_sessions...");
    const { data: sessions, error: err2 } = await supabase.from('staff_active_sessions').select('*').limit(1);
    if (err2) console.error("Error staff_active_sessions:", err2);
    else console.log("sessions:", sessions);
}

checkTables();

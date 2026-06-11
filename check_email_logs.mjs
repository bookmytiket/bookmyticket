import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const { data: logs, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching logs:", error.message);
        return;
    }

    if (!logs || logs.length === 0) {
        console.log("No email logs found.");
        return;
    }

    console.log("--- Recent Email Logs ---");
    logs.forEach(log => {
        console.log(`[${log.created_at}] Type: ${log.email_type}`);
        console.log(`   Recipient: ${log.recipient_email}`);
        console.log(`   Status: ${log.delivery_status}`);
        console.log(`   Error: ${log.error_message || "None"}`);
        console.log(`   Event/Booking: ${log.event_id || 'N/A'} / ${log.booking_id || 'N/A'}`);
        console.log('-------------------------');
    });
}
run();

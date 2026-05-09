const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLogs() {
    console.log("Checking last 5 email logs...");
    const { data, error } = await supabaseAdmin
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Log fetch error:", error);
        return;
    }

    if (data.length === 0) {
        console.log("No email logs found.");
        return;
    }

    data.forEach(log => {
        console.log(`[${log.created_at}] To: ${log.email} | Subject: ${log.subject} | Status: ${log.status} | Error: ${log.error || 'None'}`);
    });
}

checkLogs();

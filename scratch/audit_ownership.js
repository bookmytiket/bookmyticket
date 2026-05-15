const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function auditEvents() {
    console.log("--- Event Ownership Audit ---");
    const { data: events, error } = await supabase
        .from('events')
        .select('id, title, organiser_id, publish_status')
        .ilike('title', '%Trophy%');

    if (error) {
        console.error("Audit failed:", error);
        return;
    }

    console.log(`Found ${events.length} events matching 'Trophy':`);
    events.forEach(e => {
        console.log(`- [${e.id}] "${e.title}" | Owner: ${e.organiser_id} | Status: ${e.publish_status}`);
    });
}

auditEvents();

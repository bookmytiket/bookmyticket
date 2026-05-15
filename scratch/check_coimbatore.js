
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCoimbatoreTrophy() {
    console.log('Searching for "Coimbatore Trophy"...');
    
    const { data, error } = await supabase
        .from('events')
        .select('id, title, status, publish_status, organiser_id, type, entity_type')
        .ilike('title', '%Coimbatore Trophy%');
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    if (data && data.length > 0) {
        console.log(`Found ${data.length} records:`);
        data.forEach(e => {
            console.log(`- ID: ${e.id}`);
            console.log(`  Title: ${e.title}`);
            console.log(`  Status: ${e.status}`);
            console.log(`  Publish Status: ${e.publish_status}`);
            console.log(`  Organiser ID: ${e.organiser_id}`);
            console.log(`  Type: ${e.type}`);
            console.log(`  Entity Type: ${e.entity_type}`);
        });
    } else {
        console.log('No event found with title "Coimbatore Trophy"');
    }
}

checkCoimbatoreTrophy();

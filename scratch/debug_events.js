
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yayrfycnmbpeeintfcvf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
    console.error('No Supabase key found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvents() {
    console.log('Checking events table...');
    const { data, error, count } = await supabase
        .from('events')
        .select('*', { count: 'exact' });
    
    if (error) {
        console.error('Error fetching events:', error);
        return;
    }
    
    console.log(`Total events found: ${count}`);
    if (data && data.length > 0) {
        console.log('Sample Event Data:');
        console.log(JSON.stringify(data[0], null, 2));
        
        const published = data.filter(e => e.status === 'Published');
        console.log(`Published events: ${published.length}`);
    } else {
        console.log('No events found in table.');
    }
}

checkEvents();

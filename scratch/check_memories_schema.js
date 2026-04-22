const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableDefinition() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'memories' });
    // If RPC doesn't exist, we can try another way or just assume.
    // Actually, let's just try to insert a dummy record and see what happens.
    
    console.log('Trying to insert a test memory...');
    const { data: insertData, error: insertError } = await supabase.from('memories').insert({
        imageUrl: 'https://example.com/test.jpg',
        altText: 'Test Memory'
    }).select();
    
    if (insertError) {
        console.error('Insert error:', insertError);
        // Try snake_case if camelCase fails
        console.log('Trying snake_case...');
        const { data: insertData2, error: insertError2 } = await supabase.from('memories').insert({
            image_url: 'https://example.com/test.jpg',
            alt_text: 'Test Memory'
        }).select();
        
        if (insertError2) {
            console.error('Snake case insert error:', insertError2);
        } else {
            console.log('Snake case insert successful:', insertData2);
        }
    } else {
        console.log('Camel case insert successful:', insertData);
    }
}

checkTableDefinition();

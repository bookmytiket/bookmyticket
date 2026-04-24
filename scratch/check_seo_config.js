const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConfig() {
    const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .eq('key', 'seo_analytics')
        .single();
    
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Config:", JSON.stringify(data, null, 2));
    }
}

checkConfig();

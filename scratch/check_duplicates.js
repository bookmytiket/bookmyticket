const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.from('vendors').select('id, count(id)').group('id').having('count(id) > 1');
    if (error) console.error(error);
    else console.log('Duplicate IDs in vendors:', data);
    
    const { data: sp, error: spErr } = await supabase.from('service_providers').select('id, count(id)').group('id').having('count(id) > 1');
    if (spErr) console.error(spErr);
    else console.log('Duplicate IDs in service_providers:', sp);
}
check();

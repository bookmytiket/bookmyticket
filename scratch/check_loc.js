const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
    const { count: cCount } = await supabase.from('countries').select('*', { count: 'exact', head: true });
    const { count: sCount } = await supabase.from('states').select('*', { count: 'exact', head: true });
    const { count: dCount } = await supabase.from('districts').select('*', { count: 'exact', head: true });
    const { count: cityCount } = await supabase.from('cities').select('*', { count: 'exact', head: true });
    console.log({ cCount, sCount, dCount, cityCount });
}
check();

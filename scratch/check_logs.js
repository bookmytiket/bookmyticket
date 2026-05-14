require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function check() {
  const o = await supabase.from('audit_logs').select('*').limit(1);
  console.log('audit_logs cols:', o.error ? o.error : Object.keys(o.data?.[0] || {}));
}
check();

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function check() {
  const o = await supabase.from('organiser_wallet').select('*').limit(1);
  console.log('organiser_wallet', Object.keys(o.data?.[0] || {}));
  const p1 = await supabase.from('provider_wallet').select('*').limit(1);
  console.log('provider_wallet', Object.keys(p1.data?.[0] || {}));
  const p2 = await supabase.from('provider_wallets').select('*').limit(1);
  console.log('provider_wallets', Object.keys(p2.data?.[0] || {}));
}
check();

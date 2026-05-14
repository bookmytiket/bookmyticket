require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const tables = ['user_wishlists', 'subscriptions', 'payout_requests', 'organiser_staff', 'service_providers'];
async function check() {
  for (const t of tables) {
    const o = await supabase.from(t).select('*').limit(1);
    console.log(t, 'cols:', o.error ? o.error.message : Object.keys(o.data?.[0] || {}));
  }
}
check();

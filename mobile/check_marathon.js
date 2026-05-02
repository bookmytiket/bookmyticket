const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/raja/bookmyticket/mobile/.env' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, dynamic_config')
    .ilike('title', '%Marathon%')
    .limit(1);

  if (error) {
    console.error(error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

check();

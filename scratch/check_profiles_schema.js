const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
let url, key;

try {
    const env = fs.readFileSync('/home/raja/bookmyticket/.env.local', 'utf8');
    url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
    key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
} catch (e) {
    const env = fs.readFileSync('/home/raja/bookmyticket/mobile/.env', 'utf8');
    url = env.match(/EXPO_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
    key = env.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
}

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
    
  if (error) console.error(error);
  else console.log(Object.keys(data[0]));
}
check();

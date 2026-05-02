const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/raja/bookmyticket/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('events').select('*').ilike('title', '%Marathon%').limit(1);
  if (error) console.error(error);
  else console.log(JSON.stringify({
    title: data[0].title, img: data[0].img, banner_preview: data[0].banner_preview,
    image_url: data[0].image_url, date: data[0].date
  }, null, 2));
}
run();

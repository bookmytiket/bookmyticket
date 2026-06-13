const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('marathon_events').select('map_location').limit(1);
  if (error) console.error(error);
  else console.log(typeof data[0]?.map_location, data[0]?.map_location);
}
run();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yayrfycnmbpeeintfcvf.supabase.co';
const supabaseKey = 'sb_publishable_uDGW5qXObQq5NseQGJVwTQ_ZgIur68-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Published Events:', JSON.stringify(data, null, 2));
  }
}

checkEvents();

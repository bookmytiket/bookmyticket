const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yayrfycnmbpeeintfcvf.supabase.co';
const supabaseKey = 'sb_publishable_uDGW5qXObQq5NseQGJVwTQ_ZgIur68-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvents() {
  // Try explicit join with table!column syntax
  const { data, error } = await supabase
    .from('events')
    .select('id, title, tournament_events!event_id(*)')
    .limit(1);
  
  if (error) {
    console.error('Explicit Join Error:', error);
    
    // Try without join to see if events exist
    const { data: d2, error: e2 } = await supabase.from('events').select('id, title').limit(1);
    console.log('Events without join:', d2, e2);
  } else {
    console.log('Events with join:', data);
  }
}

checkEvents();


const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvents() {
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, organiser_id, type')
    .limit(10);
  
  if (error) {
    console.error('Error fetching events:', error);
    return;
  }
  
  console.log('Sample Events:');
  console.table(events);

  const { data: tourney, error: tError } = await supabase
    .from('tournament_events')
    .select('id, event_name, organiser_id')
    .limit(10);

  if (tError) {
    console.error('Error fetching tournament events:', tError);
  } else {
    console.log('Sample Tournament Events:');
    console.table(tourney);
  }
}

checkEvents();

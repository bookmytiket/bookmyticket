
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  // Check events table
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('*')
    .limit(1);

  if (eventData && eventData[0]) {
    console.log('Events columns:', Object.keys(eventData[0]));
    console.log('Events status:', eventData[0].status);
    console.log('Events publish_status:', eventData[0].publish_status);
  }

  // Check tournament_events table
  const { data: tourneyData, error: tourneyError } = await supabase
    .from('tournament_events')
    .select('*')
    .limit(1);

  if (tourneyData && tourneyData[0]) {
    console.log('Tournament Events columns:', Object.keys(tourneyData[0]));
  } else if (tourneyError) {
    console.error('Tournament Events error:', tourneyError);
  }
}

checkColumns();

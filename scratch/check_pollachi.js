
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Try to find .env file
const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPollachiTrophy() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .ilike('title', '%Pollachi Trophy%');

  if (error) {
    console.error('Error fetching event:', error);
    return;
  }

  console.log('Pollachi Trophy Events:');
  console.log(JSON.stringify(data, null, 2));

  if (data.length > 0) {
    const eventId = data[0].id;
    const { data: tourneyData, error: tourneyError } = await supabase
      .from('tournament_events')
      .select('*')
      .eq('event_id', eventId);
    
    if (tourneyError) {
      console.error('Error fetching tournament data:', tourneyError);
    } else {
      console.log('Tournament Data:');
      console.log(JSON.stringify(tourneyData, null, 2));
    }
  }
}

checkPollachiTrophy();

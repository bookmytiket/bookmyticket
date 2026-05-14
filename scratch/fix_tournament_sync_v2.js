
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function fixTournament() {
  const title = 'Pollachi Trophy 2026';
  const { data: event, error: eError } = await supabase.from('events').select('*').ilike('title', `%${title}%`).single();
  
  if (eError || !event) {
    console.error('Event not found:', title);
    return;
  }

  console.log('Found event:', event.id);

  const tourneyRecord = {
    id: event.id,
    organiser_id: event.organiser_id,
    event_name: event.title,
    sport_type: 'Cricket',
    tournament_format: 'Knockout',
    registration_fee: 1999,
    status: 'published',
    metadata: {
      prizePool: '₹50,000',
      contactPhone: '9876543210'
    }
  };

  const { data, error } = await supabase.from('tournament_events').upsert(tourneyRecord);
  if (error) {
    console.error('Upsert failed:', error);
  } else {
    console.log('Successfully synced tournament record using Service Role for:', title);
  }
}

fixTournament();

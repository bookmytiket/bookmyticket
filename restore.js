import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function restore() {
  const eventId = '87e2f9b4-9e5f-4afc-a499-49cb72d2263e';
  
  // Recreate in events table
  await supabase.from('events').insert([{
    id: eventId,
    title: 'உடுமலை பசுமை மாரத்தான் - அத்தியாயம் 1',
    category: 'Sports',
    type: 'Marathon',
    status: 'published',
    approval_status: 'approved',
    publish_status: 'published',
    listing_status: 'active',
    location: 'Kuttai thidal, Udumalpet',
    city: 'Udumalpet',
    is_public: true,
    is_bookable: true,
    organiser_id: 'a0b94df0-7817-488d-a417-8eeb2de00570', // Dummy or find true organiser if possible
    ticket_mode: 'paid'
  }]);

  // Recreate in marathon_events table
  await supabase.from('marathon_events').insert([{
    id: eventId,
    title: 'உடுமலை பசுமை மாரத்தான் - அத்தியாயம் 1',
    subtitle: 'Kuttai thidal, Udumalpet',
    city: 'Udumalpet',
    status: 'published'
  }]);
  
  console.log("Restored basic event record.");
}
restore();

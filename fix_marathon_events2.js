import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const eventId = '87e2f9b4-9e5f-4afc-a499-49cb72d2263e';
  const orgId = 'c8746855-b85c-451f-a177-c1d6470ea10b';
  const dateStr = '2026-06-20';
  const timeStr = '06:00';
  const imgUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-images/marathons/posters/0.668242075591063.jpeg`;

  const { error: e2 } = await supabase.from('marathon_events').insert([{
    id: eventId,
    title: 'உடுமலை பசுமை மாரத்தான் - அத்தியாயம் 1',
    subtitle: 'Kuttai thidal, Udumalpet',
    city: 'Coimbatore',
    district: 'Coimbatore',
    state: 'Tamil Nadu', // Added state
    status: 'published',
    event_date: dateStr,
    event_time: timeStr,
    banner_image: imgUrl,
    organiser_id: orgId,
    venue: 'Kuttai thidal',
    reporting_time: '05:00', // Just in case it's required
    registration_deadline: dateStr // Just in case
  }]);
  console.log("Marathon Events Error:", e2);
}
check();

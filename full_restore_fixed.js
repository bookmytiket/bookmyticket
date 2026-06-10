import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fullRestore() {
  const eventId = '87e2f9b4-9e5f-4afc-a499-49cb72d2263e';
  const orgId = 'c8746855-b85c-451f-a177-c1d6470ea10b'; // TVK youthwingudumalpet
  
  const dateStr = '2026-06-20';
  const timeStr = '06:00';
  const imgUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-images/marathons/posters/0.668242075591063.jpeg`;

  console.log("Inserting into events...");
  const { error: e1 } = await supabase.from('events').insert([{
    id: eventId,
    title: 'உடுமலை பசுமை மாரத்தான் - அத்தியாயம் 1',
    category: 'Sports',
    type: 'Marathon',
    event_type: 'Marathon Event',
    status: 'published',
    approval_status: 'approved',
    publish_status: 'published',
    listing_status: 'active',
    location: 'Kuttai thidal, Udumalpet',
    city: 'Coimbatore',
    district: 'Coimbatore',
    is_free: false,
    organiser_id: orgId,
    ticket_mode: 'paid',
    date: dateStr,
    time: timeStr,
    start_date: dateStr,
    end_date: dateStr,
    img: imgUrl,
    banner_preview: imgUrl,
    featured: true,
    spotlight: true,
    exclusive: true,
    is_deleted: false,
    dynamic_config: JSON.stringify({
        marathonCategories: [
            { id: 1, name: "3KM Kids Run", distance: "3", price: "299" },
            { id: 2, name: "5KM Fun Run", distance: "5", price: "399" },
            { id: 3, name: "10KM Challenge", distance: "10", price: "499" }
        ]
    })
  }]);
  console.log("Events Error:", e1);

  console.log("Inserting into marathon_events...");
  const { error: e2 } = await supabase.from('marathon_events').insert([{
    id: eventId,
    title: 'உடுமலை பசுமை மாரத்தான் - அத்தியாயம் 1',
    subtitle: 'Kuttai thidal, Udumalpet',
    city: 'Coimbatore',
    district: 'Coimbatore',
    status: 'published',
    event_date: dateStr,
    event_time: timeStr,
    banner_image: imgUrl,
    organiser_id: orgId
  }]);
  console.log("Marathon Events Error:", e2);

  console.log("Inserting into marathon_config...");
  const { error: e3 } = await supabase.from('marathon_config').insert([{
    id: eventId,
    event_id: eventId,
    tshirt_enabled: true,
    category_configs: JSON.stringify([
            { id: 1, name: "3KM Kids Run", distance: "3", price: "299" },
            { id: 2, name: "5KM Fun Run", distance: "5", price: "399" },
            { id: 3, name: "10KM Challenge", distance: "10", price: "499" }
    ])
  }]);
  console.log("Marathon Config Error:", e3);
}
fullRestore();

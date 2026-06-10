import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fullRestore() {
  const eventId = '87e2f9b4-9e5f-4afc-a499-49cb72d2263e';
  
  // 1. Get Organiser ID from C3 RUN RIDERS CLUB
  const { data: c3Data } = await supabase.from('events').select('organiser_id').eq('title', 'C3 RUN RIDERS CLUB').limit(1);
  const orgId = (c3Data && c3Data.length > 0) ? c3Data[0].organiser_id : 'a0b94df0-7817-488d-a417-8eeb2de00570'; // fallback
  console.log("Using Organiser ID:", orgId);

  const dateStr = '2026-06-20';
  const timeStr = '06:00';
  const imgUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-images/marathons/posters/0.668242075591063.jpeg`;

  // 2. Insert into events
  await supabase.from('events').insert([{
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
    city: 'Coimbatore', // Keep it in Coimbatore so it shows up for the user
    district: 'Coimbatore',
    is_public: true,
    is_bookable: true,
    organiser_id: orgId,
    ticket_mode: 'paid',
    date: dateStr,
    time: timeStr,
    start_date: dateStr,
    end_date: dateStr,
    img: imgUrl,
    banner_preview: imgUrl,
    featured: true,
    is_spotlight: true,
    is_exclusive: true,
    is_deleted: false
  }]);

  // 3. Insert into marathon_events
  await supabase.from('marathon_events').insert([{
    id: eventId,
    title: 'உடுமலை பசுமை மாரத்தான் - அத்தியாயம் 1',
    subtitle: 'Kuttai thidal, Udumalpet',
    city: 'Coimbatore',
    district: 'Coimbatore',
    status: 'published',
    date: dateStr,
    time: timeStr,
    banner_image: imgUrl,
    organiser_id: orgId
  }]);

  // 4. Insert into marathon_config
  // This is required for the organiser panel "Edit Marathon" flow to work properly
  await supabase.from('marathon_config').insert([{
    id: eventId,
    event_id: eventId, // Some legacy views might use event_id
    organiser_id: orgId,
    status: 'published',
    form_data: JSON.stringify({
        basicInfo: {
            title: 'உடுமலை பசுமை மாரத்தான் - அத்தியாயம் 1',
            subtitle: 'Kuttai thidal, Udumalpet',
            city: 'Coimbatore',
            district: 'Coimbatore',
            venue: 'Kuttai thidal',
            date: dateStr,
            time: timeStr,
            banner_image: imgUrl
        },
        marathonCategories: [
            { id: 1, name: "3KM Kids Run", distance: "3", price: "299" },
            { id: 2, name: "5KM Fun Run", distance: "5", price: "399" },
            { id: 3, name: "10KM Challenge", distance: "10", price: "499" }
        ],
        addons: [],
        sponsors: [],
        prizes: []
    })
  }]);

  console.log("Full restore completed successfully!");
}
fullRestore();

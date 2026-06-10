import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function update() {
  const eventId = '87e2f9b4-9e5f-4afc-a499-49cb72d2263e';
  const imgUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-images/marathons/posters/0.668242075591063.jpeg`;
  
  await supabase.from('events').update({ 
    img: imgUrl,
    banner_preview: imgUrl
  }).eq('id', eventId);

  await supabase.from('marathon_events').update({ 
    banner_image: imgUrl
  }).eq('id', eventId);
  
  console.log("Attached image!");
}
update();

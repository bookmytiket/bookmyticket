import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('events').select('id, title, img, banner_preview, category').in('title', ['உடுமலை பசுமை மாரத்தான் - அத்தியாயம் 1', 'C3 RUN RIDERS CLUB']);
  console.log("EVENTS:", data);

  // We should delete the ones that have category 'Others' and no img/banner
  for (const ev of data) {
    if (ev.category === 'Others' || ev.category === 'OTHERS') {
      console.log(`Deleting dummy/demo event ${ev.id}`);
      await supabase.from('events').delete().eq('id', ev.id);
    }
  }
}
check();

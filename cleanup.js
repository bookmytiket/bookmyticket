import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: eData } = await supabase.from('events').select('id');
  const validIds = new Set(eData.map(e => e.id));

  const { data: mData } = await supabase.from('marathon_events').select('id, title');
  for (const m of mData) {
    if (!validIds.has(m.id)) {
      console.log(`Orphan Marathon: ${m.id} - ${m.title}`);
      await supabase.from('marathon_events').delete().eq('id', m.id);
    }
  }

  const { data: tData } = await supabase.from('tournament_events').select('id, event_id, event_name');
  for (const t of tData) {
    const idToCheck = t.event_id || t.id;
    if (!validIds.has(idToCheck)) {
      console.log(`Orphan Tournament: ${idToCheck} - ${t.event_name}`);
      await supabase.from('tournament_events').delete().eq('id', t.id);
    }
  }
}
check();

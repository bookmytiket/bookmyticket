import { supabase } from '../lib/supabase.js';

async function test() {
  const { data, error } = await supabase.from('service_availability').select('*').limit(1);
  console.log("SELECT:", { data, error });

  if (error) return;

  const { data: upsertData, error: upsertError } = await supabase.from('service_availability').upsert({
    vendor_id: 'test-vendor-id',
    blocked_dates: ['2026-04-21']
  }, { onConflict: 'vendor_id' }).select();

  console.log("UPSERT:", { data: upsertData, error: upsertError });
}
test();

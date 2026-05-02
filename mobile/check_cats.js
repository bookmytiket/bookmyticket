
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  const { data: providers } = await supabase.from('service_providers').select('category');
  const cats = new Set(providers?.map(p => p.category));
  console.log('Provider Categories:', Array.from(cats));

  const { data: turfs } = await supabase.from('turfs').select('name');
  console.log('Turfs Count:', turfs?.length);
}

check();

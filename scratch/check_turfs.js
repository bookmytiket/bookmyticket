
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yayrfycnmbpeeintfcvf.supabase.co';
const supabaseKey = 'sb_publishable_uDGW5qXObQq5NseQGJVwTQ_ZgIur68-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTurfs() {
  const { data, error } = await supabase.from('turfs').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Turfs:', data.length);
  data.forEach(t => {
    console.log(`- ${t.name} (Status: ${t.status})`);
  });
}

checkTurfs();

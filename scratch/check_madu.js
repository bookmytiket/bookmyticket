
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yayrfycnmbpeeintfcvf.supabase.co';
const supabaseKey = 'sb_publishable_uDGW5qXObQq5NseQGJVwTQ_ZgIur68-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMaduSettings() {
  const { data, error } = await supabase.from('service_providers').select('*').eq('business_name', 'Madu S').single();
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Madu S:', data.business_name);
  console.log('Category:', data.category);
  console.log('Advanced Settings:', data.advanced_settings);
}

checkMaduSettings();

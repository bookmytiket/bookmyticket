
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yayrfycnmbpeeintfcvf.supabase.co';
const supabaseKey = 'sb_publishable_uDGW5qXObQq5NseQGJVwTQ_ZgIur68-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkServiceProviders() {
  const { data, error } = await supabase.from('service_providers').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Service Providers:', data.length);
  data.forEach(p => {
    console.log(`- ${p.business_name} (Status: ${p.status}, Category: ${p.category})`);
  });
}

checkServiceProviders();

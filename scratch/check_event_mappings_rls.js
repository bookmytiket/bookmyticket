const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function check() {
  console.log("1. Querying with SERVICE ROLE KEY:");
  const clientService = createClient(url, serviceKey);
  const { data: dataService, error: errorService } = await clientService
    .from('event_coupon_mapping')
    .select('*, partner_campaigns(*), events(title)');
  
  if (errorService) {
    console.error("Service Role Error:", errorService.message);
  } else {
    console.log("Service Role Data count:", dataService.length);
    console.log("Service Role Data:", dataService);
  }

  console.log("\n2. Querying with ANON KEY:");
  const clientAnon = createClient(url, anonKey);
  const { data: dataAnon, error: errorAnon } = await clientAnon
    .from('event_coupon_mapping')
    .select('*, partner_campaigns(*), events(title)');
  
  if (errorAnon) {
    console.error("Anon Key Error:", errorAnon.message);
  } else {
    console.log("Anon Key Data count:", dataAnon.length);
    console.log("Anon Key Data:", dataAnon);
  }
}

check();

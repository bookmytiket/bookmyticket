const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugVendors() {
  console.log('Querying vendors table...');
  const { data, error } = await supabase.from('vendors').select('*');
  
  if (error) {
    console.error('Error fetching vendors:', error);
    return;
  }
  
  console.log(`Found ${data.length} records in vendors table.`);
  data.forEach((v, i) => {
    console.log(`\nRecord ${i + 1}:`);
    console.log(`- ID: ${v.id}`);
    console.log(`- Type: ${v.type}`);
    console.log(`- Business Name: ${v.business_name}`);
    console.log(`- KYC Status: ${v.kyc_status}`);
    console.log(`- Category: ${v.category}`);
    console.log(`- Details exists: ${!!v.kyc_details}`);
  });
}

debugVendors();

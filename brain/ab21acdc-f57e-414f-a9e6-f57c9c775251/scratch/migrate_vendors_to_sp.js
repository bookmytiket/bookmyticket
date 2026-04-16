const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  console.log('Initiating migration of Professional Services to service_providers (Baseline Columns)...');

  // 1. Fetch professional services from vendors table
  const { data: vendors, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .eq('type', 'professional_service');

  if (vendorError) {
    console.error('Failed to fetch vendors:', vendorError);
    return;
  }

  console.log(`Found ${vendors?.length || 0} professional services in vendors table.`);

  if (!vendors || vendors.length === 0) {
    console.log('No professional services found to migrate.');
    return;
  }

  // 2. Map and Upsert into service_providers
  // Using ONLY verified columns: id, business_name, category, status
  const serviceProvidersData = vendors.map(v => ({
    id: v.id,
    business_name: v.business_name,
    category: v.category,
    status: v.is_approved ? 'Approved' : 'Pending'
  }));

  console.log('Preparing to upsert into service_providers...');
  const { error: insertError } = await supabase
    .from('service_providers')
    .upsert(serviceProvidersData, { onConflict: 'id' });

  if (insertError) {
    console.error('Migration failed details:', insertError);
  } else {
    console.log('Migration successful! All identified professional services are now in service_providers with baseline data.');
  }
}

migrate();

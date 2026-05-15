// Apply hotfix via direct postgres connection using service role
const { createClient } = require('@supabase/supabase-js');

// Load environment variables for secrets
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  { auth: { persistSession: false } }
);

async function applyHotfix() {
  console.log('Applying is_staff_of() hotfix...\n');

  // Use pg_catalog to run DDL via a stored procedure approach
  // First try calling existing exec_sql or similar helper
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE OR REPLACE FUNCTION public.is_staff_of(target_organiser_id UUID)
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM public.staff
          WHERE staff.auth_user_id = auth.uid()
            AND staff.organiser_id = target_organiser_id
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  });

  if (error) {
    console.log('exec_sql RPC not available:', error.message);
    
    // Try alternative: insert into a migration tracking table and trigger
    // OR just verify current state
    const { data: check, error: checkErr } = await supabase
      .from('staff')
      .select('auth_user_id')
      .limit(1);
    
    if (checkErr) {
      console.log('staff.auth_user_id check failed:', checkErr.message);
    } else {
      console.log('✅ Confirmed: staff.auth_user_id column EXISTS in live DB');
      console.log('\n📋 Please run this SQL in Supabase Dashboard > SQL Editor to fix the function:\n');
      console.log(`CREATE OR REPLACE FUNCTION public.is_staff_of(target_organiser_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.staff
    WHERE staff.auth_user_id = auth.uid()
      AND staff.organiser_id = target_organiser_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`);
    }
  } else {
    console.log('✅ Hotfix applied successfully!');
  }
}

applyHotfix();

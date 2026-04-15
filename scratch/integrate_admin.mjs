import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function integrateAdmin() {
  // 1. Find the admin in auth.users + profiles
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username')
    .eq('role', 'admin')
    .maybeSingle();

  if (error) {
    console.error("Error finding admin profile:", error);
    return;
  }

  if (!profile) {
    console.log("No profile found with role = 'admin'. Cannot integrate.");
    return;
  }

  console.log(`Found Master Admin profile: ${profile.username} (ID: ${profile.id})`);

  // 2. Insert into admins table
  const { error: adminInsertError } = await supabaseAdmin
    .from('admins')
    .upsert({
      id: profile.id,
      role: 'Admin',
      updated_at: new Date().toISOString()
    });

  if (adminInsertError) {
    console.error("Failed to insert into admins table:", adminInsertError);
  } else {
    console.log("Successfully integrated Master Admin into the 'admins' backend table.");
  }

  // 3. Drop the recursive RLS policy so they can actually log in!
  const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', { 
      query: "DROP POLICY IF EXISTS \"Admins have full access to profiles\" ON public.profiles;"
  });
  
  if (rlsError) {
      console.log("Note: Could not drop RLS programmatically, please run fix_recursion.sql manually if login fails.");
  }

}

integrateAdmin();

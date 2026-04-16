const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log("Checking current administrators...");
  const { data: admins, error: adminErr } = await supabase
    .from('admins')
    .select('*, profiles(email, username)');

  if (adminErr) {
    console.error("Error fetching admins:", adminErr.message);
  } else {
    console.log("Admins:", JSON.stringify(admins, null, 2));
  }

  console.log("\nChecking specific users...");
  const emails = ['rajavasu97@gmail.com', 'hello@bookmyticket.net'];
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, email, role')
    .in('email', emails);

  if (profileErr) {
    console.error("Error fetching profiles:", profileErr.message);
  } else {
    console.log("Profiles:", JSON.stringify(profiles, null, 2));
  }
}

checkUsers();

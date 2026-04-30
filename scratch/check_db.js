const { createClient } = require('@supabase/supabase-js');

async function checkTable() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log("Checking contact_inquiries table...");
  const { data, error, count } = await supabase
    .from('contact_inquiries')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error("Error checking table:", error.message);
    if (error.message.includes("does not exist")) {
        console.log("TABLE DOES NOT EXIST!");
    }
  } else {
    console.log("Table exists. Row count:", count);
  }
}

checkTable();

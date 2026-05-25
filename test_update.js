const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
  const { data, error } = await supabase
    .from("partner_requests")
    .update({
      status: "KYC Initiated",
      kyc_status: "Pending",
      approved_at: new Date().toISOString(),
      access_granted_at: null
    })
    .eq("id", "218e6abf-502a-48e0-86b1-daab8f524f26")
    .select();
  console.log("Update:", data, error);
}
run();

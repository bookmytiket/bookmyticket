const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
  const client = createClient(url, serviceKey);
  console.log("Checking user_coupon_rewards relationships...");
  const { data, error } = await client
    .from('user_coupon_rewards')
    .select('*, profiles(full_name, email), coupon_inventory(coupon_code, partner_campaigns(campaign_name, offer_title, partners(name)))')
    .limit(5);

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Success! Data count:", data.length);
  }
}

check();

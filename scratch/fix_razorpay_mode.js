const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRazorpayMode() {
  const { data, error } = await supabase
    .from('payment_gateways')
    .select('*')
    .eq('name', 'Razorpay')
    .single();

  if (error) {
    console.error('Error fetching Razorpay gateway:', error);
    return;
  }

  console.log('Current Razorpay Gateway:', data);

  if (data.test_mode) {
    console.log('Updating test_mode to false...');
    const { error: updateError } = await supabase
      .from('payment_gateways')
      .update({ test_mode: false })
      .eq('id', data.id);

    if (updateError) {
      console.error('Error updating test_mode:', updateError);
    } else {
      console.log('Successfully updated test_mode to false.');
    }
  } else {
    console.log('test_mode is already false.');
  }
}

fixRazorpayMode();

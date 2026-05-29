const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const email = 'v.raja2mail@gmail.com';
  
  // 1. Ensure user exists in auth.users
  const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
  const exists = users.users.find(u => u.email === email);
  if (!exists) {
    await supabaseAdmin.auth.admin.createUser({ email, password: 'password123', email_confirm: true });
    console.log("Created test user");
  }

  // 2. Insert OTP
  await supabaseAdmin.from('otps').upsert({
    identifier: email,
    code: '789183',
    purpose: 'login',
    expires_at: new Date(Date.now() + 600000).toISOString()
  }, { onConflict: 'identifier' });
  console.log("Inserted OTP");

  // 3. Verify OTP via fetch to localhost:3000
  const res = await fetch('http://localhost:3000/api/auth/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'verify', email, code: '789183', purpose: 'login' })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}
run();

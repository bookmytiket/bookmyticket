const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Manual parse of .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkConfig() {
  try {
    const { data, error } = await supabase.from('email_settings').select('*').single();
    if (error) {
      console.error('Config Fetch Error:', error.message);
    } else {
      console.log('Provider:', data.provider);
      console.log('From Email:', data.from_email);
      console.log('Host:', data.host);
      console.log('Port:', data.port);
      console.log('Encryption:', data.encryption);
      console.log('M365 Config Present:', !!data.microsoft_365);
    }
  } catch (err) {
    console.error('Catch Error:', err.message);
  }
}

checkConfig();

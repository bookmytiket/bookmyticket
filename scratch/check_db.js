
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
const envPath = path.join(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConfig() {
  console.log("Checking systemConfig (camelCase)...");
  try {
      const { data: camelData, error: camelError } = await supabase.from('systemConfig').select('*').maybeSingle();
      console.log("systemConfig:", camelData, camelError);
  } catch (e) {
      console.log("systemConfig table likely missing or error:", e.message);
  }

  console.log("\nChecking system_config (snake_case) for maintenance...");
  try {
      const { data: snakeData, error: snakeError } = await supabase.from('system_config').select('*').eq('key', 'maintenance_mode').maybeSingle();
      console.log("system_config (maintenance_mode):", snakeData, snakeError);
  } catch (e) {
      console.log("system_config table likely missing or error:", e.message);
  }
  
  console.log("\nChecking system_config (snake_case) for all keys...");
  try {
      const { data: allSnake, error: allSnakeError } = await supabase.from('system_config').select('key');
      console.log("all keys in system_config:", allSnake?.map(s => s.key), allSnakeError);
  } catch (e) {
      console.log("system_config error:", e.message);
  }
}

checkConfig();

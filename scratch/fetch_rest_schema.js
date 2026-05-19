const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
  const res = await fetch(url, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  const data = await res.json();
  console.log("Tables/Views/RPCs exposed:");
  console.log("Paths:", Object.keys(data.paths));
  console.log("Definitions:", Object.keys(data.definitions || {}));
}

check();

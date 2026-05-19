const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function inspect() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
  const res = await fetch(url, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  const data = await res.json();
  fs.writeFileSync('scratch/openapi_schema.json', JSON.stringify(data, null, 2));
  console.log("Schema written to scratch/openapi_schema.json!");
  console.log("Tables found:", Object.keys(data.definitions || {}));
}

inspect();

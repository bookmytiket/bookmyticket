require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const sql = fs.readFileSync('supabase/migrations/20260603000003_generic_tournaments_location.sql', 'utf8');
  await client.query(sql);
  console.log('Migration applied.');
  await client.end();
}
run().catch(console.error);

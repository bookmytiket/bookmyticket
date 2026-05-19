const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const dbUrl = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const sql = fs.readFileSync('scratch/20260524_wallet_settlement_system.sql', 'utf8');
    await client.query(sql);
    console.log('Database migrated successfully!');
  } catch (e) {
    console.error('Migration failed:', e.message);
  } finally {
    await client.end();
  }
}
run();

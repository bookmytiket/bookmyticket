const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20260521_partner_coupon_redemption_system.sql'), 'utf8');

// Split into individual statements, skip empty lines and comments
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 5 && !s.startsWith('--'));

async function applyMigration() {
  console.log(`Applying ${statements.length} SQL statements to hosted Supabase [${projectRef}] via Management API...`);
  
  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.slice(0, 80).replace(/\n/g, ' ');
    
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({ query: stmt })
      });
      
      if (res.ok) {
        console.log(`[${i+1}/${statements.length}] ✅ ${preview}`);
        success++;
      } else {
        const err = await res.text();
        console.log(`[${i+1}/${statements.length}] ❌ FAILED ${preview.slice(0, 50)}: ${err.slice(0, 100)}`);
        failed++;
      }
    } catch (e) {
      console.log(`[${i+1}/${statements.length}] ❌ ${preview.slice(0, 50)}: ${e.message}`);
      failed++;
    }
  }
  
  console.log(`\nDone: ${success} success, ${failed} failed`);
}

applyMigration().catch(e => console.error('Fatal:', e));

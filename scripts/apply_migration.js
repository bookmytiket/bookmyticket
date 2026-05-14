#!/usr/bin/env node
// Apply migration by chunking SQL statements and running them via the apply-migration API
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_ID = SUPABASE_URL.replace('https://', '').split('.')[0];

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const sql = fs.readFileSync(path.join(__dirname, 'supabase/migrations/20260514_complete_schema.sql'), 'utf8');

// Split into individual statements, skip empty lines and comments
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 5 && !s.startsWith('--'));

async function applyMigration() {
  console.log(`Applying ${statements.length} SQL statements...`);
  
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.slice(0, 80).replace(/\n/g, ' ');
    
    try {
      const res = await global.fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_migration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({ sql: stmt })
      });
      
      if (res.ok) {
        console.log(`[${i+1}/${statements.length}] ✅ ${preview}`);
        success++;
      } else {
        // Try admin API
        const res2 = await global.fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_KEY}`
          },
          body: JSON.stringify({ query: stmt })
        });
        if (res2.ok) {
          console.log(`[${i+1}/${statements.length}] ✅ (admin API) ${preview}`);
          success++;
        } else {
          const err = await res2.text();
          console.log(`[${i+1}/${statements.length}] ⚠️ SKIP ${preview.slice(0, 50)}: ${err.slice(0, 100)}`);
          skipped++;
        }
      }
    } catch (e) {
      console.log(`[${i+1}/${statements.length}] ❌ ${preview.slice(0, 50)}: ${e.message}`);
      failed++;
    }
  }
  
  console.log(`\nDone: ${success} success, ${skipped} skipped, ${failed} failed`);
}

applyMigration().catch(e => console.error('Fatal:', e));

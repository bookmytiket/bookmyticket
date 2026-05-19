const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const migrationsDir = path.join(__dirname, '../supabase/migrations');
const files = fs.readdirSync(migrationsDir);

// Extract unique prefixes (excluding 20260521)
const prefixes = [...new Set(
  files
    .map(f => f.split('_')[0])
    .filter(p => /^\d+$/.test(p) && p !== '20260521')
)].sort();

console.log(`Found ${prefixes.length} migrations to repair:`, prefixes);

for (const prefix of prefixes) {
  console.log(`\n----------------------------------------`);
  console.log(`Repairing migration version: ${prefix}`);
  try {
    const output = execSync(`npx supabase migration repair --status applied ${prefix}`, { encoding: 'utf-8' });
    console.log(output);
  } catch (err) {
    console.error(`Failed to repair version ${prefix}:`, err.message);
  }
}

console.log('\nMigration repair completed!');

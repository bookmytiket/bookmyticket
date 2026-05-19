const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const migrationsDir = path.join(__dirname, '../supabase/migrations');
const tempDir = path.join(__dirname, '../temp_migrations');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const files = fs.readdirSync(migrationsDir);
const targetMigration = '20260521_partner_coupon_redemption_system.sql';

console.log('Moving other migrations to temporary folder...');
let movedCount = 0;
for (const file of files) {
  if (file !== targetMigration) {
    fs.renameSync(
      path.join(migrationsDir, file),
      path.join(tempDir, file)
    );
    movedCount++;
  }
}
console.log(`Moved ${movedCount} migration files.`);

let pushSuccess = false;
try {
  console.log('\nRunning supabase db push for the target migration...');
  const output = execSync('npx supabase db push --yes', { encoding: 'utf-8' });
  console.log(output);
  pushSuccess = true;
} catch (err) {
  console.error('\nDatabase push failed:', err.message);
  if (err.stdout) console.log('Stdout:', err.stdout);
  if (err.stderr) console.log('Stderr:', err.stderr);
}

console.log('\nRestoring other migrations back to original folder...');
const tempFiles = fs.readdirSync(tempDir);
let restoredCount = 0;
for (const file of tempFiles) {
  fs.renameSync(
    path.join(tempDir, file),
    path.join(migrationsDir, file)
  );
  restoredCount++;
}
console.log(`Restored ${restoredCount} migration files.`);

fs.rmdirSync(tempDir);
console.log('\nTemporary directory cleaned up.');

if (pushSuccess) {
  console.log('\n✅ SUCCESS: Migration applied successfully!');
} else {
  console.log('\n❌ FAILED: Migration was not applied.');
}

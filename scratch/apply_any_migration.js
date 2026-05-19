const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const migrationsDir = path.join(__dirname, '../supabase/migrations');
const tempDir = path.join(__dirname, '../temp_migrations');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const files = fs.readdirSync(migrationsDir).sort();
const grouped = {};

const targetMigration = '20260523_add_missing_foreign_keys.sql';

console.log(`Target migration is: ${targetMigration}`);

// Group files by prefix
for (const file of files) {
  if (file.endsWith('.sql')) {
    const prefix = file.split('_')[0];
    if (!grouped[prefix]) {
      grouped[prefix] = [];
    }
    grouped[prefix].push(file);
  }
}

console.log('Grouping migration files by prefix...');
let movedCount = 0;

for (const [prefix, list] of Object.entries(grouped)) {
  // If the target migration is in this list, we want to keep it in migrationsDir
  const hasTarget = list.includes(targetMigration);

  if (hasTarget) {
    // Keep targetMigration, keep one representative of the prefix if there is another file with same prefix
    console.log(`Prefix ${prefix} has the target migration. Keeping it.`);
    for (const file of list) {
      if (file !== targetMigration) {
        fs.renameSync(
          path.join(migrationsDir, file),
          path.join(tempDir, file)
        );
        movedCount++;
      }
    }
  } else {
    // Standard deduplication
    if (list.length > 1) {
      console.log(`Prefix ${prefix} has ${list.length} files. Keeping ${list[0]}, moving others...`);
      for (let i = 1; i < list.length; i++) {
        fs.renameSync(
          path.join(migrationsDir, list[i]),
          path.join(tempDir, list[i])
        );
        movedCount++;
      }
    }
  }
}

console.log(`\nMoved ${movedCount} duplicate migration files to temporary folder.`);

let pushSuccess = false;
try {
  console.log('\nRunning supabase db push...');
  const output = execSync('npx supabase db push --yes', { encoding: 'utf-8' });
  console.log(output);
  pushSuccess = true;
} catch (err) {
  console.error('\nDatabase push failed:', err.message);
  if (err.stdout) console.log('Stdout:', err.stdout);
  if (err.stderr) console.log('Stderr:', err.stderr);
}

console.log('\nRestoring all duplicate migration files...');
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

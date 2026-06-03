const fs = require('fs');
const path = require('path');

const dir = 'supabase/migrations';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Regex to match CREATE POLICY "name" ON public.table
  const regex = /CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+public\.([a-zA-Z0-9_]+)/g;
  
  content = content.replace(regex, (match, policyName, tableName) => {
    // Check if there's already a DROP POLICY right before it
    // But since it's a replace, we can just replace it with DROP POLICY ... \n CREATE POLICY ...
    // Wait, let's just do it cleanly.
    return `DROP POLICY IF EXISTS "${policyName}" ON public.${tableName};\n${match}`;
  });

  // Since we might have duplicated DROP POLICY if it was already there, let's clean up
  // Actually, replacing CREATE POLICY globally without checking is safe if it's idempotent, but could lead to multiple DROP POLICY statements.
  // Let's just do a simpler script that only adds it if missing.

  const lines = content.split('\n');
  const newLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+public\.([a-zA-Z0-9_]+)/);
    if (match) {
      const policyName = match[1];
      const tableName = match[2];
      const dropStmt = `DROP POLICY IF EXISTS "${policyName}" ON public.${tableName};`;
      if (i > 0 && lines[i - 1].includes(dropStmt)) {
        newLines.push(line);
      } else {
        newLines.push(dropStmt);
        newLines.push(line);
      }
      changed = true;
    } else {
      newLines.push(line);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, newLines.join('\n'));
    console.log(`Fixed ${file}`);
  }
}

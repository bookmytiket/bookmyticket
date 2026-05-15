const fs = require('fs');
const content = fs.readFileSync('app/organiser/page.js', 'utf8');

try {
    // Basic syntax check using eval-like check (just parsing)
    // We can't really run it, but we can try to see if it parses.
    // However, this is a React component with JSX, so standard JS parser might fail.
} catch (e) {
    console.log("Syntax error detected:", e.message);
}

// Let's just look at the code around line 1889 again with more lines.
const lines = content.split('\n');
const start = 1880;
const end = 1910;
for (let i = start; i < end; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}

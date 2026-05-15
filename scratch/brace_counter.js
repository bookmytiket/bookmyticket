const fs = require('fs');
const content = fs.readFileSync('app/organiser/page.js', 'utf8');
const lines = content.split('\n');

const startLine = 1849;
const endLine = 1963;
let open = 0;
let close = 0;

for (let i = startLine - 1; i < endLine; i++) {
    const line = lines[i];
    const opens = (line.match(/{/g) || []).length;
    const closes = (line.match(/}/g) || []).length;
    open += opens;
    close += closes;
    if (opens > 0 || closes > 0) {
        console.log(`${i + 1}: [${opens}|${closes}] net:${open - close} -- ${line}`);
    }
}

console.log(`Total Open: ${open}, Total Close: ${close}, Balance: ${open - close}`);

const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk('app', function(filePath) {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find all <main> tags with pb- classes
    let modified = false;
    
    // Regex to match <main className="... pb-XX ..."> or <main className={`... pb-XX ...`}>
    const regex = /<main\s+className=(?:"|\{`)([^"`]*?)\b(pb-\d+|pb-\[\d+px\])\b([^"`]*?)(?:"|`\})>/g;
    
    if (regex.test(content) && content.includes('<Footer />')) {
        console.log('Found pb- on main with Footer in:', filePath);
        
        // Reset regex index
        regex.lastIndex = 0;
        
        let pbClass = '';
        content = content.replace(regex, (match, p1, p2, p3) => {
            pbClass = p2;
            let newClass = (p1 + ' ' + p3).replace(/\s+/g, ' ').trim();
            if (match.includes('"')) {
                return '<main className="' + newClass + '">';
            } else {
                return '<main className={`' + newClass + '`}>';
            }
        });
        
        if (pbClass) {
            content = content.replace(/<Footer\s*\/>/g, '<div className="' + pbClass + '"></div>\n            <Footer />');
            fs.writeFileSync(filePath, content);
            modified = true;
            console.log('Fixed:', filePath);
        }
    }
});

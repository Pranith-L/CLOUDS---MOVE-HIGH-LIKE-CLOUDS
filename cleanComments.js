const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove obvious AI comments like "// Init Fabric canvases" or "// Add text to active canvas"
    // We'll just remove single line comments that start with 2 or more spaces followed by // and a capital letter, 
    // or block comments that look very structural like {/* ── LEFT PANEL: Tools ── */}
    
    // Remove JSX structural comments like {/* ── LEFT PANEL: Tools ── */}
    content = content.replace(/[ \t]*\{\/\* ──.*?── \*\/\}\n/g, '');
    content = content.replace(/[ \t]*\{\/\* [a-zA-Z].*? \*\/\}\n/g, '');
    
    // Remove standalone // comments
    content = content.replace(/^[ \t]*\/\/ [A-Z].*?\n/gm, '');
    
    // Remove inline comments like `// front | back`
    content = content.replace(/ \/\/ .*?\n/g, '\n');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Cleaned', filePath);
}

cleanFile(path.join(__dirname, 'client/src/pages/Customizer.jsx'));
cleanFile(path.join(__dirname, 'server/routes/auth.js'));
cleanFile(path.join(__dirname, 'server/routes/products.js'));
cleanFile(path.join(__dirname, 'server/routes/orders.js'));
cleanFile(path.join(__dirname, 'server/routes/ai.js'));
cleanFile(path.join(__dirname, 'server/routes/oauth.js'));
cleanFile(path.join(__dirname, 'server/routes/support.js'));
cleanFile(path.join(__dirname, 'server/index.js'));

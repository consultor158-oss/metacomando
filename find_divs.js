const fs = require('fs');
const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

let stack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let lineNum = i + 1;
    
    // Find all <div and </div> in the line
    let matches = line.matchAll(/<(/?div)([^>]*?)>/g);
    for (const match of matches) {
        let tag = match[1];
        let rest = match[2];
        let isClosing = tag.startsWith('/');
        let isSelfClosing = rest.endsWith('/');
        
        if (isSelfClosing) continue;
        
        if (isClosing) {
            if (stack.length === 0) {
                console.log(`Excessive </div> at line ${lineNum}`);
            } else {
                stack.pop();
            }
        } else {
            stack.push(lineNum);
        }
    }
}

console.log(`Unclosed divs started at lines: ${stack.join(', ')}`);

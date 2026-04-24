const fs = require('fs');
const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

let stack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let lineNum = i + 1;
    
    // Find all <div and </div> in the line
    // Simplified regex to avoid matching complicated cases like attributes with >
    let pos = 0;
    while (true) {
        let openIdx = line.indexOf('<div', pos);
        let closeIdx = line.indexOf('</div', pos);
        
        if (openIdx === -1 && closeIdx === -1) break;
        
        if (openIdx !== -1 && (closeIdx === -1 || openIdx < closeIdx)) {
            // Check if it's self-closing <div ... />
            let tagEnd = line.indexOf('>', openIdx);
            if (tagEnd !== -1) {
                if (line[tagEnd - 1] !== '/') {
                    stack.push(lineNum);
                }
                pos = tagEnd + 1;
            } else {
                // Multi-line tag, assume not self-closing for simplicity
                stack.push(lineNum);
                pos = openIdx + 4;
            }
        } else {
            if (stack.length === 0) {
                console.log(`Excessive </div> at line ${lineNum}`);
            } else {
                stack.pop();
            }
            pos = closeIdx + 5;
        }
    }
}

console.log(`Unclosed divs started at lines: ${stack.join(', ')}`);

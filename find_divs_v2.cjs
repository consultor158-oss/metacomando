const fs = require('fs');
const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

let stack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let lineNum = i + 1;
    
    // Improved regex to handle basic JSX/TSX
    // Match <div and </div> while ignoring self-closing <div ... />
    // We'll use a more manual approach to be safe
    let pos = 0;
    while (pos < line.length) {
        let openIdx = line.indexOf('<div', pos);
        let closeIdx = line.indexOf('</div', pos);
        
        if (openIdx === -1 && closeIdx === -1) break;
        
        if (openIdx !== -1 && (closeIdx === -1 || openIdx < closeIdx)) {
            // Found <div. Now find the closing > of this tag
            let tagEnd = -1;
            let bracketLevel = 0;
            for (let j = openIdx; j < line.length; j++) {
                if (line[j] === '{') bracketLevel++;
                if (line[j] === '}') bracketLevel--;
                if (line[j] === '>' && bracketLevel === 0) {
                    tagEnd = j;
                    break;
                }
            }
            
            if (tagEnd !== -1) {
                // Check if it's self-closing <div ... />
                if (line[tagEnd - 1] !== '/') {
                    stack.push({ lineNum, content: line.trim() });
                }
                pos = tagEnd + 1;
            } else {
                // Multi-line tag, assume not self-closing for now
                stack.push({ lineNum, content: line.trim() });
                pos = openIdx + 4;
            }
        } else {
            // Found </div>
            if (stack.length === 0) {
                console.log(`Excessive </div> at line ${lineNum}`);
            } else {
                stack.pop();
            }
            pos = closeIdx + 5;
        }
    }
}

console.log('Unclosed divs:');
stack.forEach(s => console.log(`Line ${s.lineNum}: ${s.content}`));

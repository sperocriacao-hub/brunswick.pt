const fs = require('fs');
const content = fs.readFileSync('app/admin/modelos/novo/page.tsx', 'utf-8');

let depth = 0;
for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') depth++;
    if (content[i] === '}') depth--;
}
console.log("Difference (positive means unclosed {): ", depth);

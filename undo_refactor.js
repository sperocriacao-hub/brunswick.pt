const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const targetDir = path.join(__dirname, 'app');
const files = walk(targetDir);
let modifiedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Undo 1. Fix cookieStore missing await (it WAS correct)
    content = content.replace(/const\s+cookieStore\s*=\s*await\s+cookies\(\);/g, 'const cookieStore = cookies();');
    
    // Undo 2. Fix supabase createClient missing await (it WAS correct)
    content = content.replace(/const\s+supabase\s*=\s*await\s+createClient\(cookieStore\);/g, 'const supabase = createClient(cookieStore);');

    // We KEEP the try/catch improvement! We don't revert that.

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log(`Reverted asyncs in ${file}`);
    }
}

console.log(`\nCompleted: ${modifiedCount} files updated.`);

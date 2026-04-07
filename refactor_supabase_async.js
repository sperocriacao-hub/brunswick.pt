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
if (!fs.existsSync(targetDir)) {
    console.error("No app directory found");
    process.exit(1);
}

const files = walk(targetDir);
let modifiedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Fix cookieStore missing await
    content = content.replace(/const\s+cookieStore\s*=\s*cookies\(\);/g, 'const cookieStore = await cookies();');
    
    // 2. Fix supabase createClient missing await
    content = content.replace(/const\s+supabase\s*=\s*createClient\(cookieStore\);/g, 'const supabase = await createClient(cookieStore);');

    // 3. Fix error catching to expose messages properly
    content = content.replace(/catch\s*\(\s*err:\s*unknown\s*\)\s*\{([\s\S]*?)return\s+\{\s*success:\s*false,\s*error:\s*err\s+instanceof\s+Error\s*\?\s*err\.message\s*:\s*"([^"]+)"\s*\}\s*;/g, (match, p1, p2) => {
        const fallback = `"${p2}"`;
        return `catch (err: any) {${p1}return { success: false, error: err?.message || ${fallback} };`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log(`Updated ${file}`);
    }
}

console.log(`\nCompleted: ${modifiedCount} files updated.`);

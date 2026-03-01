const { createClient } = require("@supabase/supabase-js");
const fs = require('fs');
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function applyMigration(file) {
    try {
        console.log(`Running \${file}...`);
        const sql = fs.readFileSync(file, 'utf8');
        // Usar a nossa rota API que permite executar RAW SQL bypassando Postgrest
        const res = await fetch(`http://localhost:3000/api/run-migration`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql })
        });
        
        if (res.ok) {
            console.log(`\${file} applied successfully!`);
        } else {
            console.error(`Error applying \${file}:`, await res.text());
        }
    } catch(e) {
        console.log("Error reading file:", e);
    }
}

async function run() {
    await applyMigration('./supabase/migrations/0031_lean_management.sql');
    await applyMigration('./supabase/migrations/0032_hst_seguranca.sql');
}
run();

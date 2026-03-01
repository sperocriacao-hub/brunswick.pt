const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Replace URL
const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    .replace('https://', `postgresql://postgres:${process.env.SUPABASE_SERVICE_ROLE_KEY}@`)
    .replace('.supabase.co', '.pooler.supabase.com:6543/postgres');

async function run() {
    const client = new Client({ connectionString: dbUrl });
    try {
        await client.connect();
        console.log("Connected to Supabase DB via Node PG!");

        const sql31 = fs.readFileSync("./supabase/migrations/0031_lean_management.sql", "utf-8");
        await client.query(sql31);
        console.log("Migration 0031 Lean executed successfully!");

        const sql32 = fs.readFileSync("./supabase/migrations/0032_hst_seguranca.sql", "utf-8");
        await client.query(sql32);
        console.log("Migration 0032 HST executed successfully!");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

run();

const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '/Users/alessandromoura/.gemini/antigravity/playground/brunswick-pt/.env.local' });

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const sql = fs.readFileSync('supabase/migrations/0054_roteiros_sequencia.sql', 'utf8');

    try {
        await client.query(sql);
        console.log("Migration 54 applied successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}
run();

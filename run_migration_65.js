const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '/Users/alessandromoura/.gemini/antigravity/playground/brunswick-pt/.env.local' });

async function run() {
    if (!process.env.DATABASE_URL) {
        console.error("No DATABASE_URL found. Cannot execute raw SQL using pg. Aborting.");
        return;
    }
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const sql = fs.readFileSync('supabase/migrations/0065_aps_production_orders.sql', 'utf8');
        console.log("Executing Migration 65...");
        await client.query(sql);
        console.log("Migration 65 executed successfully.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
    }
}
run();

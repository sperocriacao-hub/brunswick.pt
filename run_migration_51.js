const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '/Users/alessandromoura/.gemini/antigravity/playground/brunswick-pt/.env.local' });

// We need a direct connection string to connect to Supabase Postgres.
// If DATABASE_URL is not fully available, we'll try to use it or construct it.
const dbUrl = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// Wait, NEXT_PUBLIC_SUPABASE_URL is an HTTPS REST url, NOT a postgres connection string.
// Let's print out what env variables we have that might be Postgres strings.
const allEnvKeys = Object.keys(process.env).filter(k => k.toLowerCase().includes('database') || k.toLowerCase().includes('postgres'));
console.log("Found Postgres/Database keys:", allEnvKeys);

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
        const sql = fs.readFileSync('supabase/migrations/0051_tarefas_execucao.sql', 'utf8');
        console.log("Executing Migration 51...");
        await client.query(sql);
        console.log("Migration 51 executed successfully.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
    }
}
run();

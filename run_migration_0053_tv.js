import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZW5udGdsZGppemd5eXR0aWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzI5ODIsImV4cCI6MjA4NzI0ODk4Mn0.1KPq3FBSo5Nn3qNQoHMEMvPBKBa1SYeI72QaUZMXSMc';
const dbUrl = `postgresql://postgres:${serviceKey}@efenntgldjizgyyttiiw.pooler.supabase.com:6543/postgres`;

async function run() {
    const client = new Client(dbUrl);
    try {
        await client.connect();
        console.log("Connected to Supabase DB via Deno Postgres!");

        const sql = await Deno.readTextFile("./supabase/migrations/0053_tv_hero_resilient.sql");
        await client.queryArray(sql);
        console.log("Migration 0053 (TV Hero Resilient w/ Linha fix) executed successfully!");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

run();

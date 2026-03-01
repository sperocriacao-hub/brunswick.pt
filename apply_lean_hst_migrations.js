import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { config } from "https://deno.land/std@0.163.0/dotenv/mod.ts";

const env = await config({ path: ".env.local" });

const dbUrl = env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', 'postgresql://postgres:' + env.SUPABASE_SERVICE_ROLE_KEY + '@').replace('.supabase.co', '.pooler.supabase.com:6543/postgres');

console.log("Connecting via Deno...");
const client = new Client(dbUrl);

try {
    await client.connect();
    console.log("Connected to Supabase DB. Executing migrations...");

    const sql31 = await Deno.readTextFile("./supabase/migrations/0031_lean_management.sql");
    await client.queryArray(sql31);
    console.log("Migration 0031 Lean executed successfully!");

    const sql32 = await Deno.readTextFile("./supabase/migrations/0032_hst_seguranca.sql");
    await client.queryArray(sql32);
    console.log("Migration 0032 HST executed successfully!");

} catch (err) {
    console.error("Migration failed:", err);
} finally {
    await client.end();
}

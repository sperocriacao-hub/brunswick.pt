import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const dbUrl = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL").replace('https://', 'postgresql://postgres:' + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") + '@').replace('.supabase.co', '.pooler.supabase.com:6543/postgres');

console.log("Connecting via Deno...");
const client = new Client(dbUrl);

try {
    await client.connect();
    console.log("Connected to Supabase DB. Executing migration...");

    const sqlContent = await Deno.readTextFile("./supabase/migrations/0024_tpm_nasa_moldes.sql");

    await client.queryArray(sqlContent);
    console.log("Migration 0024 Deno executed successfully!");
} catch (err) {
    console.error("Migration failed:", err);
} finally {
    await client.end();
}

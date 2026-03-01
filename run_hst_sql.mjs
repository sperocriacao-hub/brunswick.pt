import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

const pool = new pg.Pool({
  connectionString: dbUrl + "?sslmode=require"
});

async function main() {
    console.log("Applying 0039_hst_rls.sql...");
    const sql = fs.readFileSync('./supabase/migrations/0039_hst_rls.sql', 'utf8');
    const client = await pool.connect();
    try {
        await client.query(sql);
        console.log("Success.");
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

main().then(() => process.exit(0));

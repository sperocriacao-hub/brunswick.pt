require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  try {
    const fs = require('fs');
    const sql = fs.readFileSync('supabase/migrations/0059_modelos_linha_padrao.sql', 'utf8');
    await pool.query(sql);
    console.log('Migration 59 executed successfully');
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();

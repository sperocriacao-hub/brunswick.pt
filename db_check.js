require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='modelos';");
    console.log(res.rows.map(r => r.column_name));
    
    // Also, let's run the migration just in case
    const fs = require('fs');
    if (fs.existsSync('supabase/migrations/0059_modelos_linha_padrao.sql')) {
       console.log("running migration 59...");
       const sql = fs.readFileSync('supabase/migrations/0059_modelos_linha_padrao.sql', 'utf8');
       await pool.query(sql);
       console.log("migration finished.");
    }
  } catch (e) {
    console.error("ERROR", e.message);
  } finally {
    pool.end();
  }
}
run();

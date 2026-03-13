require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  try {
     const { rows } = await pool.query("SELECT fail_date FROM qcis_audits LIMIT 15");
     console.log(rows);
  } catch(e) {
     console.error(e);
  } finally {
     pool.end();
  }
}
run();

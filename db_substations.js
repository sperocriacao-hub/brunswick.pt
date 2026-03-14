require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
  try {
     const { rows } = await pool.query("SELECT DISTINCT substation_name FROM qcis_audits");
     rows.forEach(r => console.log(r.substation_name));
  } catch(e) {
     console.error(e);
  } finally {
     pool.end();
  }
}
check();

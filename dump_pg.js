require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query(`
      SELECT 
        fail_date::date as dt, 
        TO_CHAR(fail_date, 'Day') as day_name,
        COUNT(*) as cnt,
        COUNT(lista_gate) as with_gate
      FROM qcis_audits
      WHERE fail_date IS NOT NULL
      GROUP BY dt, day_name
      ORDER BY dt DESC;
    `);
    console.log("Dumping all available dates in Database (no limit):");
    console.table(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();

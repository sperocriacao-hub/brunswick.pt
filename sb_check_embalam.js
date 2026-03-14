require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
     const { rows } = await pool.query(`
        SELECT fail_date, boat_id, peca, substation_name, count_of_defects, linha_linha 
        FROM qcis_audits 
        WHERE linha_linha = 'D' AND fail_date >= '2026-03-12'
     `);
     console.log("Total rows found for Linha D >= 2026-03-12:", rows.length);
     const embRows = rows.filter(r => {
        const p = (r.peca || '').toLowerCase();
        const sub = (r.substation_name || '').toLowerCase();
        return p.includes('embalam') || sub.includes('embalam');
     });
     console.log("Embalamento rows:", embRows);
     
     const sumDefects = embRows.reduce((acc, r) => acc + (r.count_of_defects || 0), 0);
     const uniqueBoats = new Set(embRows.map(r => r.boat_id)).size;
     console.log("Defects:", sumDefects, "Boats:", uniqueBoats);
  } catch(e) {
     console.error(e);
  } finally {
     pool.end();
  }
}
run();

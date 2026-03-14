require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function main() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    
    const res = await client.query(`
        SELECT fail_date, COUNT(*) as qty, COUNT(DISTINCT boat_id) as boats
        FROM qcis_audits
        GROUP BY fail_date
        ORDER BY fail_date DESC;
    `);
    
    console.log(res.rows);
    await client.end();
}
main().catch(console.error);

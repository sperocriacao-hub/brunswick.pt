require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  console.log("Fetching January...");
  const { data: janData, error: e1 } = await supabase
    .from('qcis_audits')
    .select('fail_date')
    .gte('fail_date', '2026-01-01')
    .lte('fail_date', '2026-01-31')
    .limit(10);
  
  console.log("Jan 2026 results:", janData ? janData.length : 0, e1 ? e1.message : "");
  if(janData && janData.length > 0) console.log(janData[0]);

  console.log("\nFetching all dates distribution (Group By via raw REST)...");
  // We can't group by via JS client easily, we just fetch a bunch
  const { data: all, error: e2 } = await supabase
    .from('qcis_audits')
    .select('fail_date, id')
    .limit(100000);
    
  if (all) {
    const dates = {};
    all.forEach(r => {
        dates[r.fail_date] = (dates[r.fail_date] || 0) + 1;
    });
    console.log("Total records fetched:", all.length);
    console.log("Dates distribution:", dates);
  } else {
    console.error(e2);
  }
}
check();

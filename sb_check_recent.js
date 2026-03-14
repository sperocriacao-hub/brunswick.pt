require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function check() {
  console.log("Fetching sample data for Line D...");
  const { data, error } = await supabase
    .from('qcis_audits')
    .select('fail_date, boat_id, peca, substation_name, count_of_defects, linha_linha')
    .eq('linha_linha', 'D')
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (error) { 
      console.error(error); 
      return; 
  }
  
  console.log("Recent 20 records for Line D:");
  data.forEach(r => console.log(r.fail_date, "|", r.boat_id, "|", r.peca, "|", r.substation_name, "| Dfs:", r.count_of_defects));
}
check();

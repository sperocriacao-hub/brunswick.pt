require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function check() {
  console.log("Fetching raw SAP records for Embalamento... (Line D, >= 2026-03-12)");
  const { data, error } = await supabase
    .from('qcis_audits')
    .select('id, fail_date, boat_id, peca, component_name, substation_name, count_of_defects, linha_linha')
    .eq('linha_linha', 'D')
    .gte('fail_date', '2026-03-12')
    .lte('fail_date', '2026-03-14');
    
  if (error) { 
      console.error(error); 
      return; 
  }
  
  console.log(`Found ${data.length} total rows in this period.`);
  
  const embData = data.filter(r => {
      const p = (r.peca || '').toLowerCase();
      // Emulate the frontend filter
      return p.includes('embalam') && (p.includes('final') || p.includes('fim') || p.includes('inspe'));
  });
  
  console.log(`Matched ${embData.length} records for Embalamento.`);
  let sum = 0;
  let boats = new Set();
  embData.forEach(r => {
      console.log(`- Date: ${r.fail_date.split('T')[0]} | Boat: ${r.boat_id} | Peça: ${r.peca} | Defects: ${r.count_of_defects}`);
      sum += (r.count_of_defects || 0);
      boats.add(r.boat_id);
  });
  console.log(`Total Defects: ${sum} | Unique Boats: ${boats.size}`);
}
check();

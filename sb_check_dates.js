require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function check() {
  console.log("Fetching sample dates from qcis_audits...");
  const { data, error } = await supabase
    .from('qcis_audits')
    .select('fail_date, linha_linha')
    .limit(20);
    
  if (error) { 
      console.error(error); 
      return; 
  }
  
  console.log(data);
  
  // Specific query for Line D to see what dates are attached
  const { data: dData } = await supabase
    .from('qcis_audits')
    .select('fail_date')
    .eq('linha_linha', 'D')
    .limit(10);
  console.log("Line D specific fail_dates:", dData);
}
check();

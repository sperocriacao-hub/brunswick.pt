require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { count, error } = await supabase
    .from('qcis_audits')
    .select('*', { count: 'exact', head: true });
    
  if (error) { console.error(error); return; }
  console.log("Total unique records in DB after V6.1:", count);
  
  // get unique dates
  const { data: datesData, error: datesError } = await supabase
    .from('qcis_audits')
    .select('fail_date');
    
  if(datesData) {
      const dates = new Set(datesData.map(d => d.fail_date));
      console.log("Unique dates in DB:", Array.from(dates).sort());
  }
}
check();

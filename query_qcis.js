require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('qcis_audits').select('fail_date, count_of_defects, lista_gate, id').limit(100);
  if (error) {
    console.error(error);
    return;
  }
  
  const counts = { dom:0, seg:0, ter:0, qua:0, qui:0, sex:0, sab:0 };
  let validDates = 0;
  let emptyDates = 0;
  
  data.forEach(a => {
    if (!a.fail_date) {
        emptyDates++;
        return;
    }
    validDates++;
    const [y, m, d] = a.fail_date.split('T')[0].split('-');
    const checkDate = new Date(Number(y), Number(m)-1, Number(d), 12, 0, 0);
    const day = ['dom','seg','ter','qua','qui','sex','sab'][checkDate.getDay()];
    counts[day]++;
  });
  
  console.log("Total Records Checked:", data.length);
  console.log("Valid Dates:", validDates);
  console.log("Empty Dates:", emptyDates);
  console.log("Day Distribution:", counts);
  console.log("\nSample Data:", data.slice(0, 5));
}

run();

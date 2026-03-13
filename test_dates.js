require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('qcis_audits').select('fail_date').not('fail_date', 'is', null).order('fail_date', {ascending: false}).limit(50);
  if(error) { console.error(error); return; }
  
  const counts = { dom:0, seg:0, ter:0, qua:0, qui:0, sex:0, sab:0 };
  console.log("Raw Dates from DB Sample:");
  data.forEach((row, i) => {
    const dStr = row.fail_date;
    const dateOnlyStr = dStr ? dStr.substring(0, 10) : "";
    let day = -1;
    if(dateOnlyStr) {
       const [y, m, d] = dateOnlyStr.split('-');
       const dt = new Date(Number(y), Number(m)-1, Number(d), 12, 0, 0);
       day = dt.getDay();
    }
    
    // mapping
    const mapa_day = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const dia_str = day >= 0 && day <= 6 ? mapa_day[day] : 'invalid';
    
    if(counts[dia_str] !== undefined) counts[dia_str]++;
    if(i < 50) console.log(`DB String: ${dStr} -> Parsed String: ${dateOnlyStr} -> Day #: ${day} -> Day Name: ${dia_str}`);
  });
  
  console.log("\nCounts for the sample of 50:");
  console.log(counts);
}
run();

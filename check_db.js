require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function run() {
  const { count, error } = await supabase.from('qcis_audits').select('id', { count: 'exact', head: true });
  console.log("Total Records:", count);
  
  // Get all dates using an RPC if possible, or just pull 7000? Let's try 15000
  const { data } = await supabase.from('qcis_audits').select('fail_date, count_of_defects').limit(15000);
  console.log("Fetched:", data.length);
  
  if (!data) return;
  const days = {};
  data.forEach(d => {
      const date = String(d.fail_date).trim().substring(0, 10);
      days[date] = (days[date] || 0) + 1;
  });
  
  console.log("Date distribution across sample:");
  const sorted = Object.entries(days).sort((a,b) => a[0].localeCompare(b[0]));
  sorted.forEach(s => console.log(s[0], ":", s[1]));
}
run();

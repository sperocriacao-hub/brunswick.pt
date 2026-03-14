require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('qcis_audits').select('substation_name');
  if (error) { console.error(error); return; }
  const unique = new Set(data.map(d => d.substation_name));
  console.log('Unique Substations:');
  Array.from(unique).sort().forEach(s => console.log(s));
}
check();

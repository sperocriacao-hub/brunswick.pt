require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('qcis_audits')
    .select('fail_date');

  if (error) {
    console.error(error);
    return;
  }
  
  const counts = {};
  data.forEach(r => {
    counts[r.fail_date] = (counts[r.fail_date] || 0) + 1;
  });
  console.log("Total records:", data.length);
  console.log("Date distribution:", counts);
}
check();

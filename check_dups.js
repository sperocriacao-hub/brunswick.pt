require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('qcis_audits')
    .select('boat_id, fail_date, defect_description, peca');

  if (error) {
    console.error(error);
    return;
  }
  
  if(!data || data.length === 0) {
      console.log("No data returned by API. Probably RLS or wrong URL.");
      return;
  }

  console.log("Total records fetched (limit is usually 1000):", data.length);
  
  const counts = {};
  let duplicates = 0;
  data.forEach(r => {
    const key = `${r.boat_id}-${r.fail_date}-${r.peca}-${r.defect_description}`;
    if(counts[key]) {
        duplicates++;
    } else {
        counts[key] = 1;
    }
  });
  console.log("Total duplicates found in this sample:", duplicates);
}
check();

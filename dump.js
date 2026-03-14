require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);
supabase.from('qcis_audits').select('substation_name').then(({data, error}) => {
  if (error) { console.error("Error:", error); }
  else {
    const unique = [...new Set(data.map(d => d.substation_name))].sort();
    console.log("Substations:", unique);
  }
});

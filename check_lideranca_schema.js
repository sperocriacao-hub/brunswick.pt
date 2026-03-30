const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDb() {
  const { data, error } = await supabase.from('avaliacoes_lideranca').select('*').limit(1);
  console.log(data, error?.message);
}
inspectDb();

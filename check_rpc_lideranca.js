const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDb() {
  const { data, error } = await supabase.rpc('get_medias_lideranca_v2', { target_id: 'xxxx' });
  if (error) {
    console.error("No get_medias_lideranca_v2?", error.message);
  } else {
    console.log("get_medias_lideranca_v2 exists!");
  }
}
inspectDb();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) { console.error("Missing env keys"); return; }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log("Fetching Operadores as Anon User...");
  const ops = await supabase.from('operadores').select('id, nome').limit(5);
  console.log("Anon Result:", ops.data?.length, "Error:", ops.error);
}
run();

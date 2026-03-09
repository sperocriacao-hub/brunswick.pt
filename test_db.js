const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  console.log("Checking 'modelos' table...");
  const { data: modelos, error: errModelos } = await supabase.from('modelos').select('*').limit(1);
  console.log("Modelos error:", errModelos?.message || "No error, data: " + JSON.stringify(modelos));

  console.log("Checking 'produtos' table...");
  const { data: produtos, error: errProdutos } = await supabase.from('produtos').select('*').limit(1);
  console.log("Produtos error:", errProdutos?.message || "No error, data: " + JSON.stringify(produtos));
}

listTables();

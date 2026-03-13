require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase
    .from("modelos")
    .select("id, nome_modelo, model_year, created_at, status, linha_padrao_id:linhas_producao!modelos_linha_padrao_id_fkey(letra_linha)")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) console.error("ERROR", error.message);
  else console.log("SUCCESS", data);
}
check();

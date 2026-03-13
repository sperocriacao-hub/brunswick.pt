require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from("modelos")
    .select("id, nome_modelo, model_year, created_at, status, linha_padrao_id:linhas_producao(letra_linha)")
    .limit(1);
    
  if (error) {
    console.error("SUPABASE ERROR:", error);
  } else {
    console.log("SUPABASE SUCCESS:", data);
  }
}

check();

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    console.log("Linhas:", await supabase.from('linhas_producao').select('id, descricao_linha, status'));
    console.log("Areas:", await supabase.from('areas_fabrica').select('id, nome_area'));
}
run();

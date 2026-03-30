const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    let queryOps = supabase
        .from('operadores')
        .select(`
            id, tag_rfid_operador, nome_operador, funcao, status, area_base_id, posto_base_id,
            areas_fabrica(id, nome_area),
            estacoes!operadores_posto_base_id_fkey(id, nome_estacao)
        `)
        .eq('status', 'Ativo')
        .limit(1);
        
    const { data, error } = await queryOps;
    console.log("Error:", error);
    console.log("Data:", data);
}

testQuery();

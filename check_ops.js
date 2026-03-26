const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('operadores')
        .select('id, numero_operador, nome_operador, funcao, area_base_id, areas_fabrica(nome_area), estacoes(id)') // wait, is it estacoes or estacoes_fabrica?
        .limit(1);

    if (error) {
        console.error("Query 1 Error:", error);
    } else {
        console.log("Query 1 Success");
    }

    const { data: d2, error: e2 } = await supabase
        .from('operadores')
        .select('*, estacoes_fabrica(*)')
        .limit(1);
    
    if (e2) {
         console.error("Query 2 Error:", e2);
    }

    const { data: d3, error: e3 } = await supabase
        .from('operadores')
        .select('*, estacoes(*)')
        .limit(1);
    
    if (e3) {
         console.error("Query 3 Error:", e3);
    } else {
         console.log("Query 3 Success:", d3[0]);
    }
}
check();

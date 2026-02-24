require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase
        .from('estacoes')
        .select(`
            id, 
            nome_estacao,
            areas_fabrica (nome_area)
        `);
    console.log(JSON.stringify(data, null, 2));
}
run();

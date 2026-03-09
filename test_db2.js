const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    const { data: estacoes, error: errC } = await supabase.from('composicao_modelo').select('*').limit(1);
    console.log("Composicao error:", errC?.message || "No error, data: " + JSON.stringify(estacoes));

    const { data: e, error: errE } = await supabase.from('estacoes').select('*').limit(1);
    console.log("Estacoes error:", errE?.message || "No error, data: " + JSON.stringify(e));
}

listTables();

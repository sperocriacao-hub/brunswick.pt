require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
    console.log("URL:", supabaseUrl ? "Set" : "Not Set");
    console.log("Key:", supabaseAnonKey ? "Set" : "Not Set");

    const { data: areas, error: areaErr } = await supabase
        .from("areas_fabrica")
        .select("id, nome_area, ordem_sequencial");
    console.log("Areas:", areas?.length, areaErr);

    const { data: estacoes, error: estErr } = await supabase
        .from("estacoes")
        .select("id, nome_estacao, area_id");
    console.log("Estacoes:", estacoes?.length, estErr);

    const { data: operadores, error: opErr } = await supabase
        .from("operadores")
        .select("id, nome, apelido, numero_mecanografico, funcao, avatar_url");
    console.log("Operadores:", operadores?.length, opErr);
}
testQuery();

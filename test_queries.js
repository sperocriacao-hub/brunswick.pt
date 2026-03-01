require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("Testing areas...");
    const { data: areas, error: areaErr } = await supabase
        .from("areas_fabrica")
        .select("id, nome_area, ordem_sequencial")
        .order("ordem_sequencial", { ascending: true });
    console.log("Areas:", areas?.length, areaErr);

    console.log("Testing estacoes...");
    const { data: estacoes, error: estErr } = await supabase
        .from("estacoes")
        .select("id, nome_estacao, area_id:areas_fabrica(id), areas_fabrica_id")
        .order("nome_estacao", { ascending: true });
    console.log("Estacoes:", estacoes?.length, estErr);

    console.log("Testing operadores...");
    const { data: operadores, error: opErr } = await supabase
        .from("operadores")
        .select("id, nome, apelido, numero_mecanografico, funcao, avatar_url")
        .order("nome", { ascending: true });
    console.log("Operadores:", operadores?.length, opErr);
}
run();

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
    const { data: operadores, error: opErr } = await supabase
        .from("operadores")
        .select("id, nome_operador, numero_operador, funcao")
        .order("nome_operador", { ascending: true });
    
    console.log("operadores error:", opErr);
    console.log("operadores length:", operadores ? operadores.length : 0);

    const { data: areas, error: areaErr } = await supabase
        .from("areas_fabrica")
        .select("id, nome_area, ordem_sequencial")
        .order("ordem_sequencial", { ascending: true });
    
    console.log("areas error:", areaErr);

    const { data: estacoes, error: estErr } = await supabase
        .from("estacoes")
        .select("id, nome_estacao, area_id")
        .order("nome_estacao", { ascending: true });
    
    console.log("estacoes error:", estErr);
}

test();

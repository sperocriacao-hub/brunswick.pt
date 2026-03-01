const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
    const { data, error } = await supabase
        .from("hst_ocorrencias")
        .select(`
            *,
            operadores(nome_operador),
            areas_fabrica(nome_area),
            estacoes(nome_estacao)
        `)
        .order("data_hora_ocorrencia", { ascending: false });
    
    console.log("Error:", error);
    console.log("Data length:", data ? data.length : 0);
}

test();

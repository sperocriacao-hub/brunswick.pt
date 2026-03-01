const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // fallback to anon key since we saw it in .env.local
);

async function run() {
    try {
        const { data: ops, error: opError } = await supabase
            .from("ordens_producao")
            .select("id, modelos(nome_modelo), linhas_producao(nome_linha)")
            .neq("estado", "Concluida")
            .order("data_prevista_inicio", { ascending: false });

        console.log("OP Error:", opError);

        const { data: estacoes, error: actError } = await supabase
            .from("estacoes")
            .select("id, nome_estacao, areas_fabrica(nome_area), linhas_producao(nome_linha)")
            .order("areas_fabrica(ordem_sequencial)", { ascending: true });

        console.log("Estacoes Error:", actError);
    } catch (e) {
        console.log(e);
    }
}
run();

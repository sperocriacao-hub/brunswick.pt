require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runCheck() {
    console.log("=== INICIANDO ===");
    
    const { data: rawAndons } = await supabase
        .from('alertas_andon')
        .select(`
            id,
            estacoes!alertas_andon_estacao_id_fkey(
                area_id, nome_estacao, lider_t1_id, supervisor_t1_id, lider_t2_id, supervisor_t2_id, 
                manutencao_id, qualidade_id, logistica_id
            )
        `).not('estacao_id', 'is', null).limit(2);

    console.log(JSON.stringify(rawAndons, null, 2));

}

runCheck();

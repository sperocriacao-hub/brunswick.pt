require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data, error } = await supabase
        .from('alertas_andon')
        .select(`
            id,
            tipo_alerta,
            descricao_alerta,
            situacao,
            created_at,
            resolvido_at,
            resolvido,
            operador_rfid,
            estacao_id,
            estacoes:estacao_id (
                nome_estacao,
                areas_fabrica:area_id ( nome_area )
            ),
            ordens_producao:op_id (
                op_numero,
                hin_hull_id,
                modelos:modelo_id ( nome_modelo )
            )
        `)
        .order('created_at', { ascending: false });
    console.log(error || data?.length);
}
run();

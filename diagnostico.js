require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runCheck() {
    console.log("=== INICIANDO VERIFICAÇÃO ESTRUTURAL ===");
    
    // 1. Verificar Estações Configuradas
    const { data: estacoes, error: errEst } = await supabase.from('estacoes').select('*');
    if (errEst) { console.error("Erro ao ler estacoes:", errEst); return; }
    
    let stats = {
        totalEstacoes: estacoes.length,
        comT1: 0,
        comT2: 0,
        semLideranca: 0,
        comSuporteTotal: 0
    };

    estacoes.forEach(e => {
        if (e.lider_t1_id || e.supervisor_t1_id) stats.comT1++;
        if (e.lider_t2_id || e.supervisor_t2_id) stats.comT2++;
        if (!e.lider_t1_id && !e.supervisor_t1_id && !e.lider_t2_id && !e.supervisor_t2_id) stats.semLideranca++;
        if (e.manutencao_id && e.qualidade_id && e.logistica_id) stats.comSuporteTotal++;
    });

    console.log("Diagnóstico das Estações (Bússola):", stats);

    if (stats.semLideranca > 0) {
        console.log(`⚠️ ATENÇÃO: Há ${stats.semLideranca} estações sem NENHUM líder mapeado. Os Andons nestas áreas não vão contabilizar penalização a ninguém no MTR!`);
    }

    // 2. Verificar Andons órfãos
    const { data: andons, error: errAndon } = await supabase.from('alertas_andon').select('id, estacao_id, local_ocorrencia_id').limit(100);
    if(andons) {
        let orfaos = 0;
        andons.forEach(a => {
            if(!a.estacao_id && !a.local_ocorrencia_id) orfaos++;
            // Verifica se a estacao do andon existe
            if(a.estacao_id && !estacoes.find(e => e.id === a.estacao_id)) {
                console.log(`⚠️ BUG: Andon ${a.id} aponta para estação inexistente: ${a.estacao_id}`);
            }
        });
        console.log(`Verificados ${andons.length} andons recentes. Órfãos de localização: ${orfaos}`);
    }

    console.log("\n✅ Verificação Backend Concluída.");
}

runCheck();

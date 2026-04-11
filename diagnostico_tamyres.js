require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runCheck() {
    // 1. Fetch Tamyres
    const { data: ops } = await supabase.from('operadores').select('id, nome_operador').ilike('nome_operador', '%Tamyres%').limit(1);
    if (!ops || ops.length === 0) { console.log("Tamyres não encontrada"); return; }
    const tamyresId = ops[0].id;
    console.log("Tamyres ID:", tamyresId);

    // 2. Fetch all andons for this month (as the dashboard does)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const { data: rawAndons } = await supabase
        .from('alertas_andon')
        .select(`
            id, created_at, resolvido_at, resolvido, tipo_alerta, 
            estacoes!alertas_andon_estacao_id_fkey(
                nome_estacao, lider_t1_id, supervisor_t1_id, lider_t2_id, supervisor_t2_id, 
                manutencao_id, qualidade_id, logistica_id
            )
        `)
        .gte('created_at', firstDay.toISOString())
        .lte('created_at', lastDay.toISOString());

    let count = 0;
    let sumTime = 0;

    rawAndons.forEach(a => {
        const hora = new Date(a.created_at).getHours();
        const isT2 = hora >= 14 && hora < 22;
        const estacao = a.estacoes;
        if (!estacao) return;

        const temT2 = !!(estacao.lider_t2_id || estacao.supervisor_t2_id);
        const isT2Efetivo = isT2 && temT2;

        const responsavelLiderId = isT2Efetivo ? estacao.lider_t2_id : estacao.lider_t1_id;
        const responsavelSuperId = isT2Efetivo ? estacao.supervisor_t2_id : estacao.supervisor_t1_id;

        let isSuporte = false;
        const alertaDesc = (a.tipo_alerta || '').toLowerCase();
        
        if (alertaDesc.includes('manuten') || alertaDesc.includes('avaria') || alertaDesc.includes('quebra')) {
            isSuporte = estacao.manutencao_id === tamyresId;
        } else if (alertaDesc.includes('qualidade') || alertaDesc.includes('rnc') || alertaDesc.includes('defeito')) {
            isSuporte = estacao.qualidade_id === tamyresId;
        } else if (alertaDesc.includes('falta') || alertaDesc.includes('logistica')) {
            isSuporte = estacao.logistica_id === tamyresId;
        }

        if (responsavelLiderId === tamyresId || responsavelSuperId === tamyresId || isSuporte) {
            console.log("\n==== ANDON de Tamyres ====");
            console.log("Estação:", estacao.nome_estacao);
            console.log("Criado:", new Date(a.created_at).toLocaleString());
            console.log("Resolvido:", a.resolvido_at ? new Date(a.resolvido_at).toLocaleString() : "Aberto");
            
            if (a.resolvido && a.resolvido_at) {
                const start = new Date(a.created_at).getTime();
                const end = new Date(a.resolvido_at).getTime();
                const diffDirect = Math.floor((end - start)/60000);

                let calcMins = 0;
                // simulating calcActiveMinutes
                let current = new Date(start);
                const limit = new Date(end);
                while(current < limit) {
                    const h = current.getHours();
                    const day = current.getDay();
                    if(day !== 0 && day !== 6) {
                        const endHour = temT2 ? 22 : 14;
                        if(h >= 6 && h < endHour) calcMins++;
                    }
                    current.setMinutes(current.getMinutes() + 1);
                }

                console.log(`Tempo Direto Mins: ${diffDirect}`);
                console.log(`Tempo via calcActiveMinutes: ${calcMins}`);
                console.log(`Is T2 Station: ${temT2}`);
                count++;
                sumTime += calcMins;
            }
        }
    });

    console.log("\n------");
    console.log(`Total Andons de Tamyres: ${count}`);
    console.log(`Soma Tempo Total: ${sumTime}`);
    console.log(`MTR: ${count > 0 ? sumTime / count : 0}`);

}

runCheck();

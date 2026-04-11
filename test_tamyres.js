require('dotenv').config({ path: '.env.local' });
// Import precisely the built TS file (using register or similar) 
// Actually I can just copy the function from the TS file to ensure identical results
const calcActiveMinutes = (inicio, fim, temT2) => {
    if (!inicio) return 0;
    const start = new Date(inicio).getTime();
    const end = fim ? new Date(fim).getTime() : new Date().getTime();
    if (start >= end) return 0;

    let count = 0;
    let current = new Date(start);
    const limit = new Date(end);
    
    let loops = 0;
    while (current < limit && loops < 1000000) { 
        const h = current.getHours();
        const day = current.getDay();
        const isWeekend = day === 0 || day === 6; 
        
        if (!isWeekend) {
            const endHour = temT2 ? 22 : 14;
            
            if (h >= 6 && h < endHour) {
                count++;
            }
        }
        current.setMinutes(current.getMinutes() + 1);
        loops++;
    }
    return count;
};

// Data used in page.tsx for Tamyres
// Tamyres andon was at 2026-04-08T13:45:13Z? Let's check exactly what string Supabase gives.
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testIt() {
    const { data: rawAndons } = await supabase
        .from('alertas_andon')
        .select(`id, created_at, resolvido_at, tipo_alerta, estacoes!alertas_andon_estacao_id_fkey(nome_estacao, lider_t1_id, supervisor_t1_id, lider_t2_id, supervisor_t2_id, manutencao_id, qualidade_id, logistica_id)`)
        .order('created_at', { ascending: false });

    // Fetch Tamyres ID
    const { data: ops } = await supabase.from('operadores').select('id').ilike('nome_operador', '%Tamyres%').limit(1);
    const tamyresId = ops[0].id;

    let totalSla = 0;
    let myAndons = 0;

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
            if (a.resolvido_at) {
                const mtr = calcActiveMinutes(a.created_at, a.resolvido_at, temT2);
                console.log(`Matched Andon AT ${a.created_at}: MTR = ${mtr}`);
                totalSla += mtr;
                myAndons++;
            }
        }
    });

    console.log(`\nFinal Tamyres MTR sum: ${totalSla}`);
    console.log(`Total andons: ${myAndons}`);
    console.log(`MTR Average: ${myAndons > 0 ? Math.round(totalSla / myAndons) : 0}`);
}

testIt();

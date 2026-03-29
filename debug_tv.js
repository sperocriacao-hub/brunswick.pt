const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => envLocal.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim();

const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'));

async function run() {
    const { data: opData } = await supabase.from('operadores').select('nome_operador, data_nascimento, data_admissao, status').eq('status', 'Ativo');
    
    console.log("Total Ativos:", opData?.length);
    
    const parseDateParts = (dateStr) => {
        if (!dateStr) return null;
        try {
            const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
            const p = cleanStr.includes('/') ? cleanStr.split('/') : cleanStr.split('-');
            if (p.length < 3) return null;
            let y, m, d;
            if (p[0].length === 4) { y = p[0]; m = p[1]; d = p[2]; } else { d = p[0]; m = p[1]; y = p[2]; }
            const pY = parseInt(y.substring(0,4)), pM = parseInt(m), pD = parseInt(d);
            if (isNaN(pY) || isNaN(pM) || isNaN(pD)) return null;
            return { year: pY, month: pM, day: pD };
        } catch { return null; }
    };

    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();

    const anivs = opData.filter(o => {
        const d = parseDateParts(o.data_nascimento);
        if (d && d.month === mesAtual) console.log("Aniversariante found:", o.nome_operador, o.data_nascimento, d);
        return d && d.month === mesAtual;
    });

    const adms = opData.filter(o => {
        const d = parseDateParts(o.data_admissao);
        const anos = d ? anoAtual - d.year : 0;
        if (d && d.month === mesAtual && anos >= 3) console.log("Lenda found:", o.nome_operador, o.data_admissao, d, "Anos:", anos);
        return d && d.month === mesAtual && anos >= 3;
    });

    console.log(`Found ${anivs.length} Aniversariantes e ${adms.length} Lendas em Mes ${mesAtual}`);
    
    // Check Top Workers without crashing
    const { data: areasRaw } = await supabase.from('areas_fabrica').select('id, nome_area');
    console.log("Areas:", areasRaw?.map(a => a.nome_area).join(', '));
    const herois = [];
    for (const ar of (areasRaw || [])) {
        const { data: topWorker, error } = await supabase.rpc('get_top_worker_of_month', {
            p_tipo_alvo: 'AREA', p_alvo_id: ar.id
        }).maybeSingle(); // maybeSingle instead of single()
        
        if (error) console.error("Error for Area", ar.nome_area, ":", error.message);
        
        if (topWorker && topWorker.media_eficiencia > 0) {
            herois.push({ nome: topWorker.nome_operador, score: topWorker.media_eficiencia, area_nome: ar.nome_area });
        }
    }
    console.log("Herois found:", herois.length, herois);
}
run();

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkTvAbsent(tvId) {
    console.log(`\n--- Diagnosing TV ID: ${tvId} ---`);
    
    // 1. Get TV Config
    const { data: configTv, error: tvErr } = await supabase.from('configuracao_tv').select('*').eq('id', tvId).single();
    if (!configTv) {
        console.log("TV not found.");
        return;
    }
    
    let logicalTargetType = configTv.tipo_alvo;
    let logicalTargetId = configTv.alvo_id;
    
    const nomeTargetTV = configTv.nome_alvo_resolvido || '';
    const isMontagemLine = configTv.tipo_alvo === 'LINHA' && /linha [abcd]/i.test(nomeTargetTV);
    const prefixoLinhaPuro = isMontagemLine ? nomeTargetTV.replace(/linha/i, '').trim() : '';
    const prefixoFormatado = prefixoLinhaPuro ? `${prefixoLinhaPuro} -` : '';

    console.log(`Target: ${logicalTargetType} / ${nomeTargetTV}`);
    console.log(`Is Montagem Line: ${isMontagemLine} (Prefix: '${prefixoFormatado}')`);

    if (isMontagemLine) {
        const { data: areaMontagem } = await supabase.from('areas_fabrica').select('id, nome_area').ilike('nome_area', '%Montagem%').limit(1).single();
        if (areaMontagem) {
            logicalTargetType = 'AREA';
            logicalTargetId = areaMontagem.id;
            console.log(`Override -> Area: Montagem (${logicalTargetId})`);
        }
    }

    // 2. Get Operators
    let opsQuery = supabase.from('operadores')
        .select('id, nome_operador, tag_rfid_operador, area_base_id, linha_base_id, estacoes:posto_base_id(nome_estacao)')
        .eq('status', 'Ativo');

    if (logicalTargetType === 'AREA' && logicalTargetId) {
        opsQuery = opsQuery.eq('area_base_id', logicalTargetId);
    } else if (logicalTargetType === 'LINHA' && logicalTargetId) {
        opsQuery = opsQuery.eq('linha_base_id', logicalTargetId);
    }

    const { data: rawOps } = await opsQuery;
    let tvActiveOps = rawOps || [];
    console.log(`Raw Operators Found (Before Prefix Filter): ${tvActiveOps.length}`);

    if (isMontagemLine && prefixoFormatado) {
        tvActiveOps = tvActiveOps.filter(o => {
            const est = Array.isArray(o.estacoes) ? o.estacoes[0] : (o.estacoes);
            const nomeEstacao = est?.nome_estacao || '';
            return nomeEstacao.startsWith(prefixoFormatado);
        });
        console.log(`Operators Found (After Prefix Filter): ${tvActiveOps.length}`);
    }

    const tvActiveOpRfids = tvActiveOps.map(o => o.tag_rfid_operador).filter(Boolean);
    console.log(`Valid RFIDs in Pool: ${tvActiveOpRfids.length}`);

    // 3. Check Log Ponto Diario (Absenteeism Logic)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    console.log(`Checking Logs between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);
    
    const { data: presencas } = await supabase.from('log_ponto_diario')
        .select('operador_rfid')
        .gte('timestamp', startOfDay.toISOString())
        .lte('timestamp', endOfDay.toISOString())
        .in('operador_rfid', tvActiveOpRfids.length > 0 ? tvActiveOpRfids : ['none']);

    const rfidsPresentes = new Set((presencas || []).map(p => p.operador_rfid));
    console.log(`Unique RFIDs Logged Today for this pool: ${rfidsPresentes.size}`);
    
    console.log("-------------------");
}

async function run() {
    // Get some TVs
    const { data: tvs } = await supabase.from('configuracao_tv').select('id, nome_alvo_resolvido, tipo_alvo');
    console.log(`Found ${tvs.length} TVs total.`);
    
    // Test a Montagem Line TV
    const linhaA = tvs.find(t => t.nome_alvo_resolvido?.includes('Linha A'));
    if (linhaA) await checkTvAbsent(linhaA.id);
    
    // Test a General TV
    const geral = tvs.find(t => t.tipo_alvo === 'GERAL');
    if (geral) await checkTvAbsent(geral.id);
}

run();

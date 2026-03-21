const SUPABASE_URL = 'https://efenntgldjizgyyttiiw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZW5udGdsZGppemd5eXR0aWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzI5ODIsImV4cCI6MjA4NzI0ODk4Mn0.1KPq3FBSo5Nn3qNQoHMEMvPBKBa1SYeI72QaUZMXSMc';

async function querySupabase(endpoint, method = 'GET', body = null) {
    const url = endpoint.startsWith('http') ? endpoint : `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const options = {
        method,
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(url, options);
    const json = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(json));
    return json;
}

async function rpcSupabase(rpcName, params) {
    const url = `${SUPABASE_URL}/rest/v1/rpc/${rpcName}`;
    const options = {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    };
    const res = await fetch(url, options);
    const json = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(json));
    return json;
}

async function testar() {
  console.log("=== API Diagnostico TV ===");
  try {
      // 1. Get Linha A TV
      const tvs = await querySupabase('configuracoes_tv?select=*&nome_tv=ilike.*Linha A*');
      if(tvs.length === 0) return console.log("Linha A não existe nas tvs");
      const tv = tvs[0];
      console.log(`[TV] ${tv.nome_tv} | Tipo Alvo: ${tv.tipo_alvo} | Alvo ID: ${tv.alvo_id}`);
      
      let topWorker = null;
      try {
          const rpcData = await rpcSupabase('get_top_worker_of_month', {
              p_tipo_alvo: tv.tipo_alvo,
              p_alvo_id: tv.alvo_id
          });
          topWorker = Array.isArray(rpcData) && rpcData.length > 0 ? rpcData[0] : null;
          console.log("[RPC] Heroi:", topWorker || "NENHUM");
      } catch(e) {
          console.error("[RPC ERRO]:", e.message);
      }

      if(topWorker) {
          const now = new Date();
          const startOfMonthStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString().split('T')[0];
          
          const progression = await querySupabase(`avaliacoes_diarias?select=data_avaliacao,nota_eficiencia&funcionario_id=eq.${topWorker.funcionario_id}&data_avaliacao=gte.${startOfMonthStr}&order=data_avaliacao.asc`);
          console.log(`[PROGRESSO_DIARIO] Encontrou ${progression.length} registos no mês atual.`);
          console.log(progression);
      } else {
        console.log("\n[DEBUG APROFUNDADO] Tentando fazer o JOIN nativamente com REST API...");
        
        // As Linhas de Produção
        const estacoes = await querySupabase(`estacoes?select=id,nome_estacao,linha_id&linha_id=eq.${tv.alvo_id}`);
        console.log(`- Estações que pertencem à Linha A (${tv.alvo_id}):`, estacoes.length);
        if(estacoes.length > 0) console.log(estacoes.map(e => e.nome_estacao));

        // Os Operadores nestas estações
        const estIdList = estacoes.map(e => `"${e.id}"`).join(',');
        let operadores = [];
        if (estIdList) {
            operadores = await querySupabase(`operadores?select=id,nome_operador,posto_base_id&posto_base_id=in.(${estIdList})`);
            console.log(`- Operadores alocados a estas Estações:`, operadores.length);
            if(operadores.length > 0) console.log(operadores.map(o => o.nome_operador));
        }

        // Avaliações dos Operadores Globalmente
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
        const trintaDiasStr = trintaDiasAtras.toISOString().split('T')[0];

        const allAvs = await querySupabase(`avaliacoes_diarias?select=funcionario_id,nota_eficiencia,data_avaliacao&data_avaliacao=gte.${trintaDiasStr}&limit=50`);
        console.log(`- Avaliações globais recentes encontradas:`, allAvs.length);
        
        if (allAvs.length > 0) {
            const funcIds = [...new Set(allAvs.map(a => a.funcionario_id))];
            const funcsInfo = await querySupabase(`operadores?select=id,nome_operador,posto_base_id,area_base_id&id=in.(${funcIds.map(id => `"${id}"`).join(',')})`);
            console.log("\n- Os operadores que RECEBERAM avaliação nos últimos 30 dias estão alocados a:");
            funcsInfo.forEach(f => {
                console.log(`  * ${f.nome_operador}: posto_base_id=${f.posto_base_id || 'NULL'}, area_base_id=${f.area_base_id || 'NULL'}`);
            });
        }
      }
      
  } catch(e) {
     console.error("Erro fatal:", e.message);
  }
}

testar();

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (Substitua pelas suas credenciais se não estiverem no env)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pftolixgxyiknlytkshe.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testar() {
  console.log("=== Testando Funcionario do Mes ===");
  
  // 1. Procurar a TV da "Linha A" para saber o Alvo ID
  const { data: tvs } = await supabase.from('configuracoes_tv').select('*').ilike('nome_tv', '%Linha A%');
  console.log("TVs encontradas:", tvs);
  
  if (tvs && tvs.length > 0) {
      const tv = tvs[0];
      console.log(`Testando RPC para TV: ${tv.nome_tv} (Tipo: ${tv.tipo_alvo}, Alvo ID: ${tv.alvo_id})`);
      
      const { data, error } = await supabase.rpc('get_top_worker_of_month', {
          p_tipo_alvo: tv.tipo_alvo,
          p_alvo_id: tv.alvo_id
      });
      
      console.log("Resultado RPC (Opcional):", data, "Erro:", error);
      
      // 2. Verificar se ha avaliações para operadores dessa linha
      console.log("\nProcurando avaliações manuais recentes para esta linha...");
      const { data: ops } = await supabase.from('operadores').select('id, nome_operador').eq('linha_base_id', tv.alvo_id);
      
      if (ops && ops.length > 0) {
          const opIds = ops.map(o => o.id);
          const { data: avs } = await supabase.from('avaliacoes_diarias').select('*').in('funcionario_id', opIds).order('data_avaliacao', {ascending: false}).limit(5);
          console.log("Ultimas avaliacoes da linha:", avs);
      } else {
          console.log("Nenhum operador encontrado com esta linha_base_id");
      }
  } else {
      console.log("TV da Linha A não encontrada!");
  }
}

testar();

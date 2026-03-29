const { createClient } = require('@supabase/supabase-js');
const s = createClient("", "");
s.from('configuracoes_tv').select('nome_tv, opcoes_layout').eq('tipo_alvo', 'REFEITORIO').then(r => console.log(JSON.stringify(r.data, null, 2)));

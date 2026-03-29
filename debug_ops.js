require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
s.from('operadores').select('nome_operador, data_nascimento, data_admissao, ativo').not('data_nascimento', 'is', null).limit(20).then(r => console.log(r.data));

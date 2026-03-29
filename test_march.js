require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
s.from('operadores').select('nome_operador, data_nascimento').like('data_nascimento', '%-03-%').limit(5).then(r => console.log("Aniversariantes Março:", r.data));

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkMaria() {
    const { data } = await supabase.from('operadores').select('id, nome_operador, email_acesso, permissoes_modulos, nivel_permissao').ilike('nome_operador', '%maria%fatima%');
    console.log(JSON.stringify(data, null, 2));
}

checkMaria();

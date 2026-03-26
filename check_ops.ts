import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking DB relations...");
    
    // Testing the exact query used in avaliacoes/page.tsx
    const { data, error } = await supabase
        .from('operadores')
        .select('id, numero_operador, nome_operador, funcao, area_base_id, areas_fabrica(nome_area), estacoes(nome_estacao)')
        .eq('status', 'Ativo')
        .limit(2);

    if (error) {
        console.error("Query SQL Error:", error);
    } else {
        console.log("Query SQL Success", JSON.stringify(data, null, 2));
    }
}
check();

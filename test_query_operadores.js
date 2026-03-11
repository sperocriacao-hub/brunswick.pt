import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase
        .from('operadores')
        .select('id, numero_operador, nome_operador, tag_rfid_operador, funcao, status, iluo_nivel, possui_acesso_sistema, posto_base_id, estacao_alocada_temporaria, em_realocacao, permissoes_modulos')
        .limit(1);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Data:", data);
    }
}
test();

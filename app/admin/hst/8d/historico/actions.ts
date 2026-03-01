'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getHstOcorrenciasWith8D() {
    try {
        // Obter todas as Ocorrências de HST cruzadas com o relatório 8D
        const { data, error } = await supabase
            .from('hst_ocorrencias')
            .select(`
                *,
                operadores:colaborador_envolvido (nome_operador),
                areas_fabrica:area_id (nome_area),
                estacoes:estacao_id (nome_estacao),
                hst_8d (
                    id,
                    status,
                    d4_causa_raiz,
                    updated_at
                )
            `)
            .order('data_hora_ocorrencia', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

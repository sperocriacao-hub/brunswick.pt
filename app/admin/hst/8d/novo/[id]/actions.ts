'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getHst8D(ocorrenciaId: string) {
    try {
        // Obter Ocorrência base para cabeçalho
        const { data: occData, error: occErr } = await supabase
            .from('hst_ocorrencias')
            .select(`
                *,
                operadores:colaborador_envolvido (nome_operador),
                areas_fabrica:area_id (nome_area),
                estacoes:estacao_id (nome_estacao)
            `)
            .eq('id', ocorrenciaId)
            .single();

        if (occErr) throw occErr;

        // Obter 8D existente
        const { data: otdData, error: otdErr } = await supabase
            .from('hst_8d')
            .select('*')
            .eq('ocorrencia_id', ocorrenciaId)
            .single();

        // Se não existir, otdData será null, o que está correto (novo 8D)
        return { success: true, ocorrencia: occData, relatorio8d: otdData };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function saveHst8D(ocorrenciaId: string, payload: any) {
    try {
        const { id, ...updateData } = payload;

        let result;

        if (id) {
            // Update
            const { data, error } = await supabase
                .from('hst_8d')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            result = data;
        } else {
            // Insert
            const { data, error } = await supabase
                .from('hst_8d')
                .insert([{ ocorrencia_id: ocorrenciaId, ...updateData }])
                .select()
                .single();
            if (error) throw error;
            result = data;
        }

        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

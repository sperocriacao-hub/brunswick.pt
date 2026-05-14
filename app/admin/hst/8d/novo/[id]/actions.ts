'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

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
                operadores(nome_operador),
                areas_fabrica(nome_area),
                estacoes(nome_estacao)
            `)
            .eq('id', ocorrenciaId)
            .single();

        if (occErr) throw occErr;

        // Obter 8D existente
        const { data: otdData, error: otdErr } = await supabase
            .from('hst_8d')
            .select('*')
            .eq('ocorrencia_id', ocorrenciaId)
            .maybeSingle(); // Retorna null sem erro se não existir 

        if (otdErr) {
            console.error("Erro no get hst_8d:", otdErr);
            throw otdErr;
        }

        // Obter Ações Kanban
        let acoes = [];
        if (otdData?.id) {
            const { data: acoesData } = await supabase
                .from('hst_acoes')
                .select(`
                    *,
                    operadores(nome_operador)
                `)
                .eq('relatorio_8d_id', otdData.id)
                .order('created_at', { ascending: true });
            if (acoesData) acoes = acoesData;
        }

        // Obter Operadores para Dropdown
        const { data: operadores } = await supabase.from('operadores').select('id, nome_operador').order('nome_operador');

        return { success: true, ocorrencia: occData, relatorio8d: otdData, acoes, operadores: operadores || [] };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function saveHst8D(ocorrenciaId: string, payload: any) {
    try {
        const { id, ...updateData } = payload;

        let result;

        // Pre-flight check para garantir que contornamos as caches agressivas do Next.js Client Router
        const { data: existing } = await supabase
            .from('hst_8d')
            .select('id')
            .eq('ocorrencia_id', ocorrenciaId)
            .maybeSingle();

        const actualId = id || existing?.id;

        if (actualId) {
            // Se já temos o ID na db real, obriga ao Update explícito
            const { data: updateRes, error: updateErr } = await supabase
                .from('hst_8d')
                .update(updateData)
                .eq('id', actualId)
                .select()
                .single();

            if (updateErr) throw updateErr;
            result = updateRes;
        } else {
            // Inserção nova real
            const { data: insertRes, error: insertErr } = await supabase
                .from('hst_8d')
                .insert([{ ocorrencia_id: ocorrenciaId, ...updateData }])
                .select()
                .single();

            if (insertErr) throw insertErr;
            result = insertRes;
        }

        // Limpar caches do lado do servidor para forçar o front-end a ler dados frescos
        revalidatePath(`/admin/hst/8d/novo/${ocorrenciaId}`, 'page');
        revalidatePath(`/admin/hst/8d/historico`, 'page');

        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function saveHstAcao(payload: any) {
    try {
        const { id, ...dataToSave } = payload;
        
        let result;
        if (id) {
            const { data, error } = await supabase.from('hst_acoes').update(dataToSave).eq('id', id).select().single();
            if (error) throw error;
            result = data;
        } else {
            const { data, error } = await supabase.from('hst_acoes').insert([dataToSave]).select().single();
            if (error) throw error;
            result = data;
        }
        
        revalidatePath(`/admin/hst/8d/novo/${payload.ocorrencia_id}`, 'page');
        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

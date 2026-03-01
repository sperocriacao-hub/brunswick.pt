'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getHstAcoes() {
    try {
        const { data, error } = await supabase
            .from('hst_acoes')
            .select(`
                *,
                operadores:responsavel_id (nome_operador),
                hst_ocorrencias (
                    tipo_ocorrencia,
                    areas_fabrica:area_id (nome_area)
                ),
                hst_8d (
                    status
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function criarHstAcao(payload: any) {
    try {
        const { data, error } = await supabase
            .from('hst_acoes')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateHstAcaoStatus(id: string, newStatus: string) {
    try {
        const payload: any = { status: newStatus };
        if (newStatus === 'Done') {
            payload.data_conclusao = new Date().toISOString();
        } else {
            payload.data_conclusao = null;
        }

        const { data, error } = await supabase
            .from('hst_acoes')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteHstAcao(id: string) {
    try {
        const { error } = await supabase
            .from('hst_acoes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

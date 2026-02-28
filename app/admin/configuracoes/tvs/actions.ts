'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getTVConfigs() {
    try {
        const { data, error } = await supabase
            .from('vw_tvs_configuradas')
            .select('*')
            .order('nome_tv', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (err: any) {
        return { success: false, error: err.message, data: [] };
    }
}

export async function addTVConfig(payload: any) {
    try {
        const { data, error } = await supabase
            .from('configuracoes_tv')
            .insert({
                nome_tv: payload.nome_tv,
                tipo_alvo: payload.tipo_alvo,
                alvo_id: payload.alvo_id || null,
                layout_preferencial: payload.layout_preferencial
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function deleteTVConfig(id: string) {
    try {
        const { error } = await supabase
            .from('configuracoes_tv')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function getLinhasForSelect() {
    try {
        const { data, error } = await supabase.from('linhas_producao').select('id, descricao_linha').order('descricao_linha');
        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (err: any) {
        return { success: false, error: err.message, data: [] };
    }
}

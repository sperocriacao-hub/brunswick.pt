'use server';

import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function get5SPerguntas() {
    noStore();
    try {
        const { data, error } = await supabase
            .from('lean_5s_perguntas')
            .select(`
                *,
                areas_fabrica (nome_area),
                estacoes (nome_estacao),
                linhas_producao (letra_linha)
            `)
            .order('categoria', { ascending: true })
            .order('ordem', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function criarPergunta(payload: any) {
    try {
        const { data, error } = await supabase
            .from('lean_5s_perguntas')
            .insert([payload])
            .select();

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deletePergunta(id: string) {
    try {
        const { error } = await supabase
            .from('lean_5s_perguntas')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getAreas() {
    noStore();
    try {
        const { data, error } = await supabase
            .from('areas_fabrica')
            .select('id, nome_area')
            .order('nome_area');
        if (error) throw error;
        return { success: true, areas: data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getCronograma5S() {
    noStore();
    try {
        const { data, error } = await supabase
            .from('lean_5s_cronograma')
            .select(`
                *,
                operadores (nome_operador),
                areas_fabrica (nome_area),
                linhas_producao (letra_linha),
                estacoes (nome_estacao)
            `)
            .order('data_prevista', { ascending: true });
        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function criarAgendamento5S(payload: any) {
    try {
        const { error } = await supabase.from('lean_5s_cronograma').insert([payload]);
        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateAgendamento5S(id: string, updates: any) {
    try {
        const { error } = await supabase.from('lean_5s_cronograma').update(updates).eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteAgendamento5S(id: string) {
    try {
        const { error } = await supabase.from('lean_5s_cronograma').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function savePlanoAutomatico5S(agendamentos: any[]) {
    try {
        const { error } = await supabase.from('lean_5s_cronograma').insert(agendamentos);
        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

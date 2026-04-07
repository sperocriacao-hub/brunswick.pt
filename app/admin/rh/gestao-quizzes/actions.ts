"use server";

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export type PerguntaQuizGroup = {
    id: string;
    texto_pergunta: string;
    status?: 'Ativa' | 'Inativa';
    ativo?: boolean;
    tipo_alvo?: string; // Para cultura e liderança
    alvo_avaliacao?: string; // Para formação ('Avaliar Formando', 'Avaliar Formador')
    categoria?: string; // Para clima/satisfação
    criado_em?: string;
    created_at?: string;
};

// 1. Liderança e Cultura
export async function listarPerguntasCultura() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data } = await supabase.from('quiz_cultura_perguntas').select('*').order('criado_em', { ascending: false });
    return { success: true, data: data as PerguntaQuizGroup[] };
}
export async function criarPerguntaCultura(texto: string, tipo: 'Liderança' | 'Cultura') {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    await supabase.from('quiz_cultura_perguntas').insert({ texto_pergunta: texto, tipo_alvo: tipo, status: 'Ativa' });
    revalidatePath('/admin/rh/gestao-quizzes');
    return { success: true };
}
export async function alterarStatusCultura(id: string, novoStatus: 'Ativa' | 'Inativa') {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    await supabase.from('quiz_cultura_perguntas').update({ status: novoStatus }).eq('id', id);
    revalidatePath('/admin/rh/gestao-quizzes');
    return { success: true };
}

// 2. Satisfação (Clima Organizacional)
export async function listarPerguntasSatisfacao() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data } = await supabase.from('quiz_satisfacao_perguntas').select('*').order('created_at', { ascending: false });
    return { success: true, data: data as PerguntaQuizGroup[] };
}
export async function criarPerguntaSatisfacao(texto: string, categoria: string = 'Geral') {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    await supabase.from('quiz_satisfacao_perguntas').insert({ texto_pergunta: texto, categoria, ativo: true });
    revalidatePath('/admin/rh/gestao-quizzes');
    return { success: true };
}
export async function alterarStatusSatisfacao(id: string, ativo: boolean) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    await supabase.from('quiz_satisfacao_perguntas').update({ ativo }).eq('id', id);
    revalidatePath('/admin/rh/gestao-quizzes');
    return { success: true };
}

// 3. Formação Avaliações
export async function listarPerguntasFormacao() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data } = await supabase.from('quiz_formacao_perguntas').select('*').order('created_at', { ascending: false });
    return { success: true, data: data as PerguntaQuizGroup[] };
}
export async function criarPerguntaFormacao(texto: string, tipo: 'Avaliar Formando' | 'Avaliar Formador') {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    await supabase.from('quiz_formacao_perguntas').insert({ texto_pergunta: texto, alvo_avaliacao: tipo, ativo: true });
    revalidatePath('/admin/rh/gestao-quizzes');
    return { success: true };
}
export async function alterarStatusFormacao(id: string, ativo: boolean) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    await supabase.from('quiz_formacao_perguntas').update({ ativo }).eq('id', id);
    revalidatePath('/admin/rh/gestao-quizzes');
    return { success: true };
}

// Módulo de Eliminação
export async function deletarPerguntaGlobal(id: string, tabela: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    await supabase.from(tabela).delete().eq('id', id);
    revalidatePath('/admin/rh/gestao-quizzes');
    return { success: true };
}

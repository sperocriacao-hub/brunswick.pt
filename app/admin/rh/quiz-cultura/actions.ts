"use server";

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type PerguntaQuiz = {
    id: string;
    texto_pergunta: string;
    status: 'Ativa' | 'Inativa';
    tipo_alvo: 'Liderança' | 'Cultura';
    criado_em?: string;
};

export async function listarPerguntas() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('quiz_cultura_perguntas')
        .select('*')
        .order('criado_em', { ascending: false });

    if (error) {
        console.error("Erro a carregar perguntas:", error);
        return { success: false, data: [] };
    }
    return { success: true, data: data as PerguntaQuiz[] };
}

export async function criarPergunta(texto: string, tipo: 'Liderança' | 'Cultura') {
    const supabase = await createClient();
    const { error } = await supabase
        .from('quiz_cultura_perguntas')
        .insert({
            texto_pergunta: texto,
            tipo_alvo: tipo,
            status: 'Ativa'
        });

    if (error) {
        console.error("Erro ao criar pergunta:", error);
        return { success: false, error: error.message };
    }
    revalidatePath('/admin/rh/quiz-cultura');
    return { success: true };
}

export async function alterarStatusPergunta(id: string, novoStatus: 'Ativa' | 'Inativa') {
    const supabase = await createClient();
    const { error } = await supabase
        .from('quiz_cultura_perguntas')
        .update({ status: novoStatus })
        .eq('id', id);

    if (error) {
        console.error("Erro ao alterar pergunta:", error);
        return { success: false, error: error.message };
    }
    revalidatePath('/admin/rh/quiz-cultura');
    return { success: true };
}

export async function deletarPergunta(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('quiz_cultura_perguntas')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Erro a deletar pergunta (Pode estar associada a respostas passadas):", error);
        return { success: false, error: error.message };
    }
    revalidatePath('/admin/rh/quiz-cultura');
    return { success: true };
}

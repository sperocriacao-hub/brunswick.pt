"use server";

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { PerguntaQuizGroup } from '@/app/admin/rh/gestao-quizzes/actions';

export async function carregarPerguntasSatisfacao() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data } = await supabase.from('quiz_satisfacao_perguntas').select('*').eq('ativo', true).order('created_at', { ascending: true });
    return data as PerguntaQuizGroup[] || [];
}

export async function carregarAreasFoco() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data } = await supabase.from('areas_fabrica').select('id, nome_area').order('nome_area');
    return data || [];
}

export async function submeterSatisfacao(areaId: string | null, respostas: { pergunta_id: string; nota: number }[]) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    const payloads = respostas.map(r => ({
        pergunta_id: r.pergunta_id,
        nota: r.nota,
        area_id: areaId || null
    }));

    const { error } = await supabase.from('quiz_satisfacao_respostas').insert(payloads);
    if (error) {
        console.error("Erro a submeter clima anonimo:", error);
        return { success: false, error: error.message };
    }
    return { success: true };
}

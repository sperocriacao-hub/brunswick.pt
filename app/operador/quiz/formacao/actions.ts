"use server";

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { PerguntaQuizGroup } from '@/app/admin/rh/gestao-quizzes/actions';

export type IdentidadeFormacao = {
    operador_id: string;
    nome_operador: string;
    funcao_ativa: 'Formador' | 'Formando';
    formacao_id: string;
    alvo_nome: string;
    estacao_nome: string;
};

// Autentica o Crachá e descobre qual a Formação ATIVA em curso para esta pessoa
export async function iniciarSessaoFormacao(rfid_ou_numero: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 1. Procurar Operador
    const { data: opData } = await supabase.from('operadores')
        .select('id, nome_operador')
        .or(`tag_rfid_operador.eq.${rfid_ou_numero},numero_operador.eq.${rfid_ou_numero}`)
        .single();

    if (!opData) return { success: false, error: "Crachá não reconhecido." };

    // 2. Procurar Formações Ativas (Em Curso) em que ele faça parte
    const { data: formacoesEmCurso } = await supabase.from('rh_planos_formacao')
        .select(`
            id, 
            status,
            formando_id, 
            formador_id,
            formando:operadores!formando_id(nome_operador),
            formador:operadores!formador_id(nome_operador),
            estacao:estacoes(nome_estacao)
        `)
        .or(`formando_id.eq.${opData.id},formador_id.eq.${opData.id}`)
        .in('status', ['Em Curso', 'Concluída']) // Permite avaliar as recentemente concluídas
        .order('created_at', { ascending: false })
        .limit(1);

    if (!formacoesEmCurso || formacoesEmCurso.length === 0) {
        return { success: false, error: "Não possui nenhuma Formação ILUO ativa neste momento." };
    }

    const formacao = formacoesEmCurso[0];
    const isFormador = formacao.formador_id === opData.id;

    // Se ele for o Formador, vai avaliar o 'Formando'. Se ele for 'Formando', avalia o 'Formador'.
    const payload: IdentidadeFormacao = {
        operador_id: opData.id,
        nome_operador: opData.nome_operador,
        funcao_ativa: isFormador ? 'Formador' : 'Formando',
        formacao_id: formacao.id,
        alvo_nome: isFormador ? (formacao.formando as any)?.nome_operador : (formacao.formador as any)?.nome_operador,
        estacao_nome: (formacao.estacao as any)?.nome_estacao || 'Desconhecida'
    };

    return { success: true, data: payload };
}


// Devolve as perguntas adequadas à sua Função (Se for Formador, responde a perguntas que avaliam o Aluno)
export async function carregarPerguntasFormacao(funcao: 'Formador' | 'Formando') {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // O alvo de avaliação inverte:
    const alvo = funcao === 'Formador' ? 'Avaliar Formando' : 'Avaliar Formador';

    const { data } = await supabase.from('quiz_formacao_perguntas')
        .select('*')
        .eq('ativo', true)
        .eq('alvo_avaliacao', alvo)
        .order('created_at', { ascending: true });
        
    return data as PerguntaQuizGroup[] || [];
}


// Envia para a DB Mestre/Aprendiz
export async function submeterFormacaoFeedback(payloads: { formacao_id: string, pergunta_id: string, avaliador_id: string, nota: number }[]) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Filtro para ignorar colisões se ele carregar na mesma pergunta duas vezes (UPSERT com ON CONFLICT ignorado usando unique)
    const { error } = await supabase.from('quiz_formacao_respostas').upsert(payloads, { onConflict: 'formacao_id, pergunta_id, avaliador_id' });
    
    if (error) {
        console.error("Erro a submeter o feedback:", error);
        return { success: false, error: error.message };
    }
    return { success: true };
}

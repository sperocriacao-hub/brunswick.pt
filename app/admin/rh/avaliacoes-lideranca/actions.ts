'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export type AvaliacaoLiderancaDTO = {
    funcionario_id: string;
    nomeFuncionario: string;
    hst: number;
    epi: number;
    limpeza: number;
    eficiencia: number;
    objetivos: number;
    atitude: number;
    gestao_motivacao: number;
    desenvolvimento: number;
    desperdicios: number;
    qualidade: number;
    operacoes: number;
    melhoria: number;
    kpis: number;
    cultura: number;
    justificacoes: Record<string, string>; // ex: { 'kpis': 'Revisão falha' }
    data_avaliacao?: string; 
};

export async function carregarEquipaLideranca() {
    try {
        const cookieStore = cookies();
        const supabase = await createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Não Autenticado" };

        let minLevel = 0; 
        
        if (user.email === 'master@brunswick.pt') {
             minLevel = 3;
        } else {
             const { data: myData } = await supabase.from('operadores').select('funcao').eq('email_acesso', user.email).single();
             if (myData?.funcao === 'Gestor') minLevel = 2;
             else if (myData?.funcao === 'Supervisor') minLevel = 1;
        }

        if (minLevel === 0) return { success: false, error: "Nível hierárquico insuficiente para avaliar liderança." };

        let query = supabase
            .from('operadores')
            .select('id, numero_operador, nome_operador, funcao, status, area_base_id, areas_fabrica(nome_area)')
            .eq('status', 'Ativo');

        // Se NÃO for admin (minLevel < 3), garantir acesso APENAS à sua própria equipa hierárquica
        if (minLevel < 3) {
            const { data: myData } = await supabase.from('operadores').select('nome_operador').eq('email_acesso', user.email).single();
            if (myData?.nome_operador) {
                query = query.or(`lider_nome.eq."${myData.nome_operador}",supervisor_nome.eq."${myData.nome_operador}",gestor_nome.eq."${myData.nome_operador}"`);
            }
        }

        const { data, error } = await query.order('nome_operador');

        if (error) throw error;
        return { success: true, operadores: data, myLevel: minLevel };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

export async function submeterAvaliacaoLideranca(avaliacao: AvaliacaoLiderancaDTO, autoSupervisorNome: string = "Gestão Superior") {
    try {
        if (!avaliacao.funcionario_id) throw new Error("ID de Funcionário em falta.");

        const cookieStore = cookies();
        const supabase = await createClient(cookieStore);

        // 1. Inserir Avaliação na Nova Tabela Dedicada à Liderança
        const { error: avalError } = await supabase
            .from('avaliacoes_lideranca')
            .insert({
                funcionario_id: avaliacao.funcionario_id,
                supervisor_nome: autoSupervisorNome,
                data_avaliacao: avaliacao.data_avaliacao || new Date().toISOString().split('T')[0],
                nota_hst: avaliacao.hst,
                nota_epi: avaliacao.epi,
                nota_5s: avaliacao.limpeza,
                nota_eficiencia: avaliacao.eficiencia,
                nota_objetivos: avaliacao.objetivos,
                nota_atitude: avaliacao.atitude,
                nota_gestao_motivacao: avaliacao.gestao_motivacao,
                nota_desenvolvimento: avaliacao.desenvolvimento,
                nota_desperdicios: avaliacao.desperdicios,
                nota_qualidade: avaliacao.qualidade,
                nota_operacoes: avaliacao.operacoes,
                nota_melhoria: avaliacao.melhoria,
                nota_kpis: avaliacao.kpis,
                nota_cultura: avaliacao.cultura,
                justificativas: JSON.stringify(avaliacao.justificacoes)
            });

        if (avalError) {
            console.error("Erro SQL ao inserir avaliacao liderança", avalError);
            if (avalError.code === '23505') {
                throw new Error("Este Operador já foi avaliado nesta data no Portal de Liderança.");
            }
            throw avalError;
        }

        return { success: true };

    } catch (err: any) {
        return { success: false, error: err?.message || "Falha na Gravação da Avaliação" };
    }
}

export type QuizFeedbacksAgg = {
    texto_pergunta: string;
    media: number;
    respostas: number;
};

export async function getFeedbackQuizAggregado(nome_lider: string) {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { data: rawRespostas, error } = await supabase
        .from('quiz_cultura_respostas')
        .select(`
            nota,
            quiz_cultura_perguntas ( texto_pergunta )
        `)
        .eq('lider_avaliado_nome', nome_lider);

    if (error || !rawRespostas) return { success: false, data: [] };

    const agrupar: Record<string, { soma: number; count: number }> = {};
    
    rawRespostas.forEach((r: any) => {
        const texto = r.quiz_cultura_perguntas?.texto_pergunta;
        if (texto) {
            if (!agrupar[texto]) agrupar[texto] = { soma: 0, count: 0 };
            agrupar[texto].soma += r.nota;
            agrupar[texto].count += 1;
        }
    });

    const resultado: QuizFeedbacksAgg[] = Object.keys(agrupar).map(k => ({
        texto_pergunta: k,
        media: Number((agrupar[k].soma / agrupar[k].count).toFixed(1)),
        respostas: agrupar[k].count
    }));

    resultado.sort((a, b) => a.media - b.media);

    return { success: true, data: resultado };
}


"use server";

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export type PlanoFormacao = {
    id: string;
    formando_id: string;
    formando: { nome_operador: string; numero_operador: string };
    formador_id: string;
    formador: { nome_operador: string; numero_operador: string };
    estacao_id: string;
    estacao: { nome_estacao: string };
    data_inicio: string;
    data_fim: string | null;
    status: 'Planeado' | 'Em Curso' | 'Concluída' | 'Reprovada' | 'Suspensa';
    notas_gerais: string | null;
    created_at: string;
};

export async function listarFormacoes() {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    
    const { data, error } = await supabase
        .from('rh_planos_formacao')
        .select(`
            *,
            formando:operadores!formando_id(nome_operador, numero_operador),
            formador:operadores!formador_id(nome_operador, numero_operador),
            estacao:estacoes(nome_estacao)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro ao listar formações:", error);
        return { success: false, data: [] };
    }

    return { success: true, data: data as PlanoFormacao[] };
}

export async function criarPlanoFormacao(dto: {
    formando_id: string;
    formador_id: string;
    estacao_id: string;
    data_inicio: string;
    notas_gerais?: string;
}) {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    
    // Inserir Formação
    const { error } = await supabase
        .from('rh_planos_formacao')
        .insert({
            formando_id: dto.formando_id,
            formador_id: dto.formador_id,
            estacao_id: dto.estacao_id,
            data_inicio: dto.data_inicio,
            notas_gerais: dto.notas_gerais || null,
            status: 'Em Curso' // Começa automaticamente
        });

    if (error) {
        console.error("Erro a planear formação:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/rh/formacoes');
    return { success: true };
}

export async function atualizarStatusFormacao(id: string, novoStatus: string) {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    
    const updates: any = { status: novoStatus, updated_at: new Date().toISOString() };
    if (novoStatus === 'Concluída' || novoStatus === 'Reprovada' || novoStatus === 'Suspensa') {
        updates.data_fim = new Date().toISOString().split('T')[0]; // Finaliza hoje
    }

    const { error } = await supabase
        .from('rh_planos_formacao')
        .update(updates)
        .eq('id', id);

    if (error) return { success: false, error: error.message };
    
    // Se foi concluída com sucesso, poderiamos auto-atribuir o ILUO (U), mas por enquanto só guardamos.
    revalidatePath('/admin/rh/formacoes');
    return { success: true };
}

export async function obterTopFormadores() {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    // Isto buscaria respostas na tabela quiz_formacao_respostas.
    // Vamos construir a query para o Rating dos Formadores.
    
    const { data: formadores, error: errForm } = await supabase
        .from('operadores')
        .select('id, nome_operador, numero_operador')
        .eq('funcao', 'Coordenador de Grupo'); // ou qualquer pessoa (iremos filtrar abaixo)

    const { data: scores } = await supabase
        .from('quiz_formacao_respostas')
        .select(`
            nota,
            formacao_id,
            pergunta:quiz_formacao_perguntas!inner(alvo_avaliacao),
            formacao:rh_planos_formacao!inner(formador_id)
        `)
        .eq('pergunta.alvo_avaliacao', 'Avaliar Formador');

    // Aggregate Data Manualmente se existirem dados
    if (!scores || !formadores) return { success: false, data: [] };

    let rankings: Record<string, { nome: string, totalScore: number, numVotes: number }> = {};

    scores.forEach((s: any) => {
        const formadorId = s.formacao?.formador_id;
        if (formadorId) {
            if (!rankings[formadorId]) {
                const f = formadores.find((x:any) => x.id === formadorId) || { nome_operador: "Desconhecido" };
                rankings[formadorId] = { nome: f.nome_operador, totalScore: 0, numVotes: 0 };
            }
            rankings[formadorId].totalScore += Number(s.nota);
            rankings[formadorId].numVotes++;
        }
    });

    const result = Object.values(rankings).map(x => ({
        nome: x.nome,
        rating: (x.totalScore / x.numVotes).toFixed(1),
        votos: x.numVotes
    })).sort((a,b) => Number(b.rating) - Number(a.rating));

    return { success: true, data: result };
}

// Helper para UI
export async function listarFormadoresParaSelect() {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    const { data } = await supabase.from('operadores').select('id, nome_operador, numero_operador').eq('status', 'Ativo').order('nome_operador');
    return data || [];
}
export async function listarEstacoesParaSelect() {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    const { data } = await supabase.from('estacoes').select('id, nome_estacao, areas_fabrica(nome_area)').order('nome_estacao');
    return data || [];
}

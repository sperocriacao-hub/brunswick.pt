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
    data_fim_estimada: string | null;
    data_fim: string | null;
    status: 'Planeado' | 'Em Curso' | 'Concluída' | 'Reprovada' | 'Suspensa';
    notas_gerais: string | null;
    created_at: string;
};

export async function listarFormacoes() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
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
    data_fim_estimada?: string;
    notas_gerais?: string;
}) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Inserir Formação
    const { error } = await supabase
        .from('rh_planos_formacao')
        .insert({
            formando_id: dto.formando_id,
            formador_id: dto.formador_id,
            estacao_id: dto.estacao_id,
            data_inicio: dto.data_inicio,
            data_fim_estimada: dto.data_fim_estimada || null,
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
    const supabase = createClient(cookieStore);
    
    const updates: any = { status: novoStatus, updated_at: new Date().toISOString() };
    if (novoStatus === 'Concluída' || novoStatus === 'Reprovada' || novoStatus === 'Suspensa') {
        updates.data_fim = new Date().toISOString().split('T')[0]; // Finaliza hoje
    }

    const { error } = await supabase
        .from('rh_planos_formacao')
        .update(updates)
        .eq('id', id);

    if (error) return { success: false, error: error.message };
    
    // Se foi concluída com sucesso, escalar o Nível ILUO (Gamification)
    if (novoStatus === 'Concluída') {
        // Obter formação para terIDs
        const { data: formacao } = await supabase.from('rh_planos_formacao').select('formando_id, estacao_id').eq('id', id).single();
        if (formacao) {
            // Obter nivel atual
            const { data: matrixData } = await supabase.from('operador_iluo_matriz')
                .select('nivel_iluo')
                .eq('operador_id', formacao.formando_id)
                .eq('estacao_id', formacao.estacao_id)
                .single();
                
            let targetNivel = 'I';
            let exists = !!matrixData;
            
            if (matrixData?.nivel_iluo === 'I') targetNivel = 'L';
            else if (matrixData?.nivel_iluo === 'L') targetNivel = 'U';
            else if (matrixData?.nivel_iluo === 'U') targetNivel = 'O';
            else if (matrixData?.nivel_iluo === 'O') targetNivel = 'O'; // Maxout
            
            if (exists) {
                await supabase.from('operador_iluo_matriz')
                    .update({ nivel_iluo: targetNivel, avaliador_nome: 'Academia Fabril (Aprovação)', data_avaliacao: new Date().toISOString() })
                    .eq('operador_id', formacao.formando_id)
                    .eq('estacao_id', formacao.estacao_id);
            } else {
                await supabase.from('operador_iluo_matriz')
                    .insert({ operador_id: formacao.formando_id, estacao_id: formacao.estacao_id, nivel_iluo: targetNivel, avaliador_nome: 'Academia Fabril (Inicial)' });
            }
        }
    }

    revalidatePath('/admin/rh/formacoes');
    return { success: true };
}

export async function editarFormacao(id: string, data_fim_estimada: string, notas_gerais: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    const { error } = await supabase
        .from('rh_planos_formacao')
        .update({ data_fim_estimada: data_fim_estimada || null, notas_gerais: notas_gerais || null, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/rh/formacoes');
    return { success: true };
}

// Predict Target ILUO for Frontend
export async function preverEvolucaoILUO(operador_id: string, estacao_id: string) {
    if (!operador_id || !estacao_id) return null;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    const { data: matrixData } = await supabase.from('operador_iluo_matriz')
        .select('nivel_iluo')
        .eq('operador_id', operador_id)
        .eq('estacao_id', estacao_id)
        .single();
        
    let current = matrixData?.nivel_iluo || 'Nenhum';
    let target = 'I';
    if (matrixData?.nivel_iluo === 'I') target = 'L';
    else if (matrixData?.nivel_iluo === 'L') target = 'U';
    else if (matrixData?.nivel_iluo === 'U' || matrixData?.nivel_iluo === 'O') target = 'O';

    return { current, target };
}

export async function obterTopFormadores() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
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
    const supabase = createClient(cookieStore);
    const { data } = await supabase.from('operadores').select('id, nome_operador, numero_operador').eq('status', 'Ativo').order('nome_operador');
    return data || [];
}
export async function listarEstacoesParaSelect() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data } = await supabase.from('estacoes').select('id, nome_estacao, areas_fabrica(nome_area)').order('nome_estacao');
    return data || [];
}

export async function obterMatrizIluoGlobal() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Obter todos os operadores ativos
    const { data: operadores } = await supabase.from('operadores')
        .select('id, nome_operador, numero_operador')
        .eq('status', 'Ativo')
        .order('nome_operador');
        
    // Obter todas as estações
    const { data: estacoes } = await supabase.from('estacoes')
        .select('id, nome_estacao, areas_fabrica(nome_area)')
        .order('nome_estacao');
        
    // Obter a matriz ILUO inteira
    const { data: matriz } = await supabase.from('operador_iluo_matriz')
        .select('*');
        
    if (!operadores || !estacoes || !matriz) return { success: false, data: [] };
    
    // Construir o relatório para o frontend
    // Mapeamos para cada operador, o seu nivel de habilidade em formato Dicionário { estacao_id: 'I' }
    const result = operadores.map(op => {
        const skillsDaPessoa = matriz.filter(m => m.operador_id === op.id);
        const mapSkills: Record<string, string> = {};
        skillsDaPessoa.forEach(s => mapSkills[s.estacao_id] = s.nivel_iluo);
        
        return {
            operador_id: op.id,
            nome: op.nome_operador,
            numero: op.numero_operador,
            skills: mapSkills
        };
    });
    
    return { 
        success: true, 
        data: {
            operadores: result,
            estacoes: estacoes
        }
    };
}

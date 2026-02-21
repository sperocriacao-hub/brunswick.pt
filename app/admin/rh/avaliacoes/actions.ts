'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type AvaliacaoDTO = {
    funcionario_id: string;
    nomeFuncionario: string;
    hst: number;
    epi: number;
    limpeza: number;
    qualidade: number;
    eficiencia: number;
    objetivos: number;
    atitude: number;
    justificacoes: Record<string, string>; // ex: { 'hst': 'Sem óculos proteção' }
};

export async function carregarEquipaAvaliavel() {
    try {
        const { data, error } = await supabase
            .from('operadores')
            .select('id, numero_operador, nome_operador, funcao, status, area_base_id')
            .eq('status', 'Ativo') // Só se avaliam RH ativos
            .order('nome_operador');

        if (error) throw error;
        return { success: true, operadores: data };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

export async function submeterAvaliacaoDiaria(avaliacao: AvaliacaoDTO, autoSupervisorNome: string = "Admin/Supervisor") {
    try {
        if (!avaliacao.funcionario_id) throw new Error("ID de Funcionário em falta.");

        // 1. Inserir Avaliação (Isto chamará o Trigger PostgreSQL de atualização da matriz master)
        const { data: avalData, error: avalError } = await supabase
            .from('avaliacoes_diarias')
            .insert({
                funcionario_id: avaliacao.funcionario_id,
                supervisor_nome: autoSupervisorNome,
                data_avaliacao: new Date().toISOString().split('T')[0],
                nota_hst: avaliacao.hst,
                nota_epi: avaliacao.epi,
                nota_5s: avaliacao.limpeza,
                nota_qualidade: avaliacao.qualidade,
                nota_eficiencia: avaliacao.eficiencia,
                nota_objetivos: avaliacao.objetivos,
                nota_atitude: avaliacao.atitude
            })
            .select('id')
            .single();

        if (avalError) {
            console.error("Erro SQL ao inserir avaliacao", avalError);
            if (avalError.code === '23505') {
                // Prevenir Double-Dip (Avaliar mesmo Funcionario 2x no mesmo dia)
                throw new Error("Este Operador já foi avaliado hoje por si.");
            }
            throw avalError;
        }

        // 2. Processar Justificações (Apontamentos Negativos)
        const apontamentos = [];
        const mapEixos: Record<string, string> = {
            'hst': 'HST', 'epi': 'EPI', 'limpeza': 'Limpeza_5S',
            'qualidade': 'Qualidade', 'eficiencia': 'Eficiencia',
            'objetivos': 'Objetivos', 'atitude': 'Atitude'
        };

        for (const [key, just] of Object.entries(avaliacao.justificacoes)) {
            if (just && just.trim() !== '') {
                const mappedTopico = mapEixos[key];
                if (mappedTopico) {
                    apontamentos.push({
                        funcionario_id: avaliacao.funcionario_id,
                        avaliacao_origem_id: avalData.id,
                        supervisor_nome: autoSupervisorNome,
                        topico_falhado: mappedTopico,
                        nota_atribuida: avaliacao[key as keyof AvaliacaoDTO],
                        justificacao: just.trim()
                    });
                }
            }
        }

        if (apontamentos.length > 0) {
            const { error: errorApt } = await supabase
                .from('apontamentos_negativos')
                .insert(apontamentos);

            if (errorApt) console.error("Falha ao registar apontamentos negativos:", errorApt);
        }

        return { success: true };

    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Falha na Gravação da Avaliação" };
    }
}

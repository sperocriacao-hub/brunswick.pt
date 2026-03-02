"use server";
import { createClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getHstOcorrencias() {
    noStore();
    try {
        const { data, error } = await supabase
            .from("hst_ocorrencias")
            .select(`
                *,
                operadores(nome_operador),
                areas_fabrica(nome_area),
                estacoes(nome_estacao)
            `)
            .order("data_hora_ocorrencia", { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function submitHstOcorrencia(payload: any) {
    try {
        const { error } = await supabase
            .from("hst_ocorrencias")
            .insert([payload]);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function fecharOcorrencia(id: string, tratamento: string, diasBaixa: number) {
    try {
        const { error } = await supabase
            .from("hst_ocorrencias")
            .update({
                status: 'Fechado',
                tratamento_aplicado: tratamento,
                dias_baixa: diasBaixa
            })
            .eq("id", id);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function iniciarInvestigacaoHST(ocorrenciaId: string, tipoOcorrencia: string) {
    try {
        // 1. Garantir que o Relatório 8D exista (ou criar se não existir)
        const { data: ext8D } = await supabase
            .from('hst_8d')
            .select('id')
            .eq('ocorrencia_id', ocorrenciaId)
            .maybeSingle();

        let relatorioId = ext8D?.id;

        if (!relatorioId) {
            const { data: new8D, error: err8d } = await supabase
                .from('hst_8d')
                .insert([{ ocorrencia_id: ocorrenciaId, status: 'Em Investigacao' }])
                .select()
                .single();
            if (err8d) throw err8d;
            relatorioId = new8D.id;
        } else {
            // Atualizar status para Em Investigacao se já existisse em Rascunho
            await supabase.from('hst_8d').update({ status: 'Em Investigacao' }).eq('id', relatorioId);
        }

        // 2. Criar a Tarefa Kanban correspondente (se não existir uma já engatilhada pelo 8D)
        const tituloAcao = `Elaborar Relatório 8D - ${tipoOcorrencia || 'Acidente HST'}`;

        const { data: extAcao } = await supabase
            .from('hst_acoes')
            .select('id')
            .eq('relatorio_8d_id', relatorioId)
            .eq('descricao_acao', tituloAcao)
            .maybeSingle();

        if (!extAcao) {
            const { error: errAcao } = await supabase
                .from('hst_acoes')
                .insert([{
                    ocorrencia_id: ocorrenciaId,
                    relatorio_8d_id: relatorioId,
                    descricao_acao: tituloAcao,
                    prioridade: 'Alta',
                    status: 'To Do'
                }]);
            if (errAcao) throw errAcao;
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

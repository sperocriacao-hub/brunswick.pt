"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Tópicos de Auditoria ---
export async function getAuditoriaTopicos() {
    try {
        const { data, error } = await supabase
            .from("hst_auditorias_topicos")
            .select("*")
            .order("categoria", { ascending: true })
            .order("topico", { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function addAuditoriaTopico(topico: string, categoria: string) {
    try {
        const { data, error } = await supabase
            .from("hst_auditorias_topicos")
            .insert([{ topico, categoria, ativo: true }])
            .select()
            .single();
        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function toggleTopicoStatus(id: string, ativo: boolean) {
    try {
        const { error } = await supabase
            .from("hst_auditorias_topicos")
            .update({ ativo })
            .eq("id", id);
        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// --- Realização de Auditorias ---
export async function getAuditorias() {
    try {
        const { data, error } = await supabase
            .from("hst_auditorias")
            .select(`
                *,
                operadores:auditor_id (nome_operador),
                areas_fabrica:area_id (nome_area)
            `)
            .order("data_auditoria", { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function submeterAuditoria(payload: {
    area_id: string;
    auditor_id: string;
    observacoes_gerais: string;
    respostas: { topico_id: string; conforme: boolean; observacao: string }[];
}) {
    try {
        const totalPerguntas = payload.respostas.length;
        if (totalPerguntas === 0) throw new Error("A auditoria precisa ter respostas.");

        const conformes = payload.respostas.filter(r => r.conforme).length;
        const score = (conformes / totalPerguntas) * 100;

        // 1. Criar Master
        const { data: audit, error: hErr } = await supabase
            .from("hst_auditorias")
            .insert([{
                area_id: payload.area_id,
                auditor_id: payload.auditor_id,
                observacoes_gerais: payload.observacoes_gerais,
                score_percentual: parseFloat(score.toFixed(2))
            }])
            .select()
            .single();

        if (hErr) throw hErr;

        // 2. Inserir Respostas (batch)
        const linhasRespostas = payload.respostas.map(r => ({
            auditoria_id: audit.id,
            topico_id: r.topico_id,
            conforme: r.conforme,
            observacao: r.observacao
        }));

        const { error: rErr } = await supabase
            .from("hst_auditorias_respostas")
            .insert(linhasRespostas);

        if (rErr) throw rErr;

        // 3. Gerar Ações de Melhoria Automáticas para os 'Não Conformes'
        const naoConformesComObs = payload.respostas.filter(r => !r.conforme && r.observacao.trim() !== "");

        if (naoConformesComObs.length > 0) {
            // Fetch topicos text to name the task
            const { data: topicosDB } = await supabase.from("hst_auditorias_topicos").select("id, topico").in("id", naoConformesComObs.map(r => r.topico_id));

            const acoes = naoConformesComObs.map(r => {
                const textTopico = topicosDB?.find(t => t.id === r.topico_id)?.topico || "Auditoria";
                return {
                    titulo: `Melhoria Pós-Auditoria: ${textTopico}`,
                    descricao: `Ação gerada automaticamente por falha na Auditoria HST.\n\nObservação do Auditor:\n${r.observacao}`,
                    status: 'To Do',
                    prioridade: 'Alta', // Default high priority for failed safety audits
                    responsavel_id: payload.auditor_id, // Default assign to auditor to distribute later
                    area_id: payload.area_id
                };
            });

            if (acoes.length > 0) {
                await supabase.from("hst_acoes").insert(acoes);
            }
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getDetalheAuditoria(auditoriaId: string) {
    try {
        const { data: respostas, error } = await supabase
            .from("hst_auditorias_respostas")
            .select(`
                *,
                hst_auditorias_topicos (topico, categoria)
            `)
            .eq("auditoria_id", auditoriaId);

        if (error) throw error;
        return { success: true, data: respostas };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getFactoryContext() {
    try {
        const { data: areas } = await supabase.from('areas_fabrica').select('id, nome_area').order('ordem_sequencial');
        const { data: operadores } = await supabase.from('operadores').select('id, nome_operador').eq('status', 'Ativo').order('nome_operador');
        return { success: true, areas: areas || [], operadores: operadores || [] };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

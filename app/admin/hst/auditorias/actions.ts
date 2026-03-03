"use server";

import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

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

export async function getAuditoriaById(id: string) {
    try {
        const { data, error } = await supabase
            .from("hst_auditorias")
            .select(`
                *,
                operadores:auditor_id (nome_operador),
                areas_fabrica:area_id (nome_area)
            `)
            .eq("id", id)
            .single();

        if (error) throw error;
        return { success: true, data };
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

// --- Integração KPIs: Avaliação Diária de Turnos ---
export async function getShiftSafetyKPIs() {
    try {
        const { data, error } = await supabase
            .from("avaliacoes_diarias")
            .select("nota_hst, nota_epi");

        if (error) throw error;

        // Calculate Averages
        if (!data || data.length === 0) {
            return { success: true, kpiHst: 0, kpiEpi: 0, count: 0 };
        }

        const sumHst = data.reduce((acc, row) => acc + Number(row.nota_hst), 0);
        const sumEpi = data.reduce((acc, row) => acc + Number(row.nota_epi), 0);

        // Scale is 0.0 - 4.0. We want a 0-100% percentage representation.
        // So (average / 4) * 100
        const avgHst = sumHst / data.length;
        const avgEpi = sumEpi / data.length;

        const kpiHst = (avgHst / 4) * 100;
        const kpiEpi = (avgEpi / 4) * 100;

        return {
            success: true,
            kpiHst: parseFloat(kpiHst.toFixed(1)),
            kpiEpi: parseFloat(kpiEpi.toFixed(1)),
            count: data.length
        };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// --- Integração KPIs: Dashboards Detalhados por Área e Operador ---
export async function getShiftEvaluationDetails() {
    try {
        const { data, error } = await supabase
            .from("avaliacoes_diarias")
            .select(`
                id,
                nota_hst,
                nota_epi,
                data_avaliacao,
                operadores:funcionario_id (
                    id,
                    nome_operador,
                    areas_fabrica:area_base_id (
                        id,
                        nome_area
                    )
                )
            `)
            .order('data_avaliacao', { ascending: false });

        if (error) throw error;

        const evaluations = data || [];

        // 1. Ranking de Áreas
        const areaMap = new Map();

        // 2. Ranking de Colaboradores (Focus List)
        const opMap = new Map();

        // 3. Evolução Mensal (Tendência Últimos 6 meses)
        const trendMap = new Map();

        evaluations.forEach((ev: any) => {
            const hstScore = (Number(ev.nota_hst) / 4) * 100;
            const epiScore = (Number(ev.nota_epi) / 4) * 100;
            const globalScore = (hstScore + epiScore) / 2;

            const op = ev.operadores;
            if (!op) return;

            const opName = op.nome_operador || 'Desconhecido';
            const areaName = op.areas_fabrica?.nome_area || 'Sem Área';

            // Area Aggregation
            if (!areaMap.has(areaName)) {
                areaMap.set(areaName, { name: areaName, totalScore: 0, count: 0 });
            }
            const aData = areaMap.get(areaName);
            aData.totalScore += globalScore;
            aData.count += 1;

            // Operator Aggregation
            if (!opMap.has(opName)) {
                opMap.set(opName, { name: opName, area: areaName, totalHst: 0, totalEpi: 0, totalGlobal: 0, count: 0 });
            }
            const oData = opMap.get(opName);
            oData.totalHst += hstScore;
            oData.totalEpi += epiScore;
            oData.totalGlobal += globalScore;
            oData.count += 1;

            // Trend Aggregation (Month-Year)
            const dateObj = new Date(ev.data_avaliacao);
            const monthYear = format(dateObj, 'MMM yyyy', { locale: pt });

            if (!trendMap.has(monthYear)) {
                // Use the raw date object to sort chronologically later, keep string for label
                trendMap.set(monthYear, { label: monthYear, date: dateObj, totalScore: 0, count: 0 });
            }
            const tData = trendMap.get(monthYear);
            tData.totalScore += globalScore;
            tData.count += 1;
        });

        // Compute Averages and Sort
        const areaRanking = Array.from(areaMap.values()).map(a => ({
            name: a.name,
            score: parseFloat((a.totalScore / a.count).toFixed(1)),
            count: a.count
        })).sort((a, b) => b.score - a.score);

        const operatorsNeedingSupport = Array.from(opMap.values()).map(o => ({
            name: o.name,
            area: o.area,
            scoreHst: parseFloat((o.totalHst / o.count).toFixed(1)),
            scoreEpi: parseFloat((o.totalEpi / o.count).toFixed(1)),
            scoreGlobal: parseFloat((o.totalGlobal / o.count).toFixed(1)),
            count: o.count
        }))
            // Filter operators that have a global average below 85% indicating need for support
            .filter(o => o.scoreGlobal < 85)
            .sort((a, b) => a.scoreGlobal - b.scoreGlobal)
            .slice(0, 5); // Top 5 critical

        const monthlyTrends = Array.from(trendMap.values()).map(t => ({
            label: t.label,
            date: t.date,
            score: parseFloat((t.totalScore / t.count).toFixed(1))
        })).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(-6); // Last 6 months chronological

        return {
            success: true,
            areaRanking,
            operatorsNeedingSupport,
            monthlyTrends
        };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

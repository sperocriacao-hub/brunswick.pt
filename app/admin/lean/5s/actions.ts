'use server';

import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getAreasE_Estacoes() {
    noStore();
    try {
        const { data: areas, error } = await supabase
            .from('areas_fabrica')
            .select(`
                id, 
                nome_area,
                estacoes (id, nome_estacao, linha_id)
            `)
            .order('nome_area');

        const { data: linhas, error: errLinhas } = await supabase
            .from('linhas_producao')
            .select('id, letra_linha')
            .order('letra_linha');

        if (error || errLinhas) throw error || errLinhas;
        return { success: true, data: areas, linhas };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getChecklist(areaId: string, linhaId?: string, estacaoId?: string) {
    noStore();
    try {
        let orConditions = [`area_id.is.null`, `area_id.eq.${areaId}`];
        if (linhaId) orConditions.push(`linha_id.eq.${linhaId}`);
        if (estacaoId) orConditions.push(`estacao_id.eq.${estacaoId}`);

        const { data, error } = await supabase
            .from('lean_5s_perguntas')
            .select('*')
            .or(orConditions.join(','))
            .order('categoria', { ascending: true })
            .order('ordem', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getOperadores() {
    noStore();
    try {
        const { data, error } = await supabase
            .from('operadores')
            .select('id, nome_operador')
            .order('nome_operador', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function salvarRonda5S(payload: any) {
    try {
        // 1. Criar Auditoria Master
        const { data: audit, error: errAudit } = await supabase
            .from('lean_5s_auditorias')
            .insert([{
                area_id: payload.areaId,
                estacao_id: payload.estacaoId || null,
                auditor_id: payload.auditorId || null,
                pontuacao_obtida: payload.pontuacao_obtida,
                pontuacao_maxima: payload.pontuacao_maxima,
                percentagem: payload.percentagem
            }])
            .select()
            .single();

        if (errAudit) throw errAudit;

        // 2. Preparar Respostas
        const respostas = payload.respostas.map((r: any) => ({
            auditoria_id: audit.id,
            pergunta_id: r.pergunta_id,
            resultado: r.resultado,
            observacoes: r.observacoes || ''
        }));

        const { error: errResp } = await supabase
            .from('lean_5s_respostas')
            .insert(respostas);

        if (errResp) throw errResp;

        // FASE 4 (Automacao Smart Action Hub) - Criar as ações de melhoria para cada "Fail"
        const falhas = payload.respostas.filter((r: any) => r.resultado === 'Fail');
        for (const f of falhas) {
            const tituloAcao = f.observacoes || `Anomalia detetada na ronda (${f.categoria})`;
            await supabase.from('lean_5s_acoes').insert([{
                descricao_acao: tituloAcao,
                prioridade: 'Alta',
                status: 'Em Analise', // Vai primeiro para o Comitê
                area_id: payload.areaId,
                linha_id: payload.linhaId || null,
                estacao_id: payload.estacaoId || null
            }]);
        }

        return { success: true, id: audit.id };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getAuditoriasRecentes() {
    noStore();
    try {
        const { data, error } = await supabase
            .from('lean_5s_auditorias')
            .select(`
                *,
                areas_fabrica (nome_area),
                estacoes (nome_estacao),
                operadores (nome_operador)
            `)
            .order('data_auditoria', { ascending: false })
            .limit(20);

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getDadosDashboard5S() {
    noStore();
    try {
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

        const { data, error } = await supabase
            .from('lean_5s_auditorias')
            .select(`
                *,
                areas_fabrica (nome_area),
                estacoes (nome_estacao),
                operadores (nome_operador),
                lean_5s_respostas (
                    resultado,
                    lean_5s_perguntas (
                        categoria
                    )
                )
            `)
            .gte('data_auditoria', trintaDiasAtras.toISOString())
            .order('data_auditoria', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getAuditoriaDetalhes(auditoriaId: string) {
    noStore();
    try {
        const { data, error } = await supabase
            .from('lean_5s_respostas')
            .select(`
                id,
                resultado,
                observacoes,
                lean_5s_perguntas (
                    pergunta,
                    categoria
                )
            `)
            .eq('auditoria_id', auditoriaId);

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getAcoes5S() {
    noStore();
    try {
        const { data, error } = await supabase
            .from('lean_5s_acoes')
            .select(`
                *,
                areas_fabrica (nome_area),
                linhas_producao (letra_linha),
                estacoes (nome_estacao),
                operadores (nome_operador)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateAcao5S(id: string, updates: any) {
    try {
        const { error } = await supabase
            .from('lean_5s_acoes')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/admin/lean/5s');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateA3Report5S(id: string, updates: any) {
    try {
        const { error } = await supabase
            .from('lean_5s_acoes')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/admin/lean/5s');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteAcao5S(id: string) {
    try {
        const { error } = await supabase
            .from('lean_5s_acoes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/admin/lean/5s');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

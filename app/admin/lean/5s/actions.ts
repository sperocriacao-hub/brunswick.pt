'use server';

import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';

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
            const tituloAcao = `Correção 5S (\${f.categoria}): \${f.observacoes || 'Anomalia detetada na ronda'}`;
            await supabase.from('hst_acoes').insert([{
                descricao_acao: tituloAcao,
                prioridade: 'Alta',
                status: 'Aberto',
                // area e estacao mapping se for possivel, default universal:
                area_id: payload.areaId
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

export async function getAuditoriaDetalhes(auditoriaId: string) {
    noStore();
    try {
        const { data, error } = await supabase
            .from('lean_5s_resultados')
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

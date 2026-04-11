'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Ação de backend privilegiada para ler/escrever históricos do Andon
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getAndonHistory(mesesAtras: number = 4) {
    try {
        const minDate = new Date();
        minDate.setMonth(minDate.getMonth() - mesesAtras);

        const { data, error } = await supabase
            .from('alertas_andon')
            .select(`
                id,
                tipo_alerta,
                descricao_alerta,
                situacao,
                created_at,
                resolvido_at,
                resolvido,
                operador_rfid,
                estacao_id,
                local_ocorrencia_id,
                estacao_causadora:estacao_id (
                    nome_estacao, lider_t1_id, supervisor_t1_id, lider_t2_id, supervisor_t2_id,
                    manutencao_id, qualidade_id, logistica_id,
                    areas_fabrica:area_id ( id, nome_area ),
                    linhas_producao:linha_id ( id, descricao_linha )
                ),
                estacao_problema:local_ocorrencia_id (
                    nome_estacao,
                    areas_fabrica:area_id ( id, nome_area ),
                    linhas_producao:linha_id ( id, descricao_linha )
                ),
                ordens_producao:op_id (
                    op_numero,
                    hin_hull_id,
                    linhas_producao:linha_id ( id, descricao_linha ),
                    modelos:modelo_id ( nome_modelo )
                )
            `)
            .gte('created_at', minDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        let andonData = data || [];
        
        // Fetch operator names manually since there's no FK on alertas_andon -> operadores
        const rfids = Array.from(new Set(andonData.map(a => a.operador_rfid).filter(Boolean)));
        
        // Coleta todos os UUIDs de liderança presentes nas estações
        const leaderIds = new Set<string>();
        andonData.forEach(a => {
            const e = a.estacao_causadora as any;
            if (e) {
                // If the relationship is returned as an array, extract the first
                const est = Array.isArray(e) ? e[0] : e;
                if (!est) return;
                if (est.lider_t1_id) leaderIds.add(est.lider_t1_id);
                if (est.lider_t2_id) leaderIds.add(est.lider_t2_id);
                if (est.supervisor_t1_id) leaderIds.add(est.supervisor_t1_id);
                if (est.supervisor_t2_id) leaderIds.add(est.supervisor_t2_id);
                if (est.manutencao_id) leaderIds.add(est.manutencao_id);
                if (est.qualidade_id) leaderIds.add(est.qualidade_id);
                if (est.logistica_id) leaderIds.add(est.logistica_id);
            }
        });

        // 1. Fetch from rfids
        const mapOps = new Map<string, string>();
        if (rfids.length > 0) {
            const { data: ops } = await supabase
                .from('operadores')
                .select('tag_rfid_operador, nome_operador')
                .in('tag_rfid_operador', rfids);
                
            ops?.forEach(o => mapOps.set(o.tag_rfid_operador, o.nome_operador));
        }

        // 2. Fetch from leaderIds
        const mapLeaders = new Map<string, string>();
        if (leaderIds.size > 0) {
            const { data: leaders } = await supabase
                .from('operadores')
                .select('id, nome_operador')
                .in('id', Array.from(leaderIds));
                
            leaders?.forEach(l => mapLeaders.set(l.id, l.nome_operador));
        }
            
        andonData = andonData.map(a => {
            const rawE = a.estacao_causadora as any;
            const est = rawE ? (Array.isArray(rawE) ? rawE[0] : rawE) : null;
            const enhancedEstacao = est ? {
                ...est,
                lider_t1_nome: est.lider_t1_id ? mapLeaders.get(est.lider_t1_id) : null,
                lider_t2_nome: est.lider_t2_id ? mapLeaders.get(est.lider_t2_id) : null,
                supervisor_t1_nome: est.supervisor_t1_id ? mapLeaders.get(est.supervisor_t1_id) : null,
                supervisor_t2_nome: est.supervisor_t2_id ? mapLeaders.get(est.supervisor_t2_id) : null,
                manutencao_nome: est.manutencao_id ? mapLeaders.get(est.manutencao_id) : null,
                qualidade_nome: est.qualidade_id ? mapLeaders.get(est.qualidade_id) : null,
                logistica_nome: est.logistica_id ? mapLeaders.get(est.logistica_id) : null,
            } : null;

            return {
                ...a,
                estacao_causadora: enhancedEstacao,
                operadores: { nome_operador: a.operador_rfid ? mapOps.get(a.operador_rfid) || null : null }
            };
        });

        return { success: true, data: andonData };
    } catch (err: any) {
        console.error("Erro a buscar histórico Andon:", err);
        return { success: false, error: err.message };
    }
}

export async function fecharAlertaAndon(alerta_id: string, supervisor_notes: string = '') {
    try {
        // Em um SGM industrial real o trigger de "Time off" para medir OEE faria set de resolvido_at
        const { error } = await supabase
            .from('alertas_andon')
            .update({
                resolvido: true,
                resolvido_at: new Date().toISOString(),
                // Poderíamos guardar supervisor_notes se a tabela tivesse essa coluna, 
                // mas para este MVP gravamos apenas o Timestamp para medir a agilidade do Suporte.
                situacao: 'CONCLUIDO_SUPERVISOR'
            })
            .eq('id', alerta_id);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function getAreasTVLinks() {
    try {
        const { data, error } = await supabase
            .from('areas_fabrica')
            .select('id, nome_area')
            .order('nome_area', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (err: any) {
        return { success: false, error: err.message, data: [] };
    }
}

export async function getLoggedOperadorRfid() {
    try {
        const cookieStore = cookies();
        const serverSupabase = createServerClient(cookieStore);
        
        const { data: { user } } = await serverSupabase.auth.getUser();
        if (!user) return 'BACKOFFICE_MASTER';

        // Tentar obter da tabela de operadores primeiro (Caso seja um Lider de Linha a usar o BO)
        if (user.email) {
            const { data } = await supabase
                .from('operadores')
                .select('nome_operador, numero_identificacao')
                .ilike('email_acesso', user.email)
                .single();
                
            if (data?.numero_identificacao) return data.numero_identificacao;
            if (data?.nome_operador) return data.nome_operador;
        }

        // Se for um administrador puramente de Backoffice (sem cadastro em Operadores)
        // Usamos o User Metadata (nome do AD/Supabase) ou o próprio Email 
        const adminName = user.user_metadata?.full_name || user.user_metadata?.name;
        if (adminName) return adminName;
        
        if (user.email) {
             const userPrefix = user.email.split('@')[0];
             return userPrefix.toUpperCase();
        }

        return 'BACKOFFICE_MASTER';
    } catch (err) {
        return 'BACKOFFICE_MASTER';
    }
}

export async function clonarAlertaAndon(alerta_id: string, operador_rfid: string) {
    try {
        const { data: oldAlert, error } = await supabase
            .from('alertas_andon')
            .select('*')
            .eq('id', alerta_id)
            .single();

        if (error) throw error;
        if (!oldAlert) throw new Error("Alerta não encontrado");

        // Clone row but keeping it active
        const { data: newAlert, error: insertError } = await supabase
            .from('alertas_andon')
            .insert([{
                tipo_alerta: oldAlert.tipo_alerta,
                descricao_alerta: `[REINCIDÊNCIA] ${oldAlert.descricao_alerta || ''}`.trim(),
                operador_rfid: operador_rfid,
                estacao_id: oldAlert.estacao_id,
                local_ocorrencia_id: oldAlert.local_ocorrencia_id,
                op_id: oldAlert.op_id,
                resolvido: false,
                situacao: 'NOVO'
            }])
            .select()
            .single();

        if (insertError) throw insertError;
        return { success: true, data: newAlert };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

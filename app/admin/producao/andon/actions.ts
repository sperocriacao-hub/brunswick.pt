'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Ação de backend privilegiada para ler/escrever históricos do Andon
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getAndonHistory() {
    try {

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
                estacoes:estacao_id (
                    nome_estacao,
                    areas_fabrica:area_id ( nome_area )
                ),
                ordens_producao:op_id (
                    op_numero,
                    hin_hull_id,
                    modelos:modelo_id ( nome_modelo )
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
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
            .order('step_order', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (err: any) {
        return { success: false, error: err.message, data: [] };
    }
}

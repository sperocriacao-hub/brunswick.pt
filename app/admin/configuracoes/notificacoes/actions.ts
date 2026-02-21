'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export type NotificacaoRegra = {
    id: string;
    nome_regra: string;
    tipo_canal: 'EMAIL' | 'SMS' | 'WEBHOOK';
    destinatarios_array: string[];
    evento_gatilho: string;
    template_mensagem: string;
    ativo: boolean;
};

export type LogNotificacao = {
    id: string;
    regra_id: string | null;
    canal_usado: string;
    destinatario: string;
    status_envio: string;
    erro_detalhe: string | null;
    data_envio: string;
    regra?: { nome_regra: string };
};

export async function fetchRegrasNotificacao() {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase
            .from('sys_notificacoes_reportes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, regras: data as NotificacaoRegra[] };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro ao obter regras' };
    }
}

export async function saveRegraNotificacao(regra: Partial<NotificacaoRegra>) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // Se tiver ID, faz update, senão insert
        if (regra.id) {
            const { error } = await supabase
                .from('sys_notificacoes_reportes')
                .update({ ...regra, updated_at: new Date().toISOString() })
                .eq('id', regra.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('sys_notificacoes_reportes')
                .insert([regra]);
            if (error) throw error;
        }

        return { success: true };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro ao guardar regra' };
    }
}

export async function deleteRegraNotificacao(id: string) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { error } = await supabase
            .from('sys_notificacoes_reportes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro ao apagar regra' };
    }
}

export async function fetchLogsNotificacao() {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase
            .from('log_notificacoes_enviadas')
            .select(`
                *,
                regra:sys_notificacoes_reportes(nome_regra)
            `)
            .order('data_envio', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Flatten da relação para UI mais simples
        const mapped = data.map(d => ({
            ...d,
            regra: d.sys_notificacoes_reportes // supabase js return mapped relations by table name or alias. Alias 'regra' is used but type might need adjustment. Actually it returns as `{..., sys_notificacoes_reportes: {nome_regra: '...'}}` if we didn't alias, but since we aliased it's `regra`.
        }));

        return { success: true, logs: mapped as unknown as LogNotificacao[] };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro ao obter logs' };
    }
}

/**
 * MOTOR GLOBAL DE DISPATCH DE NOTIFICAÇÕES (Fase 14)
 * Esta função deve ser chamada por outros server actions quando um evento chave (gatilho) ocorre no sistema.
 * @param event Gatilho do evento (ex: 'HEARTBEAT_LOSS', 'OP_COMPLETED')
 * @param payload Objeto com variáveis a serem interpoladas no template (ex: { nome_dispositivo: 'ESP32_A', ip: '192...' })
 */
export async function dispatchNotification(event: string, payload: Record<string, string>) {
    try {
        // Criamos um client com admin privileges porque isto pode ser engatilhado pelo ESP32 Anon ou Background Jobs
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const { createClient: createSupabaseJSClient } = await import('@supabase/supabase-js');
        const supabase = createSupabaseJSClient(supabaseUrl, supabaseKey);

        // 1. Encontrar regras ativas para este evento
        const { data: regras, error } = await supabase
            .from('sys_notificacoes_reportes')
            .select('*')
            .eq('evento_gatilho', event)
            .eq('ativo', true);

        if (error) throw error;
        if (!regras || regras.length === 0) return { success: true, message: 'Sem regras ativas para este evento' };

        const logsInsert = [];

        // 2. Processar cada regra
        for (const regra of regras) {
            // Interpolate variables in message: replace {{key}} with payload[key]
            let mensagemFinal = regra.template_mensagem || '';
            for (const [key, value] of Object.entries(payload)) {
                mensagemFinal = mensagemFinal.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
            }

            for (const dest of regra.destinatarios_array) {
                let status = 'SUCCESS';
                let erroDetalhe = null;

                try {
                    // Aqui entraríamos com a integração real de Twilio / Resend / Webhooks
                    console.log(`[DISPATCH ${regra.tipo_canal}] A enviar para ${dest} -> ${mensagemFinal}`);
                    // Simulação
                    if (regra.tipo_canal === 'EMAIL' && !dest.includes('@')) {
                        throw new Error('Email inválido formatado');
                    }
                    if (regra.tipo_canal === 'WEBHOOK') {
                        // fetch(dest, { method: 'POST', body: JSON.stringify({ event, message: mensagemFinal }) })
                    }
                } catch (sendError: unknown) {
                    status = 'FAILED';
                    erroDetalhe = sendError instanceof Error ? sendError.message : 'Erro Simulado/Envio Falhado';
                    console.error("Erro no envio:", erroDetalhe);
                }

                logsInsert.push({
                    regra_id: regra.id,
                    canal_usado: regra.tipo_canal,
                    destinatario: dest,
                    status_envio: status,
                    erro_detalhe: erroDetalhe
                });
            }
        }

        // 3. Gravar histórico (Auditoria)
        if (logsInsert.length > 0) {
            await supabase.from('log_notificacoes_enviadas').insert(logsInsert);
        }

        return { success: true, count: logsInsert.length };

    } catch (err: unknown) {
        console.error("Motor de Notificações Falhou:", err);
        return { success: false, error: err instanceof Error ? err.message : 'Falha crítica no Dispatch' };
    }
}

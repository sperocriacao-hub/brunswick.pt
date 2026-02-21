'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function fetchIoTEquipments() {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase
            .from('equipamentos_iot')
            .select(`
                id, mac_address, nome_dispositivo, ip_local, versao_firmware, ultimo_heartbeat, ativo,
                estacao_id
            `)
            .order('nome_dispositivo');

        if (error) {
            // Se a tabela não existir ainda (migração Pendente), retorna vazia para não quebrar UI
            if (error.code === '42P01') return { success: true, equipamentos: [], pendenteMigracao: true };
            throw error;
        }

        return { success: true, equipamentos: data, pendenteMigracao: false };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro ao obter equipamentos_iot' };
    }
}

export async function fetchIoTLogs(macFilter?: string) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        let query = supabase
            .from('logs_comunicacao_iot')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (macFilter) {
            query = query.eq('mac_address', macFilter);
        }

        const { data, error } = await query;
        if (error) {
            if (error.code === '42P01') return { success: true, logs: [], pendenteMigracao: true };
            throw error;
        }

        return { success: true, logs: data, pendenteMigracao: false };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro ao obter logs' };
    }
}

export async function registerHeartbeat(macAddress: string, ipLocal: string, fwVersion: string) {
    try {
        // Simulando a API Anon do ESP32 para fins de debug (Usamos Service Key p/ admin actions)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const { createClient: createSupabaseJSClient } = await import('@supabase/supabase-js');
        const supabase = createSupabaseJSClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
            .from('equipamentos_iot')
            .upsert({
                mac_address: macAddress,
                nome_dispositivo: `ESP32_${macAddress.slice(-4)}`,
                ip_local: ipLocal,
                versao_firmware: fwVersion,
                ultimo_heartbeat: new Date().toISOString()
            }, { onConflict: 'mac_address' });

        if (error) throw error;

        // Inserir Log do comando Heartbeat
        await supabase.from('logs_comunicacao_iot').insert({
            mac_address: macAddress,
            tipo_evento: 'HEARTBEAT',
            payload_recebido: { ip: ipLocal, fw: fwVersion },
            mensagem_resposta: '200 OK - Heartbeat Registered',
            status_codigo: 200
        });

        return { success: true };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro ao registar heartbeat' };
    }
}

export async function submitRfidScanSimulator(macAddress: string, rfidTag: string, stationId?: string) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const { createClient: createSupabaseJSClient } = await import('@supabase/supabase-js');
        const supabase = createSupabaseJSClient(supabaseUrl, supabaseKey);

        // Simulador executa as validações como se fosse a BD/API
        // 1. Procurar O Operador via RFID (Fictício ou Real se aplicável) - Simularemos insert direto em Logs
        await supabase.from('logs_comunicacao_iot').insert({
            mac_address: macAddress,
            tipo_evento: 'RFID_SCAN',
            payload_recebido: { rfid: rfidTag, estacao_local: stationId || null },
            mensagem_resposta: '200 OK - Scan Processed',
            status_codigo: 200
        });

        // 2. Idealmente, isto chamava uma RPC "processar_scan_rfid" na DB
        // ... (Para já, ficamos pelo Log)

        return { success: true, message: "Tag processada. Verifique os Logs." };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro ao simular scan' };
    }
}

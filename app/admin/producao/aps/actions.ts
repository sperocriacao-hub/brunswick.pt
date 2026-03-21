'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function buscarDadosAPS() {
    try {
        const cookieStore = cookies() as any;
        const supabase = createClient(cookieStore);

        const { data: ordens, error: errOrdens } = await supabase
            .from('ordens_producao')
            .select(`
                id, op_numero, display_nome, status, prioridade, edt_estimado, op_tipo, modelo_id, data_prevista_inicio,
                molde_casco_id, molde_coberta_id,
                modelos ( nome_modelo )
            `)
            .in('status', ['PLANNED', 'IN_PROGRESS']);
            
        if (errOrdens) throw errOrdens;

        const { data: bottlenecks, error: errBtl } = await supabase
            .from('vw_aps_historico_tempos')
            .select('*');

        if (errBtl) throw errBtl;

        const { data: moldesRaw, error: errMoldes } = await supabase
            .from('moldes')
            .select('id, nome_parte, rfid, ciclos_estimados, manutenir_em, status')
            .neq('status', 'Retirado');

        if (errMoldes) throw errMoldes;

        const { data: estacoes, error: errEst } = await supabase
            .from('estacoes')
            .select('id, nome_estacao')
            .order('nome_estacao');

        const { data: activeRfids, error: errRfid } = await supabase
            .from('registos_rfid_realtime')
            .select('id, op_id, estacao_id, timestamp_inicio')
            .is('timestamp_fim', null);

        const { data: manutencoes, error: errMan } = await supabase
            .from('moldes_intervencoes')
            .select('id, molde_id, data_abertura, data_conclusao, status, descricao')
            .neq('status', 'Encerrada');

        if (errMan) throw errMan;

        return { success: true, ordens, bottlenecks, moldes: moldesRaw, manutencoes: manutencoes || [], estacoes: estacoes || [], activeRfids: activeRfids || [] };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function salvarPlaneamentoAPS(orderId: string, novaDataStr: string | null) {
    try {
        const cookieStore = cookies() as any;
        const supabase = createClient(cookieStore);

        const payload = novaDataStr 
            ? { data_prevista_inicio: novaDataStr, status: 'PLANNED' }
            : { data_prevista_inicio: null, status: 'PLANNED' };

        const { error } = await supabase
            .from('ordens_producao')
            .update(payload)
            .eq('id', orderId);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function concluirOperacaoWorkcenter(rfidId: string) {
    try {
        const cookieStore = cookies() as any;
        const supabase = createClient(cookieStore);

        const { error } = await supabase
            .from('registos_rfid_realtime')
            .update({ timestamp_fim: new Date().toISOString() })
            .eq('id', rfidId);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

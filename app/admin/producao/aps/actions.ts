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
                id, op_numero, status, prioridade, edt_estimado, op_tipo, modelo_id, data_prevista_inicio,
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

        return { success: true, ordens, bottlenecks, moldes: moldesRaw };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function salvarPlaneamentoAPS(orderId: string, novaDataStr: string) {
    try {
        const cookieStore = cookies() as any;
        const supabase = createClient(cookieStore);

        const { error } = await supabase
            .from('ordens_producao')
            .update({ data_prevista_inicio: novaDataStr, status: 'PLANNED' })
            .eq('id', orderId);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

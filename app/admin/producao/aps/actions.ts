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

        return { success: true, ordens, bottlenecks };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

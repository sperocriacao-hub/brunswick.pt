'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function getProductionOrders() {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const [ordensResult, linhasResult, areasResult, wipsResult] = await Promise.all([
            // Ordens
            supabase
                .from('ordens_producao')
                .select(`
                    id, op_numero, modelo_id, status, data_inicio, data_fim, display_nome, rfid_token, num_serie, linha_id,
                    modelos(nome_modelo, model_year),
                    linhas_producao(nome_linha)
                `)
                .order('data_inicio', { ascending: false }),
            
            // Linhas
            supabase.from('linhas_producao').select('id, nome_linha').order('nome_linha'),
            
            // Areas
            supabase.from('areas_fabrica').select('id, nome_area').order('ordem_sequencial'),

            // WIP Realtime for Area mapping
            supabase
                .from('registos_rfid_realtime')
                .select(`
                    op_id, estacao_id,
                    estacoes(id, area_id)
                `)
                .is('timestamp_fim', null)
        ]);

        if (ordensResult.error) throw ordensResult.error;

        return { 
            success: true, 
            data: ordensResult.data,
            linhas: linhasResult.data || [],
            areas: areasResult.data || [],
            wips: wipsResult.data || []
        };
    } catch (error: any) {
        console.error('Error fetching production orders and filters:', error);
        return { success: false, error: 'Falha ao carregar o histórico e filtros.' };
    }
}

export async function inactivateProductionOrder(orderId: string) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { error } = await supabase
            .from('ordens_producao')
            .update({ status: 'Cancelada' })
            .eq('id', orderId);

        if (error) throw error;

        revalidatePath('/admin/producao/ordens');
        return { success: true };
    } catch (error: any) {
        console.error('Error inactivating OP:', error);
        return { success: false, error: 'Falha ao Cancelar a Ordem de Produção.' };
    }
}

'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function getProductionOrders() {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase
            .from('ordens_producao')
            .select(`
                id, op_numero, modelo_id, status, data_inicio, data_fim,
                modelos(nome_modelo, model_year)
            `)
            .order('data_inicio', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching production orders:', error);
        return { success: false, error: 'Falha ao carregar o histórico de Ordens de Produção.' };
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

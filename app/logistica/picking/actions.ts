'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getPedidosLive() {
    try {
        const { data, error } = await supabase
            .from('logistica_pedidos')
            .select(`
                id,
                status,
                prioridade,
                created_at,
                started_picking_at,
                delivered_at,
                peca_solicitada,
                operador_logistica,
                ordens_producao:ordem_producao_id (
                    id, 
                    hin_hull_id, 
                    offset_semana, 
                    linhas_producao:linha_id(letra_linha, descricao_linha),
                    modelos:modelo_id(nome)
                ),
                estacoes:estacao_destino_id (id, nome_estacao, areas_fabrica!inner(nome_area))
            `)
            .order('created_at', { ascending: false })
            .limit(50); // Get latest 50 orders in the queue

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (err: any) {
        console.error('getPedidosLive error:', err);
        return { success: false, error: err.message };
    }
}

export async function updateStatusPedido(pedidoId: string, novoStatus: 'Pendente' | 'Em Picking' | 'Entregue', fallbackOperador?: string) {
    try {
        const updatePayload: any = {
            status: novoStatus
        };

        if (novoStatus === 'Em Picking') {
            updatePayload.started_picking_at = new Date().toISOString();
        } else if (novoStatus === 'Entregue') {
            updatePayload.delivered_at = new Date().toISOString();
            if (fallbackOperador) updatePayload.operador_logistica = fallbackOperador;
        }

        const { error } = await supabase
            .from('logistica_pedidos')
            .update(updatePayload)
            .eq('id', pedidoId);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('updateStatusPedido error:', err);
        return { success: false, error: err.message };
    }
}

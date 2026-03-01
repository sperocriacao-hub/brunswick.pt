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

export async function getKittingForecast() {
    try {
        // Obter todas as ordens de produção ativas e a sua posição (usamos a vw_esp32_query_fast se possível, ou as OPs)
        // Para simplificar neste MVP, vamos olhar para todas as OPs ativas e todas as regras de routing.

        // 1. Obter Ordens de Produção em progresso (status = 'Em Producao')
        const { data: ordens, error: errOps } = await supabase
            .from('ordens_producao')
            .select(`
                id, hin_hull_id, data_prevista_inicio, 
                modelos:modelo_id(id, nome),
                linhas_producao:linha_id(id, letra_linha)
            `)
            .eq('status', 'Em Producao');

        if (errOps) throw errOps;

        // 2. Obter as transições que requerem Kitting
        const { data: sequenciasKitting, error: errKitting } = await supabase
            .from('estacoes_sequencia')
            .select(`
                id, kitting_offset_horas,
                predecessora_id,
                sucessora:estacao_sucessora_id(id, nome_estacao, areas_fabrica!inner(nome_area))
            `)
            .eq('requer_kitting', true);

        if (errKitting) throw errKitting;

        // 3. Obter o mapeamento de tempos (SLA Standard da Linha)
        const { data: timings, error: errTimings } = await supabase
            .from('modelo_area_timing')
            .select('modelo_id, area_id, offset_dias, duracao_dias');

        if (errTimings) throw errTimings;

        // 4. Lógica de Cruzamento: Para cada OP em curso, calcular quando chegará a cada "Estação que requer Kitting".
        // Isto envolve olhar para a área da Estação Sucessora, ver o Offset dessa Área no `modelo_area_timing`, 
        // e adicionar à `data_prevista_inicio` da O.P.

        const forecastList: any[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        (ordens || []).forEach((op: any) => {
            const opStartDate = new Date(op.data_prevista_inicio || new Date());

            (sequenciasKitting || []).forEach((seq: any) => {
                const areaAlvoId = seq.sucessora?.areas_fabrica?.id || null;
                // Procurar a regra de timing para o modelo deste barco na área alvo
                const regraTempo = (timings || []).find((t: any) => t.modelo_id === op.modelos?.id && t.area_id === areaAlvoId);

                // Se existe uma regra de offset_dias, podemos calcular a Data Prevista base
                const offsetDias = regraTempo ? regraTempo.offset_dias : 0;

                // Data Prevista = Data Início da OP + Offset da Área - Offset Específico de Kitting (em horas -> dias)
                const offsetTotalDiasAjustado = offsetDias - (seq.kitting_offset_horas / 24);

                const dataPrevistaKitting = new Date(opStartDate);
                dataPrevistaKitting.setDate(dataPrevistaKitting.getDate() + Math.max(0, offsetTotalDiasAjustado));

                // Classificar o balde temporal (Hoje vs Amanhã vs Futuro)
                dataPrevistaKitting.setHours(0, 0, 0, 0);

                let timeBucket = 'Futuro';
                if (dataPrevistaKitting.getTime() === today.getTime()) timeBucket = 'Hoje';
                else if (dataPrevistaKitting.getTime() === tomorrow.getTime()) timeBucket = 'Amanhã';
                else if (dataPrevistaKitting.getTime() < today.getTime()) timeBucket = 'Em Atraso (Hoje)';

                // Exibir Forecast para 3 dias úteis apenas para não inundar o ecrã
                const diffTime = dataPrevistaKitting.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 3) {
                    forecastList.push({
                        id: `fc_${op.id}_${seq.id}`,
                        op_id: op.id,
                        hin_hull_id: op.hin_hull_id,
                        modelo_nome: op.modelos?.nome,
                        linha_nome: op.linhas_producao?.letra_linha,
                        estacao_destino: seq.sucessora?.nome_estacao,
                        area_destino: seq.sucessora?.areas_fabrica?.nome_area,
                        data_prevista: dataPrevistaKitting.toISOString(),
                        bucket: timeBucket,
                        offset_aviso_horas: seq.kitting_offset_horas
                    });
                }
            });
        });

        // Ordenar Forecast
        forecastList.sort((a, b) => new Date(a.data_prevista).getTime() - new Date(b.data_prevista).getTime());

        return { success: true, data: forecastList };
    } catch (err: any) {
        console.error('getKittingForecast error:', err);
        return { success: false, error: err.message };
    }
}

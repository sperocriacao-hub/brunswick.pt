'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// A TV Cast tem Acessos Super Admin ao nivel da base de dados porque corre como Node Edge
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function buscarDashboardsTV(area_id: string) {
    try {
        // 1. Validar a Linha/Área (Saber se é Traz, Frente, Pintura, Laminação etc.)
        const { data: areaData, error: lErr } = await supabase
            .from('areas_fabrica')
            .select('*')
            .eq('id', area_id)
            .single();

        if (lErr || !areaData) {
            return { success: false, error: "Área Indisponível." };
        }

        // 2. Procurar estacoes que pertencem a esta area
        const { data: estacoesDaArea } = await supabase
            .from('estacoes')
            .select('id')
            .eq('area_id', area_id);

        const dictEstacoes = estacoesDaArea ? estacoesDaArea.map(e => e.id) : [];

        // 3. Buscar Barcos (OPs) In_Progress mapeadas a alguem nesta área (via registos_rfid_realtime)
        // Como o M.E.S. funciona por estações, pescamos os activos nas estações detectadas

        let barcos: any[] = [];
        if (dictEstacoes.length > 0) {
            const { data: opsAtivasArea } = await supabase
                .from('registos_rfid_realtime')
                .select(`
                    id, op_id, estacao_id, timestamp_fim,
                    ordem:op_id(id, op_numero, hin_hull_id, status, semana_planeada, modelos ( nome_modelo ))
                `)
                .is('timestamp_fim', null) // Ativo na estacao
                .in('estacao_id', dictEstacoes);

            // Deduplicate boats by op_id
            const uniqueBarcos = new Map();
            opsAtivasArea?.forEach((reg: any) => {
                if (reg.ordem && !uniqueBarcos.has(reg.ordem.id)) {
                    uniqueBarcos.set(reg.ordem.id, reg.ordem);
                }
            });
            barcos = Array.from(uniqueBarcos.values()).slice(0, 4);
        }

        // 3. Verificar de todas as Estações dessa linha, se existe algum ALERTA ANDON a disparar
        // Para isso, precisamos mapear as estações ativas com os alertas não resolvidos
        const { data: alertas, error: aErr } = await supabase
            .from('alertas_andon')
            .select(`
                id, situacao, estacao_id, created_at, operador_rfid, op_id, tipo_alerta, descricao_alerta,
                estacoes:estacao_id ( nome_estacao, area_id )
            `)
            .eq('resolvido', false);

        if (aErr) throw aErr;

        // Filtrar Alertas ativos que pertencem à Área que estamos a monitorizar
        const alertasGlobais = alertas?.filter((al: any) => al.estacoes?.area_id === area_id) || [];

        return {
            success: true,
            area: areaData,
            barcos: barcos,
            alertasGlobais: alertasGlobais
        };
    } catch (err: any) {
        return { success: false, error: err.message || "Erro Técnico TV." };
    }
}

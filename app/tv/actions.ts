'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// A TV Cast tem Acessos Super Admin ao nivel da base de dados porque corre como Node Edge
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function buscarDashboardsTV(tv_id: string) {
    try {
        // 1. O que é que esta TV mostra afinal?
        const { data: configTv, error: tvErr } = await supabase
            .from('vw_tvs_configuradas')
            .select('*')
            .eq('id', tv_id)
            .single();

        if (tvErr || !configTv) {
            return { success: false, error: "Referência de TV Indisponível." };
        }

        const tipoAlvo = configTv.tipo_alvo; // 'LINHA', 'AREA', 'GERAL'
        const alvoId = configTv.alvo_id;

        // 2. Dependendo do Tipo de Alvo, recolher quais Estações pertencem a esse escopo
        let dictEstacoes: string[] = [];

        if (tipoAlvo === 'LINHA') {
            const { data: estacoesDaLinha } = await supabase
                .from('estacoes')
                .select('id')
                .eq('linha_id', alvoId);
            dictEstacoes = estacoesDaLinha ? estacoesDaLinha.map(e => e.id) : [];
        } else if (tipoAlvo === 'AREA') {
            const { data: estacoesDaArea } = await supabase
                .from('estacoes')
                .select('id')
                .eq('area_id', alvoId);
            dictEstacoes = estacoesDaArea ? estacoesDaArea.map(e => e.id) : [];
        } else {
            // GERAL: Todas as estações da fábrica
            const { data: todasEstacoes } = await supabase.from('estacoes').select('id');
            dictEstacoes = todasEstacoes ? todasEstacoes.map(e => e.id) : [];
        }

        // 3. Buscar Barcos (OPs) In_Progress nas Estações deste escopo
        let barcos: any[] = [];
        if (dictEstacoes.length > 0) {
            const { data: opsAtivasScope } = await supabase
                .from('registos_rfid_realtime')
                .select(`
                    id, op_id, estacao_id, timestamp_fim,
                    ordem:op_id(id, op_numero, hin_hull_id, status, semana_planeada, modelos ( nome_modelo ))
                `)
                .is('timestamp_fim', null) // Ativo na estacao
                .in('estacao_id', dictEstacoes);

            // Deduplicate boats by op_id
            const uniqueBarcos = new Map();
            opsAtivasScope?.forEach((reg: any) => {
                if (reg.ordem && !uniqueBarcos.has(reg.ordem.id)) {
                    uniqueBarcos.set(reg.ordem.id, reg.ordem);
                }
            });
            barcos = Array.from(uniqueBarcos.values()).slice(0, 4);
        }

        // 4. Detetar de todas as Estações deste escopo, se existe ALERTA ANDON a disparar
        const { data: alertas, error: aErr } = await supabase
            .from('alertas_andon')
            .select(`
                id, situacao, estacao_id, created_at, operador_rfid, op_id, tipo_alerta, descricao_alerta,
                estacoes:estacao_id ( nome_estacao, area_id, linha_id )
            `)
            .eq('resolvido', false)
            .in('estacao_id', dictEstacoes); // <- Filtro direto pelas estações alvo da TV

        if (aErr) throw aErr;

        return {
            success: true,
            config: configTv,
            barcos: barcos,
            alertasGlobais: alertas || []
        };
    } catch (err: any) {
        return { success: false, error: err.message || "Erro Técnico TV." };
    }
}

'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function fetchFormularioNovaOPData() {
    try {
        // 1. Modelos
        const { data: modelos } = await supabase
            .from('modelos')
            .select('id, nome_modelo, model_year')
            .order('nome_modelo', { ascending: true });

        // 2. Linhas de Produção
        const { data: linhas } = await supabase
            .from('linhas_producao')
            .select('id, nome, letra')
            .order('letra', { ascending: true });

        // 3. Roteiros de Produção Completos
        // Para extrair o offset e duração teremos que cruzar Roteiros com Estações se estruturados assim
        const { data: roteiros } = await supabase
            .from('roteiros_producao')
            .select(`
                id, 
                ordem_tarefa, 
                tempo_ciclo,
                modelo_id,
                estacoes (nome_estacao)
            `)
            .order('ordem_tarefa', { ascending: true });

        // 4. Opcionais por Modelo
        const { data: opcionais } = await supabase
            .from('opcionais')
            .select('id, nome_opcao, modelo_id');

        // 5. Moldes (Migration 0012)
        const { data: moldes, error: moldesErr } = await supabase
            .from('moldes')
            .select('id, nome_parte, rfid, ciclos_estimados');

        // Se a migration 0012 ainda não tiver corrido do lado do cliente, ignoramos por agora a falha dos moldes.
        const moldesSeguros = moldesErr ? [] : (moldes || []);

        return {
            success: true,
            data: {
                modelos: modelos || [],
                linhas: linhas || [],
                roteiros: roteiros || [],
                opcionais: opcionais || [],
                moldes: moldesSeguros
            }
        };

    } catch (err: unknown) {
        console.error("Erro a extrair payload Producao:", err);
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

export async function emitirOrdemProducao(payload: any) {
    try {
        const payloadOP = {
            modelo_id: payload.modelo_id,
            linha_id: payload.linha_id,
            op_numero: payload.op_numero,
            pp_plan: payload.pp_plan,
            po_compra: payload.po_compra,
            hin_hull_id: payload.hin_hull_id,
            num_serie: payload.num_serie,
            cliente: payload.cliente,
            pais: payload.pais,
            brand_region: payload.region,
            data_inicio: payload.data_inicio,
            data_fim: payload.data_fim,
            status: 'PLANNED',
            rfid_casco: payload.rfid_casco,
            rfid_coberta: payload.rfid_coberta,
            rfid_small_parts: payload.rfid_small_parts,
            rfid_liner: payload.rfid_liner,
            molde_casco_id: payload.molde_casco_id,
            molde_coberta_id: payload.molde_coberta_id,
            molde_small_parts_id: payload.molde_small_parts_id,
            molde_liner_id: payload.molde_liner_id
        };

        const { data, error } = await supabase
            .from('ordens_producao')
            .insert(payloadOP)
            .select('id')
            .single();

        if (error) throw error;

        return { success: true, id: data.id };
    } catch (err: unknown) {
        console.error("Erro ao inserir Ordem Producao:", err);
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

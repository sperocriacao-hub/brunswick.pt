'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function fetchFormularioNovaOPData() {
    try {
        // 1. Modelos
        const { data: modelos, error: errModelos } = await supabase
            .from('modelos')
            .select('id, nome_modelo, model_year')
            .order('nome_modelo', { ascending: true });
        if (errModelos) throw errModelos;

        // 2. Linhas de Produção
        const { data: linhas, error: errLinhas } = await supabase
            .from('linhas_producao')
            .select('id, descricao_linha, letra_linha')
            .order('letra_linha', { ascending: true });
        if (errLinhas) throw errLinhas;

        // 3. Roteiros de Produção Completos
        const { data: roteiros, error: errRoteiros } = await supabase
            .from('roteiros_producao')
            .select(`
                id, 
                sequencia, 
                tempo_ciclo,
                modelo_id,
                estacoes (nome_estacao)
            `)
            .order('sequencia', { ascending: true });
        if (errRoteiros) throw errRoteiros;

        // 4. Opcionais por Modelo
        const { data: opcionais, error: errOpc } = await supabase
            .from('opcionais')
            .select('id, nome_opcao, modelo_id');
        if (errOpc) throw errOpc;

        // 5. Moldes (Migration 0012 + 0022 TPM)
        const { data: moldes, error: moldesErr } = await supabase
            .from('moldes')
            .select('id, nome_parte, rfid, ciclos_estimados, manutenir_em, status');

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

        // TPM Moldes Poka-yoke: Incrementar os ciclos dos moldes selecionados
        const moldesToIncrement = [
            payload.molde_casco_id,
            payload.molde_coberta_id,
            payload.molde_small_parts_id,
            payload.molde_liner_id
        ].filter(Boolean);

        if (moldesToIncrement.length > 0) {
            await Promise.all(moldesToIncrement.map(async (mId) => {
                // Fetch the current ciclos safely to avoid losing atomicity in simple setups
                const { data: mData } = await supabase.from('moldes').select('ciclos_estimados').eq('id', mId).single();
                if (mData) {
                    await supabase.from('moldes').update({ ciclos_estimados: (mData.ciclos_estimados || 0) + 1 }).eq('id', mId);
                }
            }));
        }

        return { success: true, id: data.id };
    } catch (err: unknown) {
        console.error("Erro ao inserir Ordem Producao:", err);
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

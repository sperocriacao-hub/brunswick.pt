'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Re-use the existing master data fetcher from the Nova section
export { fetchFormularioNovaOPData } from '../../nova/actions';

export async function getOrdemProducaoById(id: string) {
    try {
        const { data, error } = await supabase
            .from('ordens_producao')
            .select(`
                *,
                ordens_producao_opcionais (
                    opcional_id
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err: unknown) {
        console.error("Erro a extrair Ordem Producao por ID:", err);
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

export async function atualizarOrdemProducao(id: string, payload: any) {
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
            rfid_casco: payload.rfid_casco,
            rfid_coberta: payload.rfid_coberta,
            rfid_small_parts: payload.rfid_small_parts,
            rfid_liner: payload.rfid_liner,
            molde_casco_id: payload.molde_casco_id,
            molde_coberta_id: payload.molde_coberta_id,
            molde_small_parts_id: payload.molde_small_parts_id,
            molde_liner_id: payload.molde_liner_id,
            rfid_token: payload.rfid_token || null,
            display_nome: payload.display_nome || null
        };

        const { error } = await supabase
            .from('ordens_producao')
            .update(payloadOP)
            .eq('id', id);

        if (error) throw error;

        // 2. Atualizar Opcionais (Apagar antigos e inserir novos)
        await supabase.from('ordens_producao_opcionais').delete().eq('op_id', id);
        
        if (payload.opcionais_selecionados && payload.opcionais_selecionados.length > 0) {
            const opcionaisLinks = payload.opcionais_selecionados.map((opcId: string) => ({
                op_id: id,
                opcional_id: opcId
            }));

            const { error: opcError } = await supabase
                .from('ordens_producao_opcionais')
                .insert(opcionaisLinks);

            if (opcError) console.error("Falha a linkar Opcionais à OP no Update", opcError);
        }

        return { success: true };
    } catch (err: unknown) {
        console.error("Erro ao atualizar Ordem Producao:", err);
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

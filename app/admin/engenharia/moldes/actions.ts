'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function fetchMoldesMestres() {
    try {
        const { data: moldes, error: errMoldes } = await supabase
            .from('moldes')
            .select(`
                *,
                modelo_base:modelo_base_id (nome_modelo)
            `)
            .order('categoria', { ascending: true })
            .order('nome_parte', { ascending: true });

        if (errMoldes) throw errMoldes;

        const { data: relacoes, error: errRelacoes } = await supabase
            .from('moldes_opcionais')
            .select('molde_id, opcional_id');

        if (errRelacoes) throw errRelacoes;

        return { success: true, moldes: moldes || [], relacoes: relacoes || [] };
    } catch (err: any) {
        console.error("fetchMoldesMestres", err);
        return { success: false, error: err.message };
    }
}

export async function getModelosForSelect() {
    const { data } = await supabase.from('modelos').select('id, nome_modelo').order('nome_modelo');
    return data || [];
}

export async function getOpcionaisForSelect() {
    const { data } = await supabase.from('opcionais').select('id, nome_opcao, modelo:modelo_id (nome_modelo)').order('nome_opcao');
    return data || [];
}

export async function createMolde(payload: any, optionsIds: string[], svgContent: string) {
    try {
        const insertPayload = {
            nome_parte: payload.nome_parte,
            rfid: payload.rfid ? payload.rfid : null,
            manutenir_em: parseInt(payload.manutenir_em),
            categoria: payload.categoria,
            tipo_parte: payload.tipo_parte,
            modelo_base_id: payload.modelo_base_id || null,
            moldagem_obrigatoria: payload.moldagem_obrigatoria
        };

        const { data, error } = await supabase.from('moldes').insert(insertPayload).select('id').single();
        if (error) throw error;

        if (optionsIds && optionsIds.length > 0) {
            const rels = optionsIds.map(optId => ({
                molde_id: data.id,
                opcional_id: optId
            }));
            const { error: relErr } = await supabase.from('moldes_opcionais').insert(rels);
            if (relErr) throw relErr;
        }

        // 3. Cadastrar a Geometria SVG para Cockpit TPM se existir
        if (svgContent && svgContent.trim().startsWith('<svg')) {
            const { error: svgErr } = await supabase.from('moldes_geometria').insert({
                molde_id: data.id,
                nome_vista: 'Vista Superior',
                svg_content: svgContent
            });
            if (svgErr) console.error("Falha a guardar SVG: ", svgErr);
        }

        revalidatePath('/admin/engenharia/moldes');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function deleteMolde(id: string) {
    try {
        const { error } = await supabase.from('moldes').delete().eq('id', id);
        if (error) throw error;
        revalidatePath('/admin/engenharia/moldes');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

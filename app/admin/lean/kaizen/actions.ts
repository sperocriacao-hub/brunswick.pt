"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getKaizens() {
    try {
        const { data, error } = await supabase
            .from("lean_kaizen")
            .select(`
                *,
                operadores(nome_operador, sobrenome),
                areas_fabrica(nome_area)
            `)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateKaizenStatus(id: string, payload: any) {
    try {
        const { error } = await supabase
            .from("lean_kaizen")
            .update(payload)
            .eq("id", id);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function convertKaizenToAction(kaizen: any) {
    try {
        // Create an action in the lean_acoes table
        const { error } = await supabase
            .from("lean_acoes")
            .insert([{
                titulo: `KAIZEN: \${kaizen.titulo}`,
                descricao: `Implementar a melhoria proposta por \${kaizen.operadores?.nome_operador}.\\nSOLUÇÃO: \${kaizen.proposta_melhoria}`,
                origem_tipo: 'Kaizen',
                origem_id: kaizen.id,
                area_id: kaizen.area_id,
                status: 'To Do'
            }]);

        if (error) throw error;

        // Mark the Kaizen as Accepted
        await updateKaizenStatus(kaizen.id, {
            status: 'Aceite',
            data_avaliacao: new Date().toISOString()
        });

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

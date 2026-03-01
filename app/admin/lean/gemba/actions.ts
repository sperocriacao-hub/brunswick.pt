"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getGembaWalks() {
    try {
        const { data, error } = await supabase
            .from("lean_gemba_walks")
            .select(`
                *,
                areas_fabrica(nome_area)
            `)
            .order("data_ronda", { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function submitGembaWalk(payload: any) {
    try {
        const { error } = await supabase
            .from("lean_gemba_walks")
            .insert([payload]);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function submitGembaAction(walkId: string, areaId: string, observation: string) {
    try {
        const { error } = await supabase
            .from("lean_acoes")
            .insert([{
                titulo: `Ação Gemba Walk`,
                descricao: `Correção observada na Ronda Gemba: \${observation}`,
                origem_tipo: 'Gemba Walk',
                origem_id: walkId,
                area_id: areaId,
                status: 'To Do'
            }]);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

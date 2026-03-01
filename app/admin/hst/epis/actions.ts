"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getEpiMatrixData() {
    try {
        // Obter todas as áreas da fábrica ordenadas
        const { data: areas, error: areasErr } = await supabase
            .from("areas_fabrica")
            .select("id, nome_area, ordem_sequencial")
            .order("ordem_sequencial", { ascending: true });

        if (areasErr) throw areasErr;

        // Obter as matrizes EPI gravadas
        const { data: matrizes, error: matErr } = await supabase
            .from("hst_matriz_epis")
            .select("*");

        if (matErr) throw matErr;

        return { success: true, areas: areas || [], matrizes: matrizes || [] };
    } catch (e: any) {
        return { success: false, error: e.message, areas: [], matrizes: [] };
    }
}

export async function toggleEpiRequirement(areaId: string, epiColumn: string, isRequired: boolean) {
    try {
        // Verificar se já existe um registo para esta área
        const { data: existing } = await supabase
            .from("hst_matriz_epis")
            .select("id")
            .eq("area_id", areaId)
            .single();

        if (existing) {
            // Atualiza
            const { error } = await supabase
                .from("hst_matriz_epis")
                .update({ [epiColumn]: isRequired })
                .eq("id", existing.id);
            if (error) throw error;
        } else {
            // Cria um novo
            const payload = {
                area_id: areaId,
                [epiColumn]: isRequired
            };
            const { error } = await supabase
                .from("hst_matriz_epis")
                .insert(payload);
            if (error) throw error;
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

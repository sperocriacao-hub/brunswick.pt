"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getLeanAcoes() {
    try {
        const { data, error } = await supabase
            .from("lean_acoes")
            .select(`
                *,
                areas_fabrica(nome_area)
            `)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateActionStatus(id: string, novoStatus: string) {
    try {
        const updatePayload: any = { status: novoStatus };
        if (novoStatus === 'Done') {
            updatePayload.data_conclusao = new Date().toISOString();
        }

        const { error } = await supabase
            .from("lean_acoes")
            .update(updatePayload)
            .eq("id", id);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getRncs() {
    try {
        const { data, error } = await supabase
            .from("qualidade_rnc")
            .select(`
                *,
                ordens_producao (id),
                estacoes (nome_estacao),
                qualidade_8d (id, numero_8d, status),
                qualidade_a3 (id, titulo, status)
            `)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (err: any) {
        console.error("Erro a carregar RNCs: ", err);
        return { success: false, error: err.message };
    }
}

export async function getSelectData() {
    try {
        const { data: ops } = await supabase
            .from("ordens_producao")
            .select("id, modelos (nome_modelo)")
            .neq("estado", "Concluida")
            .order("data_prevista_inicio", { ascending: false });

        const { data: estacoes } = await supabase
            .from("estacoes")
            .select("id, nome_estacao, areas_fabrica(nome_area)")
            .order("areas_fabrica(ordem_sequencial)", { ascending: true });

        return { success: true, ops, estacoes };
    } catch (err) {
        return { success: false, ops: [], estacoes: [] };
    }
}

export async function createRnc(payload: any) {
    try {
        // Gera número (Ex: RNC-2026-X)
        const year = new Date().getFullYear();
        const { count } = await supabase.from("qualidade_rnc").select("*", { count: 'exact', head: true });
        const numRnc = `RNC-${year}-${String((count || 0) + 1).padStart(3, '0')}`;

        const insertData = { ...payload, numero_rnc: numRnc };

        const { error } = await supabase.from("qualidade_rnc").insert(insertData);
        if (error) throw error;

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ---- METODOLOGIA 8D ----
export async function getRncBase(rncId: string) {
    try {
        const { data: rnc, error } = await supabase
            .from("qualidade_rnc")
            .select("*")
            .eq("id", rncId)
            .single();

        if (error) throw error;
        return { success: true, rnc };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function create8d(payload: any) {
    try {
        // Gera número (Ex: 8D-2026-X)
        const year = new Date().getFullYear();
        const { count } = await supabase.from("qualidade_8d").select("*", { count: 'exact', head: true });
        const num8d = `8D-${year}-${String((count || 0) + 1).padStart(3, '0')}`;

        const insertData = { ...payload, numero_8d: num8d };

        const { error } = await supabase.from("qualidade_8d").insert(insertData);
        if (error) throw error;

        // Atualiza a RNC Base para "Em Investigacao" automaticamente
        await supabase.from("qualidade_rnc").update({ status: 'Em Investigacao' }).eq("id", payload.rnc_id);

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ---- METODOLOGIA A3 ----
export async function createA3(payload: any) {
    try {
        const { error } = await supabase.from("qualidade_a3").insert(payload);
        if (error) throw error;

        // Atualiza a RNC Base para "Em Investigacao" automaticamente
        await supabase.from("qualidade_rnc").update({ status: 'Em Investigacao' }).eq("id", payload.rnc_id);

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

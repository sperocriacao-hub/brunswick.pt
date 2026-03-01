"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getLeanFormData() {
    try {
        const { data: areas, error: areaErr } = await supabase
            .from("areas_fabrica")
            .select("id, nome_area, ordem_sequencial")
            .order("ordem_sequencial", { ascending: true });

        const { data: operadores, error: opErr } = await supabase
            .from("operadores")
            .select("id, nome, apelido, numero_mecanografico, funcao, avatar_url")
            .eq("status", "Ativo")
            .order("nome", { ascending: true });

        if (areaErr || opErr) {
            return { success: false, error: "Erro a carregar as dependências." };
        }

        return { success: true, areas, operadores };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function submitKaizen(payload: any) {
    try {
        const { error } = await supabase
            .from("lean_kaizen")
            .insert([payload]);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

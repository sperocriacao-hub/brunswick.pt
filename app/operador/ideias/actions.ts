"use server";

import { createClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getLeanFormData() {
    noStore();
    try {
        const { data: areas, error: areaErr } = await supabase
            .from("areas_fabrica")
            .select("id, nome_area, ordem_sequencial")
            .order("ordem_sequencial", { ascending: true });

        const { data: estacoes, error: estErr } = await supabase
            .from("estacoes")
            .select("id, nome_estacao, area_id")
            .order("nome_estacao", { ascending: true });

        const { data: operadores, error: opErr } = await supabase
            .from("operadores")
            .select("id, nome_operador, numero_mecanografico, funcao, avatar_url")
            .order("nome_operador", { ascending: true });

        if (areaErr || opErr || estErr) {
            console.error("DEBUG FETCH:", areaErr, opErr, estErr);
            return { success: false, error: "Erro a carregar as dependências." };
        }

        return { success: true, areas, estacoes, operadores };
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

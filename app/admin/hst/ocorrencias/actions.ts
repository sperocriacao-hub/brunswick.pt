"use server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getHstOcorrencias() {
    try {
        const { data, error } = await supabase
            .from("hst_ocorrencias")
            .select(`
                *,
                operadores(nome, apelido),
                areas_fabrica(nome_area),
                estacoes(nome_estacao)
            `)
            .order("data_hora_ocorrencia", { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function submitHstOcorrencia(payload: any) {
    try {
        const { error } = await supabase
            .from("hst_ocorrencias")
            .insert([payload]);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function fecharOcorrencia(id: string, tratamento: string, diasBaixa: number) {
    try {
        const { error } = await supabase
            .from("hst_ocorrencias")
            .update({
                status: 'Fechado',
                tratamento_aplicado: tratamento,
                dias_baixa: diasBaixa
            })
            .eq("id", id);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

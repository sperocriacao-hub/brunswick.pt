"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Tipos de Certificações ---
export async function getTiposCertificacao() {
    try {
        const { data, error } = await supabase
            .from("hst_tipos_certificacao")
            .select("*")
            .order("nome", { ascending: true });
        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function addTipoCertificacao(nome: string, descricao: string) {
    try {
        const { data, error } = await supabase
            .from("hst_tipos_certificacao")
            .insert([{ nome, descricao }])
            .select()
            .single();
        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteTipoCertificacao(id: string) {
    try {
        const { error } = await supabase
            .from("hst_tipos_certificacao")
            .delete()
            .eq("id", id);
        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// --- Certificações Atribuídas ---
export async function getOperadoresComCertificados() {
    try {
        // Busca operadores ativos e suas certificacoes
        const { data: operadores, error: opErr } = await supabase
            .from("operadores")
            .select("id, nome_operador, area_base_id")
            .eq("status", "Ativo")
            .order("nome_operador", { ascending: true });

        if (opErr) throw opErr;

        const { data: certificacoes, error: certErr } = await supabase
            .from("hst_operadores_certificacoes")
            .select("id, operador_id, tipo_certificacao_id, data_emissao, data_validade");

        if (certErr) throw certErr;

        const { data: areas } = await supabase.from('areas_fabrica').select('id, nome_area');

        // Mapear area nome para os operadores
        const opsFull = operadores.map(op => {
            const areaName = areas?.find(a => a.id === op.area_base_id)?.nome_area || 'S/ Área';
            return {
                ...op,
                nome_area: areaName
            };
        });

        return { success: true, operadores: opsFull, atribuicoes: certificacoes };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function atribuirCertificacao(payload: {
    operador_id: string;
    tipo_certificacao_id: string;
    data_emissao: string;
    data_validade: string;
}) {
    try {
        // Verificar se já existe, se sim atualiza, se não cria (UPSERT-like behavior manually given constraint)
        const { data: existing } = await supabase
            .from("hst_operadores_certificacoes")
            .select("id")
            .eq("operador_id", payload.operador_id)
            .eq("tipo_certificacao_id", payload.tipo_certificacao_id)
            .maybeSingle();

        if (existing) {
            const { error: updErr } = await supabase
                .from("hst_operadores_certificacoes")
                .update({
                    data_emissao: payload.data_emissao,
                    data_validade: payload.data_validade
                })
                .eq("id", existing.id);
            if (updErr) throw updErr;
        } else {
            const { error: insErr } = await supabase
                .from("hst_operadores_certificacoes")
                .insert([payload]);
            if (insErr) throw insErr;
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

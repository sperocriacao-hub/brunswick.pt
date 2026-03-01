"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 1. Carrega toda a Ficha Técnica de Auditoria 2D do Molde
export async function getMoldeDetails(moldeId: string) {
    try {
        // A. Dados Base do Molde
        const { data: molde, error: errMolde } = await supabase
            .from("moldes")
            .select("id, nome_parte, categoria, rfid")
            .eq("id", moldeId)
            .single();
        if (errMolde) throw errMolde;

        // B. Procurar o SVG associado
        const { data: geometria } = await supabase
            .from("moldes_geometria")
            .select("id, svg_content")
            .eq("molde_id", moldeId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        // C. Procurar/Criar Intervenção Aberta (Master PAA - Plano Acão)
        let { data: intervencao } = await supabase
            .from("moldes_intervencoes")
            .select("id, status")
            .eq("molde_id", moldeId)
            .eq("status", "Aberta")
            .limit(1)
            .single();

        // Se não existir Intervenção aberta, abrimos uma "Mãe" automaticamente para agrupar estes Defeitos de Qualidade
        if (!intervencao) {
            const { data: novaInt, error: errN } = await supabase
                .from("moldes_intervencoes")
                .insert({
                    molde_id: moldeId,
                    reportado_por: "Auditoria TPM Digital",
                    prioridade: "Media",
                    descricao: "Inspeção visual em Gémeo Digital via Tablet",
                    status: "Aberta"
                })
                .select("id, status")
                .single();
            if (errN) throw errN;
            intervencao = novaInt;
        }

        // D. Extrair Pins já marcados nesta Secção O.S.
        let pins: any[] = [];
        if (intervencao) {
            const { data: fpins } = await supabase
                .from("moldes_defeitos_pins")
                .select("id, coord_x, coord_y, tipo_defeito, status, anotacao_reparador")
                .eq("intervencao_id", intervencao.id)
                .eq("status", "Aberto"); // Pins já safos não aparecem no mapa imediato do Operador
            pins = fpins || [];
        }

        return { success: true, molde, geometria, intervencaoAberto: intervencao, pins };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// 2. Regista o Ponto (Clique Relativo X, Y)
export async function saveDefectPin(payload: any) {
    try {
        const { error } = await supabase.from("moldes_defeitos_pins").insert({
            intervencao_id: payload.intervencao_id,
            geometria_id: payload.geometria_id || null, // Previne erro caso não exista SVG ainda
            coord_x: payload.coord_x,
            coord_y: payload.coord_y,
            tipo_defeito: payload.tipo_defeito,
            anotacao_reparador: payload.anotacao_reparador,
            status: "Aberto"
        });

        if (error) throw error;

        revalidatePath(`/admin/manutencao/moldes/auditoria`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

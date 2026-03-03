"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/**
 * Busca todos os operadores alocados a uma estação e verifica se picaram o ponto (ENTRADA) hoje.
 */
export async function getStationOperators(estacaoId: string) {
    if (!estacaoId) return { success: false, data: [] };

    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    try {
        // 1. Fetch Operadores assignados a esta estação
        const { data: operadores, error: opError } = await supabase
            .from("operadores")
            .select("id, nome_operador, tag_rfid_operador")
            .eq("status", "Ativo")
            .eq("posto_base_id", estacaoId);

        if (opError) throw opError;
        if (!operadores || operadores.length === 0) return { success: true, data: [] };

        // 2. Fetch o último log de ponto de cada um para ver se estão ON
        const rfidList = operadores.map(op => op.tag_rfid_operador);

        // Pega todos os logs do dia para estes rfids
        const hojeIso = new Date().toISOString().split("T")[0];
        const { data: logsPonto, error: logError } = await supabase
            .from("log_ponto_diario")
            .select("operador_rfid, tipo_registo, timestamp")
            .in("operador_rfid", rfidList)
            .gte("timestamp", `${hojeIso}T00:00:00Z`)
            .order("timestamp", { ascending: false });

        if (logError) throw logError;

        // Process data
        const operadoresLogados = operadores.map(op => {
            // Find the most recent log for this operator
            const ultimoLog = logsPonto?.find(log => log.operador_rfid === op.tag_rfid_operador);
            const isClockedIn = ultimoLog ? ultimoLog.tipo_registo === "ENTRADA" : false;

            return {
                id: op.id,
                nome: op.nome_operador,
                rfid: op.tag_rfid_operador,
                isClockedIn
            };
        });

        return { success: true, data: operadoresLogados };

    } catch (error: any) {
        console.error("Erro ao buscar operadores da estação:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Busca o Roteiro (Checklist de Tarefas) para a O.P. selecionada na estação atual.
 */
export async function getStationChecklist(opId: string, estacaoId: string) {
    if (!opId || !estacaoId) return { success: false, data: [] };

    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    try {
        // 1. Identificar qual é o modelo deste Barco
        const { data: opData, error: opError } = await supabase
            .from("ordens_producao")
            .select("modelo_id")
            .eq("id", opId)
            .single();

        if (opError) throw opError;
        if (!opData) throw new Error("O.P. não encontrada.");

        // 2. Buscar o Roteiro para este Modelo nesta Estação
        const { data: roteiro, error: roteiroError } = await supabase
            .from("roteiros_producao")
            .select("id, sequencia, tempo_ciclo, descricao_tarefa, imagem_instrucao_url, partes:composicao_modelo (nome_parte)")
            .eq("modelo_id", opData.modelo_id)
            .eq("estacao_id", estacaoId)
            .order("sequencia", { ascending: true });

        if (roteiroError) throw roteiroError;

        return { success: true, data: roteiro || [] };

    } catch (error: any) {
        console.error("Erro ao buscar checklist:", error);
        return { success: false, error: error.message };
    }
}

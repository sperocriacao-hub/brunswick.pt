'use server';

import { createClient } from '@supabase/supabase-js';
import { dispatchNotification } from '../admin/configuracoes/notificacoes/actions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Usamos Service Role Key (se disponível) porque este é um endpoint M2M (Machine to Machine) 
// que atua "em nome" do ESP32 para contornar RLS de utilizadores logados, 
// embora tenhamos política para "anon" no Supabase para o Insert de RFID.
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function buscarEstacoes() {
    try {
        const { data, error } = await supabase
            .from('estacoes')
            .select(`
                id, 
                nome_estacao,
                areas_fabrica (nome_area)
            `)
            .order('nome_estacao', { ascending: true });

        if (error) throw error;

        const formatadas = data.map((e: any) => {
            const areaName = e.areas_fabrica ? e.areas_fabrica.nome_area : 'Fábrica';
            return {
                id: e.id,
                nome_estacao: `${areaName} - ${e.nome_estacao}`
            };
        });

        return { success: true, estacoes: formatadas };
    } catch (err: unknown) {
        console.error("Erro a buscar estações:", err);
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

// (Removed duplicate/legacy Session and Boat listing queries from Operator dashboard.
// These actions are now routed entirely via the Hardware Emulator hitting `/api/mes/iot` REST endpoint.)

export async function dispararAlertaAndon(estacao_id: string, rf_tag_operador: string, rf_tag_barco?: string, tipo_alerta: string = 'Outros', descricao_alerta: string = '') {
    try {
        if (!estacao_id) throw new Error("Terminal/Estação não definida.");

        // 1. Oposto: Procurar qual é a op_id ativa caso o operador tenha fornecido o casco
        let opTargetId = null;
        if (rf_tag_barco) {
            const { data: barco } = await supabase
                .from('ordens_producao')
                .select('id')
                .eq('hin_hull_id', rf_tag_barco)
                .in('status', ['PLANNED', 'IN_PROGRESS', 'PAUSED'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (barco) opTargetId = barco.id;
        }

        // 2. Inserir Alarme na Base de Dados (Para TV Piscar em Realtime)
        const { data: alerta, error } = await supabase
            .from('alertas_andon')
            .insert({
                estacao_id: estacao_id,
                op_id: opTargetId,
                operador_rfid: rf_tag_operador || 'DESCONHECIDO',
                tipo_alerta: tipo_alerta,
                descricao_alerta: descricao_alerta
            })
            .select('id')
            .single();

        if (error) throw error;

        // 3. Notificar as devidas Lideranças e Supervisores logísticos
        const { data: estacaoData } = await supabase.from('estacoes').select('nome_estacao').eq('id', estacao_id).single();
        const strEstacao = estacaoData ? estacaoData.nome_estacao : 'Desconhecida';

        await dispatchNotification('ANDON_TRIGGER', {
            op_numero: rf_tag_barco || 'N/A',
            op_estacao: strEstacao,
            op_tag_operador: rf_tag_operador || 'Anon',
            // Extensões de payload de refinamento
            tipo_alerta: tipo_alerta,
            descricao_alerta: descricao_alerta
        });

        return { success: true, message: "Andon Disparado com Sucesso" };
    } catch (err: any) {
        return { success: false, error: err.message || "Falha a disparar Alerta Fabril" };
    }
}

/**
 * Busca todos os operadores alocados a uma estação e verifica se picaram o ponto (ENTRADA) hoje.
 */
export async function getStationOperators(estacaoId: string) {
    if (!estacaoId) return { success: false, data: [] };

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
            const ultimoLog = logsPonto?.find((log: any) => log.operador_rfid === op.tag_rfid_operador);
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

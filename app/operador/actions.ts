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

/**
 * Busca o estado (Farol Andon) de todas as estações vizinhas (mesma Área)
 */
export async function getAreaAndonStatus(currentEstacaoId: string) {
    if (!currentEstacaoId) return { success: false, data: [] };

    try {
        // 1. Descobrir a Área da Estação Atual
        const { data: currentEst, error: estErr } = await supabase
            .from('estacoes')
            .select('area_id')
            .eq('id', currentEstacaoId)
            .single();

        if (estErr || !currentEst?.area_id) {
            return { success: false, data: [] };
            // Podia ser uma estação sem área definida
        }

        const areaId = currentEst.area_id;

        // 2. Buscar todas as estações dessa Área
        const { data: stationsInArea, error: areaErr } = await supabase
            .from('estacoes')
            .select('id, nome_estacao')
            .eq('area_id', areaId)
            .order('nome_estacao', { ascending: true });

        if (areaErr || !stationsInArea) throw areaErr;

        const estacaoIds = stationsInArea.map(e => e.id);

        // 3. Buscar Alertas Andon Ativos (Não Resolvidos) para estas estações
        let alertasQuery = supabase
            .from('alertas_andon')
            .select('estacao_id, local_ocorrencia_id, tipo_alerta')
            .eq('resolvido', false);

        if (estacaoIds.length > 0) {
            alertasQuery = alertasQuery.or(`estacao_id.in.(${estacaoIds.join(',')}),local_ocorrencia_id.in.(${estacaoIds.join(',')})`);
        }

        const { data: activeAlerts, error: alertErr } = await alertasQuery;

        if (alertErr) throw alertErr;

        // 4. Mapear as estações com o seu estado de Andon
        const areaStatus = stationsInArea.map(station => {
            // Pode haver múltiplos alertas para a mesma estação, pegamos o primeiro por simplicidade de UI
            const andon = activeAlerts?.find(a => (a.local_ocorrencia_id || a.estacao_id) === station.id);
            return {
                id: station.id,
                nome_estacao: station.nome_estacao,
                hasAndon: !!andon,
                andonType: andon ? andon.tipo_alerta : null,
                isCurrent: station.id === currentEstacaoId
            };
        });

        return { success: true, data: areaStatus };

    } catch (err: any) {
        console.error("Erro ao buscar Area Andon Status:", err);
        return { success: false, error: err.message };
    }
}

// (Removed duplicate/legacy Session and Boat listing queries from Operator dashboard.
// These actions are now routed entirely via the Hardware Emulator hitting `/api/mes/iot` REST endpoint.)

export async function dispararAlertaAndon(estacao_id: string, rf_tag_operador: string, rf_tag_barco?: string, tipo_alerta: string = 'Outros', descricao_alerta: string = '', local_ocorrencia_id?: string) {
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
                local_ocorrencia_id: local_ocorrencia_id || estacao_id, // Fallback to causal station if local is missing
                op_id: opTargetId,
                operador_rfid: rf_tag_operador || 'DESCONHECIDO',
                tipo_alerta: tipo_alerta,
                descricao_alerta: descricao_alerta
            })
            .select('id')
            .single();

        if (error) throw error;

        // 3. Notificar as devidas Lideranças e Supervisores logísticos
        const { data: estacaoAlvoData } = await supabase.from('estacoes').select('nome_estacao').eq('id', estacao_id).single();
        const strCausadora = estacaoAlvoData ? estacaoAlvoData.nome_estacao : 'Desconhecida';

        let strLocal = strCausadora;
        const oLocalId = local_ocorrencia_id || estacao_id;
        if (oLocalId !== estacao_id) {
            const { data: estacaoLocalData } = await supabase.from('estacoes').select('nome_estacao').eq('id', oLocalId).single();
            if (estacaoLocalData) strLocal = estacaoLocalData.nome_estacao;
        }

        await dispatchNotification('ANDON_TRIGGER', {
            op_numero: rf_tag_barco || 'N/A',
            op_estacao: strLocal,
            op_estacao_causadora: strCausadora,
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
        // 1. Fetch Operadores assignados a esta estação (Nativos OU Emprestados temporariamente)
        const { data: operadores, error: opError } = await supabase
            .from("operadores")
            .select("id, nome_operador, tag_rfid_operador, posto_base_id, estacao_alocada_temporaria")
            .eq("status", "Ativo")
            .or(`posto_base_id.eq.${estacaoId},estacao_alocada_temporaria.eq.${estacaoId}`);

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
            const isGuest = op.estacao_alocada_temporaria === estacaoId;

            return {
                id: op.id,
                nome: op.nome_operador,
                rfid: op.tag_rfid_operador,
                isClockedIn,
                isGuest
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
        // 1. Identificar modelo e opcionais da OP
        const { data: opData, error: opError } = await supabase
            .from("ordens_producao")
            .select(`
                modelo_id,
                ordens_producao_opcionais ( opcional_id )
            `)
            .eq("id", opId)
            .single();

        if (opError) throw opError;
        if (!opData) throw new Error("O.P. não encontrada.");

        const opcaoIds = (opData.ordens_producao_opcionais || []).map((o: any) => o.opcional_id);

        // 2. Buscar Roteiro Base (Tarefas Gerais)
        const { data: roteiro, error: roteiroError } = await supabase
            .from("roteiros_producao")
            .select("id, sequencia, tempo_ciclo, descricao_tarefa, imagem_instrucao_url, partes:composicao_modelo (nome_parte)")
            .eq("modelo_id", opData.modelo_id)
            .eq("estacao_id", estacaoId);

        if (roteiroError) throw roteiroError;

        // 3. Buscar Tarefas Opcionais (Se existirem opcionais vinculados ao barco)
        let tarefasExtra: any[] = [];
        if (opcaoIds.length > 0) {
            const { data: extras, error: extraError } = await supabase
                .from("tarefas_opcionais")
                .select("id, ordem_tarefa, descricao_tarefa, imagem_instrucao_url, opcionais (nome_opcao)")
                .in("opcao_id", opcaoIds)
                .eq("estacao_destino_id", estacaoId);

            if (extraError) throw extraError;
            tarefasExtra = extras || [];
        }

        // 4. Buscar Estado de Execução (O que já está picado)
        const { data: executadas, error: execError } = await supabase
            .from("tarefas_executadas")
            .select("roteiro_id, tarefa_opcional_id")
            .eq("op_id", opId)
            .eq("estacao_id", estacaoId);

        if (execError) throw execError;

        const feitasIds = new Set((executadas || []).map((e: any) => e.roteiro_id || e.tarefa_opcional_id));

        // 5. Fundir e Formatar
        const listaFormatada = [
            ...(roteiro || []).map((r: any) => ({
                id: r.id, // is roteiro_id
                tipo: 'base',
                sequencia: r.sequencia,
                descricao_tarefa: r.descricao_tarefa || `Operação Standard ${r.sequencia}`,
                tempo_ciclo: r.tempo_ciclo,
                imagem_instrucao_url: r.imagem_instrucao_url,
                nome_origem: 'Base Model',
                is_checked: feitasIds.has(r.id)
            })),
            ...(tarefasExtra).map((e: any) => ({
                id: e.id, // is tarefa_opcional_id
                tipo: 'opcional',
                sequencia: 900 + e.ordem_tarefa, // Force to bottom
                descricao_tarefa: `[EXTRA: ${e.opcionais?.nome_opcao}] ${e.descricao_tarefa}`,
                tempo_ciclo: '--',
                imagem_instrucao_url: e.imagem_instrucao_url,
                nome_origem: e.opcionais?.nome_opcao,
                is_checked: feitasIds.has(e.id)
            }))
        ].sort((a, b) => a.sequencia - b.sequencia);

        return { success: true, data: listaFormatada };

    } catch (error: any) {
        console.error("Erro ao buscar checklist integrada:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Picagem Manual de Tarefa pelo Operador
 */
export async function toggleTarefaExecution(opId: string, estacaoId: string, id: string, tipo: 'base' | 'opcional', isCurrentlyChecked: boolean, rfidOperador: string) {
    try {
        if (!opId || !estacaoId || !id || !rfidOperador) throw new Error("Parâmetros em falta.");

        if (isCurrentlyChecked) {
            // Remove the check
            let query = supabase.from("tarefas_executadas").delete().eq("op_id", opId).eq("estacao_id", estacaoId);
            if (tipo === 'base') query = query.eq("roteiro_id", id);
            else query = query.eq("tarefa_opcional_id", id);

            const { error } = await query;
            if (error) throw error;
        } else {
            // Add the check
            const payload: any = {
                op_id: opId,
                estacao_id: estacaoId,
                operador_rfid: rfidOperador
            };
            if (tipo === 'base') payload.roteiro_id = id;
            else payload.tarefa_opcional_id = id;

            const { error } = await supabase.from("tarefas_executadas").insert([payload]);
            if (error) throw error;
        }

        return { success: true };
    } catch (error: any) {
        console.error("Erro ao fazer toggle de tarefa:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Busca a Fila de Produção (Próximos 5 Barcos na Linha Puxada) para uma dada estação.
 * Só contabiliza as OPs que ainda não foram marcadas como FECHADAS nesta estação.
 */
export async function getUpcomingQueue(estacaoId: string) {
    if (!estacaoId) return { success: false, data: [] };

    try {
        const { data: pendentes, error: errPend } = await supabase
            .from('ordens_producao')
            .select('id, op_numero, status, modelos!inner(nome_modelo), clientes!left(nome)')
            .in('status', ['PLANNED', 'IN_PROGRESS'])
            .order('data_prevista_inicio', { ascending: true, nullsFirst: false });

        if (errPend) throw errPend;
        if (!pendentes || pendentes.length === 0) return { success: true, data: [] };

        const opIds = pendentes.map((p: any) => p.id);
        const { data: concluidas } = await supabase
            .from('log_estacao_conclusao')
            .select('op_id')
            .eq('estacao_id', estacaoId)
            .in('op_id', opIds);

        const concluidasIds = new Set((concluidas || []).map((c: any) => c.op_id));
        const proximasOPs = pendentes.filter((p: any) => !concluidasIds.has(p.id)).slice(0, 5); // Limit for UI

        const formatadas = proximasOPs.map((p: any) => ({
            id: p.id,
            numero: p.op_numero,
            status: p.status,
            modelo: p.modelos?.nome_modelo || 'N/A',
            cliente: p.clientes?.nome || 'Stock Factory'
        }));

        return { success: true, data: formatadas };

    } catch (error: any) {
        console.error("Erro ao buscar Fila de Produção:", error);
        return { success: false, error: error.message };
    }
}


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
            .select('id, nome_estacao')
            .order('nome_estacao', { ascending: true });

        if (error) throw error;
        return { success: true, estacoes: data };
    } catch (err: unknown) {
        console.error("Erro a buscar estações:", err);
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

export async function iniciarSessaoTrabalho(operadorRfid: string, barcoRfid: string, estacaoId: string) {
    try {
        if (!operadorRfid || !barcoRfid || !estacaoId) {
            throw new Error("Dados RFID em falta.");
        }

        // 1. Validar se o barcoRfid corresponde a uma Ordem de Produção Ativa (hin_hull_id)
        const { data: opData, error: opError } = await supabase
            .from('ordens_producao')
            .select('id, status, op_numero')
            .eq('hin_hull_id', barcoRfid)
            .in('status', ['PLANNED', 'IN_PROGRESS', 'PAUSED'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (opError || !opData) {
            console.error("OP Lookup Error:", opError);
            throw new Error(`Tag do Barco não reconhecida: Nenhuma Ordem de Produção ativa encontrada para RFID ${barcoRfid}.`);
        }

        // 2. Inserir Registo (O Trigger SQL block_inativados_iot_insert vai validar o Operador)
        const { data: insertData, error: insertError } = await supabase
            .from('registos_rfid_realtime')
            .insert({
                op_id: opData.id,
                estacao_id: estacaoId,
                operador_rfid: operadorRfid,
                barco_rfid: barcoRfid
            })
            .select('id')
            .single();

        if (insertError) {
            console.error("Insert RFID Error:", insertError);
            // Mensagem do Raise Exception do Trigger costuma vir no campo message/details
            throw new Error(insertError.message || "Erro na inserção de leitura RFID.");
        }

        // 3. Atualizar OP para IN_PROGRESS se estava PLANNED ou PAUSED
        if (opData.status !== 'IN_PROGRESS') {
            await supabase
                .from('ordens_producao')
                .update({ status: 'IN_PROGRESS', data_inicio: new Date().toISOString() })
                .eq('id', opData.id);
        }

        return {
            success: true,
            registoId: insertData.id,
            opNumero: opData.op_numero
        };

    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

export async function terminarSessaoTrabalho(registoId: string) {
    try {
        if (!registoId) throw new Error("ID de Registo em falta.");

        const { data, error } = await supabase
            .from('registos_rfid_realtime')
            .update({ timestamp_fim: new Date().toISOString() })
            .eq('id', registoId)
            .select(`
                estacao_id,
                ordens_producao(op_numero)
            `)
            .single();

        if (error) {
            console.error("Update RFID Error:", error);
            throw error;
        }

        // 2. Disparar Automacao/Server Action de Alerta (Ex: Fim de Linha)
        if (data && data.ordens_producao) {
            // TypeScript safely checks
            const opRelation = data.ordens_producao as unknown as { op_numero: string };
            const opNumber = opRelation?.op_numero || 'OP-DESC';

            // Enviamos payload utilitario para que os utilizadores possam usar tags {{op_numero}} no modal.
            await dispatchNotification('OP_COMPLETED', {
                op_numero: opNumber,
                estacao_id: data.estacao_id || 'N/A'
            });
        }

        return { success: true };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

// ------------------------------------------------------------------------------------------------
// [FASE 21] NOVA LÓGICA DE TABLET TOUCH
// ------------------------------------------------------------------------------------------------

export async function buscarBarcosNaEstacao(estacaoId: string) {
    try {
        if (!estacaoId) throw new Error("ID da Estação em falta.");

        // 1. OPs em curso globalmente
        const { data: pendentes, error: errPend } = await supabase
            .from('ordens_producao')
            .select('id, op_numero, hin_hull_id, modelos!inner(nome_modelo)')
            .in('status', ['IN_PROGRESS', 'Em Produção', 'PLANNED'])
            .order('data_prevista_inicio', { ascending: true, nullsFirst: false });

        if (errPend) throw errPend;
        if (!pendentes || pendentes.length === 0) return { success: true, barcos: [] };

        // 2. Filtrar as que já avançaram DESTA estação (i.e. MACRO-OEE já fechou)
        const opIds = pendentes.map(p => p.id);
        const { data: concluidas } = await supabase
            .from('log_estacao_conclusao')
            .select('op_id')
            .eq('estacao_id', estacaoId)
            .in('op_id', opIds);

        const concluidasIds = new Set((concluidas || []).map(c => c.op_id));

        // 3. Devolver formato limpo
        const barcosParaEstacao = pendentes
            .filter(p => !concluidasIds.has(p.id))
            .map(p => ({
                id: p.id,
                op_numero: p.op_numero,
                modelo: (p.modelos as any)?.nome_modelo || 'Desconhecido',
                hin: p.hin_hull_id || 'S/ Tag'
            }));

        return { success: true, barcos: barcosParaEstacao };
    } catch (err: unknown) {
        console.error("Erro buscarBarcosNaEstacao:", err);
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido", barcos: [] };
    }
}

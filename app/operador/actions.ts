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

export async function dispararAlertaAndon(estacao_id: string, rf_tag_operador: string, rf_tag_barco?: string) {
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
                operador_rfid: rf_tag_operador || 'DESCONHECIDO'
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
            op_tag_operador: rf_tag_operador || 'Anon'
        });

        return { success: true, message: "Andon Disparado com Sucesso" };
    } catch (err: any) {
        return { success: false, error: err.message || "Falha a disparar Alerta Fabril" };
    }
}

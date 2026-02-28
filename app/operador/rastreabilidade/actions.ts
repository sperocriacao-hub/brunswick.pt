'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function buscarDetalhesBarcoPorHin(hin: string) {
    try {
        if (!hin) throw new Error("Chave RFID (HIN) em falta.");

        const { data, error } = await supabase
            .from('ordens_producao')
            .select(`
                id, 
                op_numero, 
                status,
                modelos ( nome_modelo )
            `)
            .eq('hin_hull_id', hin)
            ...in ('status', ['PLANNED', 'IN_PROGRESS', 'PAUSED'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return { success: false, error: "Nenhuma OP Ativa encontrada para esta Embarcação." };
        }

        return {
            success: true,
            barco: {
                id: data.id,
                numero: data.op_numero,
                modelo: (data.modelos as any)?.nome_modelo || 'Desconhecido'
            }
        };

    } catch (err: any) {
        return { success: false, error: err.message || "Erro de ligação à DB." };
    }
}

export async function registarPecaRastreabilidade(dados: {
    op_id: string,
    estacao_id: string,
    operador_rfid: string,
    nome_peca: string,
    numero_serie_lote: string,
    fornecedor?: string
}) {
    try {
        if (!dados.op_id || !dados.estacao_id || !dados.operador_rfid || !dados.nome_peca || !dados.numero_serie_lote) {
            throw new Error("Preencha todos os campos obrigatórios.");
        }

        const { data, error } = await supabase
            .from('rastreabilidade_pecas')
            .insert({
                op_id: dados.op_id,
                estacao_id: dados.estacao_id,
                operador_rfid: dados.operador_rfid,
                nome_peca: dados.nome_peca,
                numero_serie_lote: dados.numero_serie_lote,
                fornecedor: dados.fornecedor || null
            })
            .select('id')
            .single();

        if (error) throw error;

        return { success: true, registo_id: data.id };
    } catch (err: any) {
        return { success: false, error: err.message || "Erro ao gravar o lote na peça." };
    }
}

export async function buscarPecasRegistadasNaOp(op_id: string) {
    try {
        const { data, error } = await supabase
            .from('rastreabilidade_pecas')
            .select('id, nome_peca, numero_serie_lote, fornecedor, created_at')
            .eq('op_id', op_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, pecas: data || [] };
    } catch (err: any) {
        return { success: false, error: err.message || "Erro ao ler a memória de peças desta OP." };
    }
}

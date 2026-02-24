'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export interface OrdemPlaneamento {
    id: string;
    op_numero: string;
    modelo: string;
    hin_hull_id: string | null;
    semana_planeada: string | null; // e.g. "BACKLOG", "DAY_1", "DAY_2", ... "DAY_5"
    ordem_sequencial_linha: number;
    data_prevista_inicio: string | null;
    linha: string | null;
}

// 1. Fetching
export async function buscarOrdensPlaneamento(): Promise<{ success: boolean; data?: OrdemPlaneamento[]; error?: string }> {
    try {
        const cookieStore = cookies() as any;
        const supabase = createClient(cookieStore);

        // Ler Ordens de Produção Ativas ou Planeadas
        const { data, error } = await supabase
            .from('ordens_producao')
            .select(`
                id, op_numero, hin_hull_id, semana_planeada, ordem_sequencial_linha, data_prevista_inicio,
                modelos ( nome_modelo ),
                linhas_producao ( letra_linha )
            `)
            .in('status', ['PLANNED', 'IN_PROGRESS'])
            .order('ordem_sequencial_linha', { ascending: true });

        if (error) throw error;

        type OpRow = {
            id: string;
            op_numero: string;
            hin_hull_id: string | null;
            semana_planeada: string | null;
            ordem_sequencial_linha: number;
            data_prevista_inicio: string | null;
            modelos: { nome_modelo: string } | null;
            linhas_producao: { letra_linha: string } | null;
        };

        const mapeadas: OrdemPlaneamento[] = (data as unknown as OpRow[]).map(op => ({
            id: op.id,
            op_numero: op.op_numero,
            modelo: op.modelos?.nome_modelo || 'Desconhecido',
            hin_hull_id: op.hin_hull_id,
            semana_planeada: op.semana_planeada || 'BACKLOG',
            ordem_sequencial_linha: op.ordem_sequencial_linha || 0,
            data_prevista_inicio: op.data_prevista_inicio,
            linha: op.linhas_producao?.letra_linha || 'N/A'
        }));

        return { success: true, data: mapeadas };
    } catch (err: unknown) {
        let msg = "Erro desconhecido.";
        if (err instanceof Error) msg = err.message;
        else if (typeof err === 'object' && err !== null) msg = JSON.stringify(err);
        return { success: false, error: msg };
    }
}

// 2. Drag & Drop Save
export async function atualizarPlaneamentoMultiplo(updates: { id: string, semana_planeada: string, ordem_sequencial_linha: number }[]): Promise<{ success: boolean; error?: string }> {
    try {
        const cookieStore = cookies() as any;
        const supabase = createClient(cookieStore);

        // O Supabase suporta um upsert ou requisições iterativas. 
        // Para garantir precisão, iteramos as atualizações.
        for (const up of updates) {
            const { error } = await supabase
                .from('ordens_producao')
                .update({
                    semana_planeada: up.semana_planeada,
                    ordem_sequencial_linha: up.ordem_sequencial_linha
                })
                .eq('id', up.id);

            if (error) throw error;
        }

        return { success: true };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Falha ao guardar a disposição do quadro.' };
    }
}

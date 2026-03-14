'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export interface FiltrosEficiencia {
    dataInicio: string;
    dataFim: string;
    areaId?: string;
    linhaId?: string;
    estacaoId?: string;
}

export interface ResultadoEficiencia {
    horas_ganhas: number;
    horas_trabalhadas: number;
    eficiencia_percentual: number;
    barcos_processados: number;
}

export async function getEficienciaDados(filtros: FiltrosEficiencia): Promise<{ success: boolean; data?: ResultadoEficiencia; error?: string }> {
    try {
        const cookieStore = cookies() as any;
        const supabase = createClient(cookieStore);

        // Chamada à RPC criada na migração 0064
        const queryParams = {
            p_data_inicio: filtros.dataInicio,
            p_data_fim: filtros.dataFim,
            p_area_id: filtros.areaId || null,
            p_linha_id: filtros.linhaId || null,
            p_estacao_id: filtros.estacaoId || null
        };

        const { data, error } = await supabase.rpc('get_eficiencia_hh', queryParams);

        if (error) {
            console.error('Supabase RPC Error:', error);
            throw new Error(error.message);
        }

        // RPC returns a single row or empty array
        const resultRow = data && data.length > 0 ? data[0] : {
            horas_ganhas: 0,
            horas_trabalhadas: 0,
            eficiencia_percentual: 0,
            barcos_processados: 0
        };

        return {
            success: true,
            data: {
                horas_ganhas: Number(resultRow.horas_ganhas) || 0,
                horas_trabalhadas: Number(resultRow.horas_trabalhadas) || 0,
                eficiencia_percentual: Number(resultRow.eficiencia_percentual) || 0,
                barcos_processados: Number(resultRow.barcos_processados) || 0
            }
        };

    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function fetchDropdownOptions() {
    try {
        const cookieStore = cookies() as any;
        const supabase = createClient(cookieStore);

        const [areas, linhas, estacoes] = await Promise.all([
            supabase.from('areas_fabrica').select('id, nome_area').order('ordem_sequencial'),
            supabase.from('linhas_producao').select('id, letra_linha').order('letra_linha'),
            supabase.from('estacoes').select('id, nome_estacao').order('nome_estacao') // Added 'nome_estacao' assuming it exists
        ]);

        return {
            success: true,
            areas: areas.data || [],
            linhas: linhas.data || [],
            estacoes: estacoes.data || []
        };
    } catch (err) {
        return { success: false, areas: [], linhas: [], estacoes: [] };
    }
}

'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function procurarGenealogiaLote(lote_query: string) {
    try {
        if (!lote_query || lote_query.length < 3) {
            return { success: false, error: "Digite pelo menos 3 caracteres do Número de Série/Lote." };
        }

        // Search the DB ignoring case via ilike
        const { data, error } = await supabase
            .from('rastreabilidade_pecas')
            .select(`
                id,
                nome_peca,
                numero_serie_lote,
                fornecedor,
                created_at,
                operador_rfid,
                ordens_producao ( id, op_numero, hin_hull_id, semana_planeada ),
                estacoes ( id, nome_estacao )
            `)
            .ilike('numero_serie_lote', `%${lote_query}%`)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        // Formatar Datagrid
        const rows = data.map((d: any) => ({
            id: d.id,
            nome_peca: d.nome_peca,
            numero_serie_lote: d.numero_serie_lote,
            fornecedor: d.fornecedor || 'N/A',
            data_instalacao: d.created_at,
            operador: d.operador_rfid,
            barco_hin: d.ordens_producao?.hin_hull_id || 'S/N',
            barco_op: d.ordens_producao?.op_numero || 'S/N',
            semana_producao: d.ordens_producao?.semana_planeada,
            estacao_instalacao: d.estacoes?.nome_estacao || 'Desconhecida'
        }));

        return { success: true, resultados: rows };

    } catch (err: any) {
        return { success: false, error: err.message || "Erro na pesquisa de Genealogia." };
    }
}

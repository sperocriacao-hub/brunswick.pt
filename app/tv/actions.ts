'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// A TV Cast tem Acessos Super Admin ao nivel da base de dados porque corre como Node Edge
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function buscarDashboardsTV(linha_id: string) {
    try {
        // 1. Validar a Linha (Saber se é Traz, Frente, etc.)
        const { data: linhaData, error: lErr } = await supabase
            .from('linhas_producao')
            .select('*')
            .eq('id', linha_id)
            .single();

        if (lErr || !linhaData) {
            return { success: false, error: "Linha Indisponível." };
        }

        // 2. Buscar Barcos (OPs) In_Progress ou Planned mapeadas a esta linha
        const { data: barcos, error: bErr } = await supabase
            .from('ordens_producao')
            .select(`
                id, op_numero, hin_hull_id, status, semana_planeada,
                modelos ( nome_modelo )
            `)
            .eq('linha_id', linha_id)
            .in('status', ['PLANNED', 'IN_PROGRESS', 'PAUSED'])
            .order('semana_planeada', { ascending: true })
            .limit(4);

        if (bErr) throw bErr;

        // 3. Verificar de todas as Estações dessa linha, se existe algum ALERTA ANDON a disparar
        // Para isso, precisamos mapear as estações ativas com os alertas não resolvidos
        const { data: alertas, error: aErr } = await supabase
            .from('alertas_andon')
            .select(`
                id, situacao, estacao_id, created_at, operador_rfid, op_id,
                estacoes:estacao_id ( nome_estacao, linha_id )
            `)
            .eq('resolvido', false)
        // Filter inline is tricky via relations, so we fetch all unresolved alerts 
        // and filter locally to make sure they belong to this TV's Line.

        if (aErr) throw aErr;

        // Filtrar Alertas ativos que pertencem à mesma Linha que estamos a monitorizar
        const alertasDaLinha = alertas?.filter((al: any) => al.estacoes?.linha_id === linha_id) || [];

        return {
            success: true,
            linha: linhaData,
            barcos: barcos || [],
            alertasGlobais: alertasDaLinha
        };
    } catch (err: any) {
        return { success: false, error: err.message || "Erro Técnico TV." };
    }
}

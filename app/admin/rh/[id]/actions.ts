'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function buscarPerfilCompetencia(funcionarioId: string) {
    try {
        // 1. Dados Pessoais do Operador
        const { data: opData, error: opError } = await supabase
            .from('operadores')
            .select('*')
            .eq('id', funcionarioId)
            .single();

        if (opError) throw opError;

        // 2. Gráfico "Aranha" (Radar Chart - Média Vitalícia dos 7 Eixos)
        // Optimização: podíamos guardar as 7 médias cached, mas como os selects são muito rápidos
        // na cloud supabase, vamos fazer AVG() on-the-fly para o Radar gerar shapes ao vivo.
        const { data: radarPings } = await supabase
            .from('avaliacoes_diarias')
            .select('nota_hst, nota_epi, nota_5s, nota_qualidade, nota_eficiencia, nota_objetivos, nota_atitude')
            .eq('funcionario_id', funcionarioId);

        const radarAverages = [
            { subject: 'HST (Segurança)', A: 0, fullMark: 4.0 },
            { subject: 'EPIs', A: 0, fullMark: 4.0 },
            { subject: '5S (Limpeza)', A: 0, fullMark: 4.0 },
            { subject: 'Qualidade', A: 0, fullMark: 4.0 },
            { subject: 'Eficiência', A: 0, fullMark: 4.0 },
            { subject: 'Objetivos', A: 0, fullMark: 4.0 },
            { subject: 'Atitude', A: 0, fullMark: 4.0 }
        ];

        let evolucaoTimeline: { Data: string, Média: number }[] = [];

        if (radarPings && radarPings.length > 0) {
            const sums = [0, 0, 0, 0, 0, 0, 0];
            radarPings.forEach(p => {
                sums[0] += Number(p.nota_hst); sums[1] += Number(p.nota_epi); sums[2] += Number(p.nota_5s);
                sums[3] += Number(p.nota_qualidade); sums[4] += Number(p.nota_eficiencia);
                sums[5] += Number(p.nota_objetivos); sums[6] += Number(p.nota_atitude);
            });
            const qty = radarPings.length;
            radarAverages[0].A = Number((sums[0] / qty).toFixed(1));
            radarAverages[1].A = Number((sums[1] / qty).toFixed(1));
            radarAverages[2].A = Number((sums[2] / qty).toFixed(1));
            radarAverages[3].A = Number((sums[3] / qty).toFixed(1));
            radarAverages[4].A = Number((sums[4] / qty).toFixed(1));
            radarAverages[5].A = Number((sums[5] / qty).toFixed(1));
            radarAverages[6].A = Number((sums[6] / qty).toFixed(1));
        }

        // 3. Evolução Diária (Últimas 30 Avaliações de Média Unificada)
        const { data: evData } = await supabase
            .from('avaliacoes_diarias')
            .select('data_avaliacao, nota_hst, nota_epi, nota_5s, nota_qualidade, nota_eficiencia, nota_objetivos, nota_atitude')
            .eq('funcionario_id', funcionarioId)
            .order('data_avaliacao', { ascending: true })
            .limit(30);

        if (evData && evData.length > 0) {
            evolucaoTimeline = evData.map(ev => {
                const mDia = (Number(ev.nota_hst) + Number(ev.nota_epi) + Number(ev.nota_5s) + Number(ev.nota_qualidade) + Number(ev.nota_eficiencia) + Number(ev.nota_objetivos) + Number(ev.nota_atitude)) / 7;
                return {
                    Data: new Date(ev.data_avaliacao).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
                    Média: Number(mDia.toFixed(1))
                };
            });
        }

        // 4. Trail de Audit - Apontamentos Negativos (Historial Punitivo/Formativo)
        const { data: apsData } = await supabase
            .from('apontamentos_negativos')
            .select('data_apontamento, topico_falhado, nota_atribuida, justificacao, supervisor_nome')
            .eq('funcionario_id', funcionarioId)
            .order('data_apontamento', { ascending: false });

        return {
            success: true,
            operador: opData,
            radarMatriz: radarAverages,
            historicoEvolutivo: evolucaoTimeline,
            apontamentos: apsData || []
        };

    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Falhou consulta do Perfil." };
    }
}

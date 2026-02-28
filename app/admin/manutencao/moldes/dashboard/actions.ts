'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getMoldesKPIData() {
    try {
        // 1. Distribuição de Tipos de Defeito (Global)
        const { data: pins, error: pErr } = await supabase
            .from('moldes_defeitos_pins')
            .select('tipo_defeito, id');

        if (pErr) throw pErr;

        const defectCounts = (pins || []).reduce((acc: any, pin: any) => {
            acc[pin.tipo_defeito] = (acc[pin.tipo_defeito] || 0) + 1;
            return acc;
        }, {});

        const defectDistribution = Object.keys(defectCounts).map(key => ({
            name: key,
            value: defectCounts[key]
        }));

        // 2. Ranking de Moldes Problemáticos (Top 5 com Mais Intervenções)
        const { data: intervencoes, error: iErr } = await supabase
            .from('moldes_intervencoes')
            .select('molde_id, status, data_abertura, moldes(nome_parte)');

        if (iErr) throw iErr;

        const moldesCounts = (intervencoes || []).reduce((acc: any, intv: any) => {
            const mName = intv.moldes?.nome_parte || 'Desconhecido';
            acc[mName] = (acc[mName] || 0) + 1;
            return acc;
        }, {});

        const problemMolds = Object.keys(moldesCounts)
            .map(mName => ({ name: mName, interventions: moldesCounts[mName] }))
            .sort((a, b) => b.interventions - a.interventions)
            .slice(0, 5);

        // 3. Status Global de Intervenções (Abertas vs Fechadas)
        let openCount = 0;
        let closedCount = 0;
        (intervencoes || []).forEach(i => {
            if (i.status === 'Encerrada' || i.status === 'Validada') closedCount++;
            else openCount++;
        });

        return {
            success: true,
            data: {
                defectDistribution,
                problemMolds,
                globalStatus: {
                    abertas: openCount,
                    fechadas: closedCount,
                    total: openCount + closedCount
                }
            }
        };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

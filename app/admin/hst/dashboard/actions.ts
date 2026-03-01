'use server';

import { createClient } from '@supabase/supabase-js';
import { format, startOfMonth, endOfMonth, endOfDay } from 'date-fns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface SafetyDayInfo {
    day: number;
    date: string;
    level: number; // 0=Green, 1=Yellow, 2=Orange, 3=Red, 4=Future (Gray)
    tooltip: string;
    ocorrenciasStr?: string;
}

const severityLevels: Record<string, number> = {
    'Acidente com Baixa': 3,
    'Acidente sem Baixa': 2,
    'Doenca Profissional': 2,
    'Incidente/Quase-Acidente': 1,
};

export async function getSafetyCross(year: number, month: number) {
    try {
        const startDate = startOfMonth(new Date(year, month - 1)); // Date-fns is 0-indexed for months
        const endDate = endOfMonth(new Date(year, month - 1));

        // Ensure accurate filtering capturing the full last day
        const endFilterDate = endOfDay(endDate);

        const { data: ocorrencias, error } = await supabase
            .from('hst_ocorrencias')
            .select(`
                id,
                data_hora_ocorrencia,
                tipo_ocorrencia,
                descricao,
                gravidade
            `)
            .gte('data_hora_ocorrencia', startDate.toISOString())
            .lte('data_hora_ocorrencia', endFilterDate.toISOString())
            .order('data_hora_ocorrencia', { ascending: true });

        if (error) throw error;

        // Populate days
        const daysInMonth = endDate.getDate();
        const crossData: Record<number, SafetyDayInfo> = {};

        const today = new Date();
        const currentDay = today.getDate();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === (month - 1);
        const isPastMonth = today.getFullYear() > year || (today.getFullYear() === year && today.getMonth() > (month - 1));

        for (let i = 1; i <= daysInMonth; i++) {
            let level = 0; // default green

            // If future day in current month, it's gray
            if (isCurrentMonth && i > currentDay) {
                level = 4;
            } else if (!isCurrentMonth && !isPastMonth) {
                // Future month
                level = 4;
            }

            crossData[i] = {
                day: i,
                date: format(new Date(year, month - 1, i), 'yyyy-MM-dd'),
                level: level,
                tooltip: level === 4 ? 'Futuro' : 'Sem incidentes registados',
                ocorrenciasStr: ''
            };
        }

        // Aggregate incidents into days
        if (ocorrencias) {
            ocorrencias.forEach(o => {
                const oDate = new Date(o.data_hora_ocorrencia);
                const day = oDate.getDate();

                // If the day is valid in the month
                if (crossData[day]) {
                    const sev = severityLevels[o.tipo_ocorrencia] || 1;
                    if (sev > crossData[day].level && crossData[day].level !== 4) {
                        crossData[day].level = sev;
                        // update tooltip indicating the worst severity
                        crossData[day].tooltip = o.tipo_ocorrencia;
                    }

                    // Append detail
                    crossData[day].ocorrenciasStr += `\n- [${format(oDate, 'HH:mm')}] ${o.tipo_ocorrencia} (${o.gravidade}): ${o.descricao}`;
                }
            });
        }

        // Calculate global KPIs for the year
        const startOfYearDate = new Date(year, 0, 1);
        const endOfYearDate = endOfDay(new Date(year, 11, 31));

        const { count: countAnual, error: bErr } = await supabase
            .from('hst_ocorrencias')
            .select('*', { count: 'exact', head: true })
            .gte('data_hora_ocorrencia', startOfYearDate.toISOString())
            .lte('data_hora_ocorrencia', endOfYearDate.toISOString());

        return { success: true, data: Object.values(crossData), kpiAnual: countAnual || 0 };
    } catch (e: any) {
        console.error("Error fetching Safety Cross:", e);
        return { success: false, error: e.message };
    }
}

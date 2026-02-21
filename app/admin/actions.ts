'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function fetchDashboardData() {
    try {
        // 1. OPs Em Produção
        const { count: countEmProducao } = await supabase
            .from('ordens_producao')
            .select('*', { count: 'exact', head: true })
            .in('status', ['IN_PROGRESS', 'Em Produção']);

        // 2. Extrair todas OPs (Em Produção & Completas) para Cálculo de OEE e Desvio
        const { data: ordens, error: errorOrdens } = await supabase
            .from('ordens_producao')
            .select(`
                id, 
                op_numero, 
                status, 
                cliente,
                modelos (
                    id, 
                    nome_modelo, 
                    roteiros_producao (
                        tempo_ciclo
                    )
                ),
                registos_rfid_realtime (
                    timestamp_inicio, 
                    timestamp_fim
                )
            `)
            .in('status', ['IN_PROGRESS', 'Em Produção', 'COMPLETED', 'Concluída'])
            .order('created_at', { ascending: false });

        if (errorOrdens) throw errorOrdens;

        let totalLeiturasMes = 0;
        let barcosAtrasados = 0;
        let horasReaisGerais = 0;
        let horasPlaneadasGerais = 0;

        const tableCustos = []; // Para a Grelha Financeira

        for (const op of (ordens || [])) {
            // Tempo Planeado (Teórico SLA)
            let tempoPlaneadoHoras = 0;
            const roteiros = (op.modelos as unknown as { roteiros_producao?: { tempo_ciclo?: number | string }[] })?.roteiros_producao || [];
            roteiros.forEach((r) => {
                tempoPlaneadoHoras += Number(r.tempo_ciclo || 0);
            });
            horasPlaneadasGerais += tempoPlaneadoHoras;

            // Tempo Executado (Real IoT)
            let tempoRealHoras = 0;
            const leituras = (op.registos_rfid_realtime as unknown[]) || [];
            totalLeiturasMes += leituras.length;

            leituras.forEach((reg: unknown) => {
                const reading = reg as { timestamp_inicio: string, timestamp_fim: string | null };
                const start = new Date(reading.timestamp_inicio);
                const end = reading.timestamp_fim ? new Date(reading.timestamp_fim) : new Date(); // se ativo, conta até agora

                const diffMs = end.getTime() - start.getTime();
                const diffHoras = diffMs / (1000 * 60 * 60);
                if (diffHoras > 0) tempoRealHoras += diffHoras;
            });
            horasReaisGerais += tempoRealHoras;

            const margem = tempoPlaneadoHoras - tempoRealHoras; // Positivo = Lucro (mais rápido), Negativo = Prejuízo (mais lento)
            if (margem < 0 && (op.status === 'IN_PROGRESS' || op.status === 'Em Produção' || op.status === 'COMPLETED')) {
                barcosAtrasados++;
            }

            // Alimentar tabela se tiver registos
            if (tempoPlaneadoHoras > 0 || tempoRealHoras > 0) {
                tableCustos.push({
                    op_id: op.id,
                    numero: op.op_numero,
                    modelo: String((op.modelos as unknown as { nome_modelo?: string })?.nome_modelo || 'N/A'),
                    status: op.status,
                    horasPlaneadas: tempoPlaneadoHoras.toFixed(1),
                    horasReais: tempoRealHoras.toFixed(1),
                    desvio: margem.toFixed(1),
                    oeePerc: tempoRealHoras > 0 ? ((tempoPlaneadoHoras / tempoRealHoras) * 100).toFixed(1) : (tempoPlaneadoHoras > 0 ? '0.0' : '100.0')
                });
            }
        }

        // 3. Estação Gargalo (Onde os IoT Pings ficam congelados is('timestamp_fim', null))
        const { data: wips } = await supabase
            .from('registos_rfid_realtime')
            .select('estacao_id, estacoes(nome_estacao)')
            .is('timestamp_fim', null);

        let nomeGargalo = 'Apurando...';
        const contadorGargalos: Record<string, number> = {};

        if (wips && wips.length > 0) {
            wips.forEach((w: unknown) => {
                const wipObj = w as { estacoes: { nome_estacao: string } | null };
                const nomeStr = wipObj.estacoes ? wipObj.estacoes.nome_estacao : 'Desconhecida';
                contadorGargalos[nomeStr] = (contadorGargalos[nomeStr] || 0) + 1;
            });
            const maxRetidos = Math.max(...Object.values(contadorGargalos));
            nomeGargalo = Object.keys(contadorGargalos).find(k => contadorGargalos[k] === maxRetidos) || 'N/A';
        } else {
            nomeGargalo = "Nenhum Enxame Ativo";
        }

        // 4. TOP 3 Pódio de Talentos RH (Matriz)
        const { data: topTalentosData } = await supabase
            .from('operadores')
            .select('id, nome_operador, matriz_talento_media')
            .eq('status', 'Ativo')
            .not('matriz_talento_media', 'is', null)
            .order('matriz_talento_media', { ascending: false })
            .limit(3);

        const topTalentos = topTalentosData || [];

        // Gráfico OEE Global Mensal (Mock dinâmico por enquanto, na vida real seria agg por Mês de created_at)
        const globalOEE = horasReaisGerais > 0 ? Math.min(100, Math.round((horasPlaneadasGerais / horasReaisGerais) * 100)) : 100;

        return {
            success: true,
            stats: {
                barcosEmProducao: countEmProducao || 0,
                barcosAtrasados,
                estacaoGargalo: nomeGargalo,
                totalLeiturasMes,
                oeeGlobal: globalOEE
            },
            financas: tableCustos,
            topTalentos
        };
    } catch (err: unknown) {
        console.error("Dashboard Fetch Error:", err);
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

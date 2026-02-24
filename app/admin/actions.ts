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

        // 2. Extrair OPs recentes (Em Produção & Completas nos últimos 45 dias) para Cálculo de OEE e Desvio
        // OTIMIZAÇÃO: Limitar historico para não estrangular o Array JS em memória (Bottleneck resolvido Fase 18)
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 45); // Janela de 45 dias

        const { data: ordens, error: errorOrdens } = await supabase
            .from('ordens_producao')
            .select(`
                id, 
                op_numero, 
                status, 
                cliente,
                created_at,
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
            .gte('created_at', dateLimit.toISOString()) // LIMITAÇÃO TEMPORAL
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

        // 4. TOP 3 Pódio de Talentos RH (Matriz Dinâmica a partir de avaliacoes_diarias)
        const { data: avaliacoes } = await supabase
            .from('avaliacoes_diarias')
            .select('operador_id, avaliacao, data_avaliacao');

        const { data: operadoresBase } = await supabase
            .from('operadores')
            .select('id, nome_operador')
            .eq('status', 'Ativo');

        let topTalentos: any[] = [];
        if (avaliacoes && avaliacoes.length > 0 && operadoresBase) {
            const mapStats: Record<string, { soma: number, count: number }> = {};
            avaliacoes.forEach((av: any) => {
                const oid = av.operador_id;
                if (!mapStats[oid]) mapStats[oid] = { soma: 0, count: 0 };
                // Converter string ex: '3' para Number
                const nf = parseFloat(av.avaliacao);
                if (!isNaN(nf)) {
                    mapStats[oid].soma += nf;
                    mapStats[oid].count += 1;
                }
            });

            const pontuados = operadoresBase.map(op => {
                const st = mapStats[op.id];
                const mediaA = st && st.count > 0 ? st.soma / st.count : 0;
                return {
                    id: op.id,
                    nome_operador: op.nome_operador,
                    matriz_talento_media: mediaA
                };
            }).filter(op => op.matriz_talento_media > 0);

            topTalentos = pontuados.sort((a, b) => b.matriz_talento_media - a.matriz_talento_media).slice(0, 3);
        } else {
            // Fallback para a coluna legacy da bd caso nao haja avaliacoes preenchidas e haja matriz estática
            const { data: topTalentosData } = await supabase
                .from('operadores')
                .select('id, nome_operador, matriz_talento_media')
                .eq('status', 'Ativo')
                .not('matriz_talento_media', 'is', null)
                .order('matriz_talento_media', { ascending: false })
                .limit(3);

            topTalentos = topTalentosData || [];
        }

        // Gráfico OEE Global Mensal 
        // Se as horas reais ou planeadas estiverem a Zeros, o OEE é 0% para impedir o Falso-Vivo de 100%.
        const globalOEE = (horasReaisGerais > 0 && horasPlaneadasGerais > 0) ? Math.min(100, Math.round((horasPlaneadasGerais / horasReaisGerais) * 100)) : 0;

        // 5. CAUDAL DE PASSAGENS MENSAL (GRÁFICO)
        // Agrupar as OPs Criadas/Passadas por Semanas do último mês
        const dateL = new Date();
        dateL.setDate(dateL.getDate() - 30);

        const { data: OPsRecentes } = await supabase
            .from('ordens_producao')
            .select('created_at, status')
            .gte('created_at', dateL.toISOString());

        // Preparar arr de 4 semanas
        const graficoEvolucao = [
            { name: 'Semana 1', barcos: 0 },
            { name: 'Semana 2', barcos: 0 },
            { name: 'Semana 3', barcos: 0 },
            { name: 'Semana 4', barcos: 0 },
        ];

        if (OPsRecentes) {
            const nowTime = new Date().getTime();
            OPsRecentes.forEach((op: any) => {
                const opTime = new Date(op.created_at).getTime();
                const diffDays = Math.floor((nowTime - opTime) / (1000 * 60 * 60 * 24));

                if (diffDays <= 7) graficoEvolucao[3].barcos += 1;       // S4
                else if (diffDays <= 14) graficoEvolucao[2].barcos += 1; // S3
                else if (diffDays <= 21) graficoEvolucao[1].barcos += 1; // S2
                else if (diffDays <= 30) graficoEvolucao[0].barcos += 1; // S1
            });
        }

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
            topTalentos,
            caudalMensal: graficoEvolucao
        };
    } catch (err: unknown) {
        console.error("Dashboard Fetch Error:", err);
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

export async function fetchMicroOEEData() {
    try {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 30); // Analisar apenas o último mês para NVA

        // 1. Buscar todos os operadores Ativos
        const { data: operadoresAtivos, error: opErr } = await supabase
            .from('operadores')
            .select('id, nome_operador, tag_rfid_operador')
            .eq('status', 'Ativo');

        if (opErr) throw opErr;
        const operadores = operadoresAtivos || [];

        // 2. Buscar Leituras RFID de Produção para os ativos
        const { data: leiturasProducao, error: prodErr } = await supabase
            .from('registos_rfid_realtime')
            .select('operador_rfid, timestamp_inicio, timestamp_fim')
            .gte('timestamp_inicio', dateLimit.toISOString());

        if (prodErr) throw prodErr;

        // 3. Buscar Leituras de Pausas / NVA para os ativos
        const { data: leiturasPausas, error: pausaErr } = await supabase
            .from('log_pausas_operador')
            .select('operador_rfid, timestamp_inicio, timestamp_fim, motivo')
            .gte('timestamp_inicio', dateLimit.toISOString());

        if (pausaErr) throw pausaErr;

        // 4. Agregar Tempos por Operador
        const tabelaCruzamento = operadores.map(op => {
            let horasProducao = 0;
            let horasPausa = 0;

            // Compute Producao
            const opProducao = (leiturasProducao || []).filter(l => l.operador_rfid === op.tag_rfid_operador);
            opProducao.forEach(l => {
                const s = new Date(l.timestamp_inicio);
                const e = l.timestamp_fim ? new Date(l.timestamp_fim) : new Date();
                const diffHoras = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
                if (diffHoras > 0) horasProducao += diffHoras;
            });

            // Compute Pausas
            const opPausas = (leiturasPausas || []).filter(l => l.operador_rfid === op.tag_rfid_operador);
            opPausas.forEach(l => {
                const s = new Date(l.timestamp_inicio);
                const e = l.timestamp_fim ? new Date(l.timestamp_fim) : new Date();
                const diffHoras = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
                if (diffHoras > 0) horasPausa += diffHoras;
            });

            const total = horasProducao + horasPausa;
            const eficiencia = total > 0 ? (horasProducao / total) * 100 : 0;

            return {
                id: op.id,
                nome: op.nome_operador,
                horasProducao: horasProducao.toFixed(1),
                horasPausa: horasPausa.toFixed(1),
                total: total.toFixed(1),
                eficiencia: eficiencia.toFixed(1)
            };
        });

        // 5. Gargalos OEE Rápido (Top 5 Operações mais lentas singulares na semana)
        const dateWeek = new Date();
        dateWeek.setDate(dateWeek.getDate() - 7);

        const { data: estacoes } = await supabase.from('estacoes').select('id, nome_estacao');
        const mapEstacoes = new Map((estacoes || []).map(e => [e.id, e.nome_estacao]));

        const { data: ultimasPassagens } = await supabase
            .from('registos_rfid_realtime')
            .select(`
               id, timestamp_inicio, timestamp_fim, estacao_id, 
               ordens_producao ( op_numero )
            `)
            .gte('timestamp_inicio', dateWeek.toISOString());

        const gargalos = (ultimasPassagens || []).map((p: any) => {
            const s = new Date(p.timestamp_inicio);
            const e = p.timestamp_fim ? new Date(p.timestamp_fim) : new Date();
            const horas = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
            return {
                op_numero: p.ordens_producao?.op_numero || 'Desconhecida',
                estacao: p.estacao_id ? (mapEstacoes.get(p.estacao_id) || 'N/A') : 'N/A',
                horasGasto: horas
            };
        }).filter(g => g.horasGasto > 0)
            .sort((a, b) => b.horasGasto - a.horasGasto)
            .slice(0, 5)
            .map(g => ({ ...g, horasGasto: g.horasGasto.toFixed(2) }));


        return {
            success: true,
            tabelaCruzamento: tabelaCruzamento.sort((a, b) => Number(b.total) - Number(a.total)),
            gargalos
        };

    } catch (err: unknown) {
        console.error("Micro OEE Fetch Error:", err);
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

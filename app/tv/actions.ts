'use server';

import { createClient } from '@supabase/supabase-js';

import { getSafetyCross } from '../admin/hst/dashboard/actions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// A TV Cast tem Acessos Super Admin ao nivel da base de dados porque corre como Node Edge
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function buscarDashboardsTV(tv_id: string) {
    try {
        // 1. O que é que esta TV mostra afinal?
        const { data: configTv, error: tvErr } = await supabase
            .from('vw_tvs_configuradas')
            .select('*')
            .eq('id', tv_id)
            .single();

        if (tvErr || !configTv) {
            return { success: false, error: "Referência de TV Indisponível." };
        }

        const tipoAlvo = configTv.tipo_alvo; // 'LINHA', 'AREA', 'GERAL'
        const alvoId = configTv.alvo_id;

        // 2. Dependendo do Tipo de Alvo, recolher quais Estações pertencem a esse escopo
        let dictEstacoes: string[] = [];
        let stationsList: any[] = [];
        let radarAreasList: any[] = [];

        if (tipoAlvo === 'LINHA') {
            const { data: estacoesDaLinha } = await supabase
                .from('estacoes')
                .select('id, nome_estacao')
                .eq('linha_id', alvoId)
                .order('nome_estacao');
            stationsList = estacoesDaLinha || [];
            dictEstacoes = stationsList.map(e => e.id);
        } else if (tipoAlvo === 'AREA') {
            const { data: estacoesDaArea } = await supabase
                .from('estacoes')
                .select('id, nome_estacao')
                .eq('area_id', alvoId)
                .order('nome_estacao');
            stationsList = estacoesDaArea || [];
            dictEstacoes = stationsList.map(e => e.id);
        } else {
            // GERAL: Todas as estações da fábrica
            const { data: todasEstacoes } = await supabase.from('estacoes').select('id, nome_estacao, area_id').order('nome_estacao');
            const { data: todasAreas } = await supabase.from('areas_fabrica').select('id, nome_area').order('nome_area');
            stationsList = todasEstacoes || [];
            radarAreasList = todasAreas || [];
            dictEstacoes = stationsList.map(e => e.id);
        }

        // 3. Buscar Barcos (OPs) In_Progress nas Estações deste escopo
        let barcos: any[] = [];
        if (dictEstacoes.length > 0) {
            const { data: opsAtivasScope } = await supabase
                .from('registos_rfid_realtime')
                .select(`
                    id, op_id, estacao_id, timestamp_fim,
                    ordem:op_id(id, op_numero, hin_hull_id, status, semana_planeada, modelos ( nome_modelo ))
                `)
                .is('timestamp_fim', null) // Ativo na estacao
                .in('estacao_id', dictEstacoes);

            // Deduplicate boats by op_id
            const uniqueBarcos = new Map();
            opsAtivasScope?.forEach((reg: any) => {
                if (reg.ordem && !uniqueBarcos.has(reg.ordem.id)) {
                    uniqueBarcos.set(reg.ordem.id, reg.ordem);
                }
            });
            barcos = Array.from(uniqueBarcos.values()).slice(0, 4);
        }

        // 4. Detetar de todas as Estações deste escopo, se existe ALERTA ANDON a disparar
        const { data: alertas, error: aErr } = await supabase
            .from('alertas_andon')
            .select(`
                id, situacao, estacao_id, created_at, operador_rfid, op_id, tipo_alerta, descricao_alerta,
                estacoes:estacao_id ( nome_estacao, area_id, linha_id )
            `)
            .eq('resolvido', false)
            .in('estacao_id', dictEstacoes); // <- Filtro direto pelas estações alvo da TV

        if (aErr) throw aErr;

        // --- 5. NASA Level Metrics (Optional blocks based on opcoes_layout) ---
        const opcoesLayout = configTv.opcoes_layout || {};
        let advancedMetrics: any = { kpiOee: {}, heroiTurno: null, melhorArea: null, gargalos: [] };

        try {
            if (opcoesLayout.showWorkerOfMonth) {
                try {
                    const { data: topWorker } = await supabase.rpc('get_top_worker_of_month', {
                        p_tipo_alvo: configTv.tipo_alvo,
                        p_alvo_id: configTv.alvo_id
                    }).single();

                    if (topWorker) {
                        const worker = topWorker as any;
                        advancedMetrics.heroiTurno = {
                            nome_operador: worker.nome_operador || 'Sem Avaliações Recentes',
                            nota_eficiencia: worker.media_eficiencia || 0
                        };
                    } else {
                        // Fallback: If no evaluations found for this Area/Linha this month
                        advancedMetrics.heroiTurno = { nome_operador: 'A Aguardar Avaliações M.E.S.', nota_eficiencia: 0 };
                    }
                } catch (err) {
                    advancedMetrics.heroiTurno = { nome_operador: 'Erro a Carregar', nota_eficiencia: 0 };
                }
            }

            if (opcoesLayout.showSafeArea) {
                // Fetch the area with the fewest unresolved safety/quality alerts
                const { data: areasList, error: areaErr } = await supabase
                    .from('areas_fabrica')
                    .select('id, nome_area');

                if (!areaErr && areasList && areasList.length > 0) {
                    const { data: activeAlerts } = await supabase
                        .from('alertas_andon')
                        .select('estacao_id, estacoes(area_id)')
                        .eq('resolvido', false);

                    // Simple logic: Find area with fewest active incident alerts
                    const alertCounts = new Map();
                    areasList.forEach(a => alertCounts.set(a.id, 0));

                    activeAlerts?.forEach((alert: any) => {
                        const areaId = alert.estacoes?.area_id;
                        if (areaId && alertCounts.has(areaId)) {
                            alertCounts.set(areaId, alertCounts.get(areaId) + 1);
                        }
                    });

                    let safestArea = areasList[0];
                    let minAlerts = Infinity;

                    for (const area of areasList) {
                        const count = alertCounts.get(area.id);
                        if (count < minAlerts) {
                            minAlerts = count;
                            safestArea = area;
                        }
                    }

                    // Score is perfectly 100% minus 5% for every active alert in that area
                    const calcScore = Math.max(0, 100 - (minAlerts * 5));
                    advancedMetrics.melhorArea = { nome: safestArea.nome_area, score: calcScore };
                } else {
                    // Fallback
                    advancedMetrics.melhorArea = { nome: configTv.nome_alvo_resolvido, score: 100 };
                }
            }

            if (opcoesLayout.showBottlenecks) {
                // Fetch stations with the most recent unresolved incidents, constrained to this TV's scope
                let gargalosQuery = supabase
                    .from('alertas_andon')
                    .select('criado_em, tipo_alerta, estacoes(nome_estacao)')
                    .eq('resolvido', false)
                    .order('criado_em', { ascending: false })
                    .limit(3);

                if (dictEstacoes.length > 0 && configTv.tipo_alvo !== 'GERAL') {
                    gargalosQuery = gargalosQuery.in('estacao_id', dictEstacoes);
                }

                const { data: gargalosData } = await gargalosQuery;
                advancedMetrics.gargalos = gargalosData || [];
            }

            if (opcoesLayout.showOeeDay || opcoesLayout.showOeeMonth || opcoesLayout.showEfficiency) {
                // Cálculo de Rendimento baseado na Atividade Física Real:
                // Qual a proporção de Barcos na linha que já passaram do Planeado?
                let opsInTimeList: any[] = [];
                let opsDelayedList: any[] = [];

                if (dictEstacoes.length > 0) {
                    const { data: estacoesOps } = await supabase
                        .from('registos_rfid_realtime')
                        .select('id, timestamp_inicio, ordem:op_id(semana_planeada)')
                        .is('timestamp_fim', null)
                        .in('estacao_id', dictEstacoes);

                    if (estacoesOps) {
                        const currentWeek = 10; // Simple mockup logic for current week until calendar utils are invoked
                        estacoesOps.forEach((op: any) => {
                            if (op.ordem?.semana_planeada >= currentWeek) opsInTimeList.push(op);
                            else opsDelayedList.push(op);
                        });
                    }
                }

                const totalAtivas = opsInTimeList.length + opsDelayedList.length;
                let kpiRealizado = 0;
                let percentAtraso = 0;

                if (totalAtivas > 0) {
                    const pctEmDia = (opsInTimeList.length / totalAtivas) * 100;
                    kpiRealizado = pctEmDia; // Ex: se todos estiverem na semana certa, 100%
                    percentAtraso = 100 - pctEmDia;
                }

                advancedMetrics.kpiOee = {
                    diarioRealizado: parseFloat(kpiRealizado.toFixed(1)),
                    diarioObjetivo: 85.0,
                    mensalRealizado: parseFloat(Math.max(0, kpiRealizado - 4).toFixed(1)), // Mockup variation
                    mensalObjetivo: 85.0,
                    atrasoMinutos: opsDelayedList.length * 45, // Ex: 45 min penalty per delayed boat
                    percentagemAtraso: parseFloat(percentAtraso.toFixed(1))
                };
            }

            let opsRfidsForKpis: string[] = [];
            if (opcoesLayout.showAbsentismo || opcoesLayout.showHstKpis) {
                let opsQuery = supabase.from('operadores').select('id, tag_rfid').eq('status', 'ATIVO');
                if (configTv.tipo_alvo === 'AREA' && configTv.alvo_id) {
                    opsQuery = opsQuery.eq('area_base_id', configTv.alvo_id);
                } else if (configTv.tipo_alvo === 'LINHA' && configTv.alvo_id) {
                    opsQuery = opsQuery.eq('linha_base_id', configTv.alvo_id);
                }
                const { data: ops } = await opsQuery;
                const activeOps = ops || [];
                const opsRfids = activeOps.map(o => o.tag_rfid).filter(Boolean);
                opsRfidsForKpis = opsRfids;

                if (opcoesLayout.showAbsentismo) {
                    const totalCadastrados = opsRfids.length;
                    let absentismoData = { taxa: 0, faltosos: 0, cadastrados: totalCadastrados };

                    if (totalCadastrados > 0) {
                        const hojeStr = new Date().toISOString().split('T')[0];
                        const { data: presencas } = await supabase.from('log_ponto_diario')
                            .select('operador_rfid')
                            .gte('timestamp', `${hojeStr}T00:00:00Z`)
                            .lte('timestamp', `${hojeStr}T23:59:59Z`)
                            .in('operador_rfid', opsRfids);

                        const rfidsPresentes = new Set((presencas || []).map(p => p.operador_rfid));
                        const totalPresentes = rfidsPresentes.size;
                        const totalAusentes = Math.max(0, totalCadastrados - totalPresentes);
                        const taxa = totalPresentes > 0 ? (totalAusentes / totalCadastrados) * 100 : 0;
                        absentismoData = { taxa: parseFloat(taxa.toFixed(1)), faltosos: totalAusentes, cadastrados: totalCadastrados };
                    }
                    advancedMetrics.absentismo = absentismoData;
                }

                if (opcoesLayout.showHstKpis) {
                    const hojeStr = new Date().toISOString().split('T')[0];
                    let evalsQuery = supabase.from('avaliacoes_diarias')
                        .select('nota_hst, nota_qualidade')
                        .eq('data_avaliacao', hojeStr);

                    // Re-utilizar os UUIDs dos operadores ativos no Escopo (Não Rfids, UUIDS)
                    const opsUuids = activeOps.map(o => o.id).filter(Boolean);
                    if (opsUuids.length > 0 && configTv.tipo_alvo !== 'GERAL') {
                        evalsQuery = evalsQuery.in('funcionario_id', opsUuids);
                    }

                    const { data: evals } = await evalsQuery;

                    let sumHst = 0, sumQualidade = 0;
                    let count = (evals || []).length;

                    if (count > 0) {
                        evals?.forEach(e => {
                            sumHst += Number(e.nota_hst || 0);
                            sumQualidade += Number(e.nota_qualidade || 0);
                        });
                        advancedMetrics.hstKpis = {
                            segurancaDiaria: parseFloat(((sumHst / count) / 4 * 100).toFixed(1)),
                            conformidadeFabril: parseFloat(((sumQualidade / count) / 4 * 100).toFixed(1))
                        };
                    } else {
                        advancedMetrics.hstKpis = { segurancaDiaria: 100, conformidadeFabril: 100 };
                    }
                }
            }

            if (opcoesLayout.showSafetyCross) {
                try {
                    const now = new Date();
                    const scRes = await getSafetyCross(
                        now.getFullYear(),
                        now.getMonth() + 1,
                        configTv.tipo_alvo,
                        configTv.alvo_id,
                        dictEstacoes
                    );
                    if (scRes.success && scRes.data) {
                        advancedMetrics.safetyCrossDays = scRes.data;
                    } else {
                        advancedMetrics.safetyCrossDays = [];
                    }
                } catch (e) {
                    advancedMetrics.safetyCrossDays = [];
                }
            }
        } catch (mErr) {
            console.error("Metric aggregation silent fail:", mErr);
        }

        // 6. Build Radar Estacoes Array
        let radarEstacoes: any[] = [];

        if (tipoAlvo === 'GERAL') {
            radarEstacoes = radarAreasList.map(area => {
                const alertasNaArea = alertas?.filter(a => {
                    const estacao = stationsList.find(s => s.id === a.estacao_id);
                    return estacao && estacao.area_id === area.id;
                });
                const qtdAlertas = alertasNaArea ? alertasNaArea.length : 0;
                return {
                    id: area.id,
                    nome_estacao: area.nome_area, // Retain uniform key names for generic page UI
                    hasAndon: qtdAlertas > 0,
                    andonType: qtdAlertas > 0 ? `${qtdAlertas} ALERTA(S)` : null
                };
            });
        } else {
            radarEstacoes = stationsList.map(station => {
                const andon = alertas?.find(a => a.estacao_id === station.id);
                return {
                    id: station.id,
                    nome_estacao: station.nome_estacao,
                    hasAndon: !!andon,
                    andonType: andon ? andon.tipo_alerta : null
                };
            });
        }

        return {
            success: true,
            config: configTv,
            barcos: barcos,
            alertasGlobais: alertas || [],
            radarEstacoes,
            advancedMetrics
        };
    } catch (err: any) {
        return { success: false, error: err.message || "Erro Técnico TV." };
    }
}

'use server';

import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';

import { getSafetyCross } from '../admin/hst/dashboard/actions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// A TV Cast tem Acessos Super Admin ao nivel da base de dados porque corre como Node Edge
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function buscarDashboardsTV(tv_id: string) {
    noStore();
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

        const tipoAlvo = configTv.tipo_alvo; // 'LINHA', 'AREA', 'GERAL', 'PLANEAMENTO'
        const alvoId = configTv.alvo_id;

        // Fast-path: Se for Dashboard de Planeamento, injetamos as OPs planeadas e contornamos a lógica Andon/Operadores
        if (tipoAlvo === 'PLANEAMENTO') {
            const { data, error } = await supabase
                .from('ordens_producao')
                .select(`
                    id, op_numero, hin_hull_id, semana_planeada, ordem_sequencial_linha, data_prevista_inicio,
                    modelos ( nome_modelo ),
                    linhas_producao ( letra_linha )
                `)
                .in('status', ['PLANNED', 'IN_PROGRESS'])
                .order('ordem_sequencial_linha', { ascending: true });

            let planeamentoData: any[] = [];
            if (!error && data) {
                planeamentoData = (data as any[]).map(op => ({
                    id: op.id,
                    op_numero: op.op_numero,
                    modelo: op.modelos?.nome_modelo || 'Desconhecido',
                    hin_hull_id: op.hin_hull_id,
                    semana_planeada: op.semana_planeada || 'BACKLOG',
                    ordem_sequencial_linha: op.ordem_sequencial_linha || 0,
                    data_prevista_inicio: op.data_prevista_inicio,
                    linha: op.linhas_producao?.letra_linha || 'N/A'
                }));
            }

            return {
                success: true,
                config: configTv,
                planeamentoData
            };
        }

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
        let alertasQuery = supabase
            .from('alertas_andon')
            .select(`
                id, situacao, estacao_id, local_ocorrencia_id, created_at, operador_rfid, op_id, tipo_alerta, descricao_alerta,
                causadora:estacao_id ( nome_estacao, area_id, linha_id ),
                estacoes:local_ocorrencia_id ( nome_estacao, area_id, linha_id )
            `)
            .eq('resolvido', false);

        if (tipoAlvo !== 'GERAL') {
            if (dictEstacoes.length > 0) {
                alertasQuery = alertasQuery.or(`estacao_id.in.(${dictEstacoes.join(',')}),local_ocorrencia_id.in.(${dictEstacoes.join(',')})`);
            } else {
                alertasQuery = alertasQuery.in('estacao_id', ['00000000-0000-0000-0000-000000000000']);
            }
        }

        const { data: alertasRaw, error: aErr } = await alertasQuery;
        
        // Fallback robusto se migração não tiver percorrido todos (fallback `estacoes` object)
        const alertas = alertasRaw?.map(al => ({
            ...al,
            estacoes: al.estacoes || al.causadora
        }));

        if (aErr) throw aErr;

        // --- 5. NASA Level Metrics (Optional blocks based on opcoes_layout) ---
        const opcoesLayout = configTv.opcoes_layout || {};
        let advancedMetrics: any = { kpiOee: {}, heroiTurno: null, melhorArea: null, gargalos: [] };

        // =========================================================================================
        // REGRA DE NEGÓCIO: ALVOS E OPERADORES BASE DA TV (Montagem Fallback & Station Prefix Rule)
        // =========================================================================================
        const nomeTargetTV = configTv.nome_alvo_resolvido || '';
        const isMontagemLine = configTv.tipo_alvo === 'LINHA' && /linha [abcd]/i.test(nomeTargetTV);
        const prefixoLinhaPuro = isMontagemLine ? nomeTargetTV.replace(/linha/i, '').trim() : '';
        const prefixoFormatado = prefixoLinhaPuro ? `${prefixoLinhaPuro} -` : '';

        // Definimos o ID lógico que os widgets (Hero, Safety, etc) vão usar 
        // (Se for Montagem Line, passamos a olhar para a Área da Montagem inteira, mas limitados aos operadores do prefixo)
        let logicalTargetType = configTv.tipo_alvo;
        let logicalTargetId = configTv.alvo_id;

        if (isMontagemLine) {
            const { data: areaMontagem } = await supabase.from('areas_fabrica').select('id').ilike('nome_area', '%Montagem%').limit(1).single();
            if (areaMontagem) {
                logicalTargetType = 'AREA';
                logicalTargetId = areaMontagem.id;
            }
        }

        // Descobrir Exatamente Quem são os Operadores Desta TV
        let opsQuery = supabase.from('operadores')
            .select('id, tag_rfid_operador, area_base_id, linha_base_id, estacoes:posto_base_id(nome_estacao)')
            .eq('status', 'Ativo');

        if (logicalTargetType === 'AREA' && logicalTargetId) {
            opsQuery = opsQuery.eq('area_base_id', logicalTargetId);
        } else if (logicalTargetType === 'LINHA' && logicalTargetId) {
            opsQuery = opsQuery.eq('linha_base_id', logicalTargetId);
        }

        const { data: rawOps, error: opErr } = await opsQuery;
        let tvActiveOps = rawOps || [];

        // Filtro de Prefixo para as Linhas da Montagem
        if (isMontagemLine && prefixoFormatado) {
            tvActiveOps = tvActiveOps.filter(o => {
                const est = Array.isArray(o.estacoes) ? o.estacoes[0] : (o.estacoes as any);
                const nomeEstacao = est?.nome_estacao || '';
                return nomeEstacao.startsWith(prefixoFormatado);
            });
        }

        const tvActiveOpIds = tvActiveOps.map(o => o.id);
        const tvActiveOpRfids = tvActiveOps.map(o => o.tag_rfid_operador).filter(Boolean);


        // =========================================================================================
        // CALCULO DOS WIDGETS
        // =========================================================================================

        try {
            if (opcoesLayout.showWorkerOfMonth) {
                try {
                    // Adaptando o Herói do Turno apenas para o subset de operadores encontrados
                    // Uma vez que a RPC retorna o Herói baseado na Área toda, temos de cruzar com a nossa pool de UUIDs filtrados (tvActiveOpIds)
                    // Num cenário ideal reescrevia-se a RPC, mas podemos filtrar no Javascript puxando o mês num single query se o target for MontagemLine
                    
                    if (isMontagemLine && tvActiveOpIds.length > 0) {
                        const now = new Date();
                        const startOfMonthStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString();
                        
                        const { data: workerMonthRank } = await supabase.from('avaliacoes_diarias')
                            .select('funcionario_id, nota_eficiencia, operadores(nome_operador)')
                            .gte('data_avaliacao', startOfMonthStr)
                            .in('funcionario_id', tvActiveOpIds);
                            
                        if (workerMonthRank && workerMonthRank.length > 0) {
                            // Find highest average
                            const avgs: Record<string, { sum: number, count: number, nome: string }> = {};
                            workerMonthRank.forEach(w => {
                                if (!avgs[w.funcionario_id]) avgs[w.funcionario_id] = { sum: 0, count: 0, nome: (Array.isArray(w.operadores) ? w.operadores[0].nome_operador : (w.operadores as any)?.nome_operador) || '' };
                                avgs[w.funcionario_id].sum += Number(w.nota_eficiencia || 0);
                                avgs[w.funcionario_id].count++;
                            });
                            
                            let bestId = '';
                            let highestAvg = -1;
                            for (const [id, stats] of Object.entries(avgs)) {
                                const avg = stats.sum / stats.count;
                                if (avg > highestAvg) { highestAvg = avg; bestId = id; }
                            }
                            
                            const bestWorker = avgs[bestId];
                            
                            const { data: progressionData } = await supabase.from('avaliacoes_diarias')
                                .select('data_avaliacao, nota_eficiencia')
                                .eq('funcionario_id', bestId)
                                .gte('data_avaliacao', startOfMonthStr)
                                .order('data_avaliacao', { ascending: true });
                                
                            advancedMetrics.heroiTurno = {
                                nome_operador: bestWorker.nome,
                                nota_eficiencia: parseFloat(highestAvg.toFixed(2)),
                                progresso_diario: progressionData || []
                            };
                        } else {
                            advancedMetrics.heroiTurno = { nome_operador: 'A Aguardar Avaliações M.E.S.', nota_eficiencia: 0, progresso_diario: [] };
                        }
                    } else {
                        // Standard RPC logic for Generic/Area/Other Lines
                        const { data: topWorker } = await supabase.rpc('get_top_worker_of_month', {
                            p_tipo_alvo: logicalTargetType,
                            p_alvo_id: logicalTargetId
                        }).single();

                        if (topWorker) {
                            const worker = topWorker as any;
                            const now = new Date();
                            const startOfMonthStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString().split('T')[0];

                            const { data: progressionData } = await supabase
                                .from('avaliacoes_diarias')
                                .select('data_avaliacao, nota_eficiencia')
                                .eq('funcionario_id', worker.funcionario_id)
                                .gte('data_avaliacao', startOfMonthStr)
                                .order('data_avaliacao', { ascending: true });

                            advancedMetrics.heroiTurno = {
                                nome_operador: worker.nome_operador || 'Sem Avaliações Recentes',
                                nota_eficiencia: worker.media_eficiencia || 0,
                                progresso_diario: progressionData || []
                            };
                        } else {
                            advancedMetrics.heroiTurno = { nome_operador: 'A Aguardar Avaliações M.E.S.', nota_eficiencia: 0, progresso_diario: [] };
                        }
                    }
                } catch (err) {
                    advancedMetrics.heroiTurno = { nome_operador: 'Erro a Carregar', nota_eficiencia: 0, progresso_diario: [] };
                }
            }

            if (opcoesLayout.showSafeArea) {
                // Se for Geral, avaliamos Áreas. Se não, avaliamos Estações do escopo.
                const isGeneralScope = configTv.tipo_alvo === 'GERAL';
                
                let targetEntities: any[] = [];
                let alertCounts = new Map();

                if (isGeneralScope) {
                    const { data: areasList } = await supabase.from('areas_fabrica').select('id, nome_area');
                    targetEntities = areasList || [];
                } else {
                    let stQuery = supabase.from('estacoes').select('id, nome_estacao');
                    if (logicalTargetType === 'AREA') stQuery = stQuery.eq('area_id', logicalTargetId);
                    if (logicalTargetType === 'LINHA') stQuery = stQuery.eq('linha_id', logicalTargetId);
                    const { data: stList } = await stQuery;
                    let dbStations = stList || [];
                    
                    // Applicar regra da "Montagem" às Estações: manter apenas as que têm a letra "A - "
                    if (isMontagemLine && prefixoFormatado) {
                        dbStations = dbStations.filter(s => s.nome_estacao.startsWith(prefixoFormatado));
                    }
                    targetEntities = dbStations;
                }

                if (targetEntities.length > 0) {
                    targetEntities.forEach(e => alertCounts.set(e.id, 0));

                    let validStationIds = targetEntities.map(e => e.id);

                    let alertsQuery = supabase.from('alertas_andon').select('estacao_id, estacoes(area_id)').eq('resolvido', false);
                    if (!isGeneralScope && validStationIds.length > 0) {
                        alertsQuery = alertsQuery.in('estacao_id', validStationIds);
                    }
                    const { data: activeAlerts } = await alertsQuery;

                    activeAlerts?.forEach((alert: any) => {
                        const entityId = isGeneralScope ? alert.estacoes?.area_id : alert.estacao_id;
                        if (entityId && alertCounts.has(entityId)) {
                            alertCounts.set(entityId, alertCounts.get(entityId) + 1);
                        }
                    });

                    let safestEntity = targetEntities[0];
                    let minAlerts = Infinity;

                    for (const entity of targetEntities) {
                        const count = alertCounts.get(entity.id);
                        if (count < minAlerts) {
                            minAlerts = count;
                            safestEntity = entity;
                        }
                    }

                    const calcScore = Math.max(0, 100 - (minAlerts * 5));
                    advancedMetrics.melhorArea = { 
                        nome: safestEntity.nome_area || safestEntity.nome_estacao, 
                        score: calcScore,
                        tipo: isGeneralScope ? 'Área Fábrica' : 'Estação'
                    };
                } else {
                    advancedMetrics.melhorArea = { nome: configTv.nome_alvo_resolvido, score: 100, tipo: 'Alvo Isolado' };
                }
            }

            if (opcoesLayout.showBottlenecks) {
                // Aqui mantemos as estacoes físicas resolvidas globalmente na var `dictEstacoes` (barcos physical line)
                // Ou podemos fazer re-scoping igual à safetyArea se os gargalos na Montagem Linha A também só baterem em postos A.
                // Vou manter o scoping global físico que estava a funcionar no início
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
                let opsInTimeList: any[] = [];
                let opsDelayedList: any[] = [];

                if (dictEstacoes.length > 0) {
                    const { data: estacoesOps } = await supabase
                        .from('registos_rfid_realtime')
                        .select('id, timestamp_inicio, ordem:op_id(semana_planeada)')
                        .is('timestamp_fim', null)
                        .in('estacao_id', dictEstacoes);

                    if (estacoesOps) {
                        const currentWeek = 10; 
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
                    kpiRealizado = pctEmDia; 
                    percentAtraso = 100 - pctEmDia;
                }

                advancedMetrics.kpiOee = {
                    diarioRealizado: parseFloat(kpiRealizado.toFixed(1)),
                    diarioObjetivo: 85.0,
                    mensalRealizado: parseFloat(Math.max(0, kpiRealizado - 4).toFixed(1)), 
                    mensalObjetivo: 85.0,
                    atrasoMinutos: opsDelayedList.length * 45, 
                    percentagemAtraso: parseFloat(percentAtraso.toFixed(1))
                };
            }

            if (opcoesLayout.showAbsentismo || opcoesLayout.showHstKpis) {
                if (opcoesLayout.showAbsentismo) {
                    const totalCadastrados = tvActiveOpRfids.length;
                    let absentismoData = { taxa: 0, faltosos: 0, cadastrados: totalCadastrados };

                    if (totalCadastrados > 0) {
                        const now = new Date();
                        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                        
                        console.log(`[ABSENTISMO DEBUG] TV (${configTv.nome_alvo_resolvido}) | Cadastrados: ${totalCadastrados} | RFC IDs Pool:`, tvActiveOpRfids.slice(0, 5), '...');
                        console.log(`[ABSENTISMO DEBUG] Buscando logs entre: ${startOfDay.toISOString()} e ${endOfDay.toISOString()}`);

                        const { data: presencas } = await supabase.from('log_ponto_diario')
                            .select('operador_rfid')
                            .gte('timestamp', startOfDay.toISOString())
                            .lte('timestamp', endOfDay.toISOString())
                            .in('operador_rfid', tvActiveOpRfids);

                        const rfidsPresentes = new Set((presencas || []).map(p => p.operador_rfid));
                        const totalPresentes = rfidsPresentes.size;
                        console.log(`[ABSENTISMO DEBUG] Encontradas ${presencas?.length || 0} presenças hoje. (Únicas: ${totalPresentes})`);
                        
                        const totalAusentes = Math.max(0, totalCadastrados - totalPresentes);
                        const taxa = totalPresentes > 0 ? (totalAusentes / totalCadastrados) * 100 : 0;
                        absentismoData = { taxa: parseFloat(taxa.toFixed(1)), faltosos: totalAusentes, cadastrados: totalCadastrados };
                    }
                    advancedMetrics.absentismo = absentismoData;
                }

                if (opcoesLayout.showHstKpis) {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const localHojeStr = `${year}-${month}-${day}`;

                    let evalsQuery = supabase.from('avaliacoes_diarias')
                        .select('nota_hst, nota_qualidade')
                        .eq('data_avaliacao', localHojeStr);

                    if (tvActiveOpIds.length > 0 && configTv.tipo_alvo !== 'GERAL') {
                        evalsQuery = evalsQuery.in('funcionario_id', tvActiveOpIds);
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
                        logicalTargetType, // Uses the resolved generic target
                        logicalTargetId,
                        dictEstacoes // This might need explicit scoping too, but SC logic typically uses the Area ID inherently
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
                    const now = new Date();
                    const startOfMonthStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString();
                    const endOfMonthStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59)).toISOString();

                    let areaId = null, linhaId = null;
                    if (configTv.tipo_alvo === 'AREA') areaId = configTv.alvo_id;
                    if (configTv.tipo_alvo === 'LINHA') linhaId = configTv.alvo_id;

                    const { data: efiData, error: efiErr } = await supabase.rpc('get_eficiencia_hh', {
                        p_data_inicio: startOfMonthStr,
                        p_data_fim: endOfMonthStr,
                        p_area_id: areaId,
                        p_linha_id: linhaId,
                        p_estacao_id: null
                    });
                    
                    if (!efiErr && efiData && efiData.length > 0) {
                        advancedMetrics.eficienciaHh = {
                            percentual: Number(efiData[0].eficiencia_percentual) || 0,
                            horasGanhas: Number(efiData[0].horas_ganhas) || 0,
                            horasTrabalhadas: Number(efiData[0].horas_trabalhadas) || 0,
                        };
                    } else {
                        advancedMetrics.eficienciaHh = { percentual: 0, horasGanhas: 0, horasTrabalhadas: 0 };
                    }
                } catch (e) {
                     advancedMetrics.eficienciaHh = { percentual: 0, horasGanhas: 0, horasTrabalhadas: 0 };
                }
            // --- NOVO MÓDULO: QCIS (Qualidade Inter-Camadas) ---
        if (opcoesLayout.showQCISQuality) {
            try {
                const now = new Date();
                const primeiroDia = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const ultimoDia = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                
                // 1. Dados QCIS para o Mês Decorrente (Foco na Linha Atual se Configurado)
                let qcisQuery = supabase.from('qcis_audits')
                    .select('substation_name, boat_id, count_of_defects, seccao')
                    .gte('fail_date', primeiroDia)
                    .lte('fail_date', ultimoDia);

                // Se a TV for de LINHA, limitamos a qualidade apenas à Linha corrente.
                if (logicalTargetType === 'LINHA' && logicalTargetId) {
                    const lName = opcoesLayout.qcisLinha?.trim() || configTv.nome_alvo_resolvido;
                    console.log(`[QCIS TV DEBUG] Filtro ativo para Linha: ${lName}`);
                    if (lName) {
                        // Se o administrador escreveu explicitamente no qcisLinha, usamos igualdade absoluta
                        if (opcoesLayout.qcisLinha?.trim()) {
                            qcisQuery = qcisQuery.eq('linha_linha', lName);
                        } else {
                            qcisQuery = qcisQuery.textSearch('linha_linha', lName);
                        }
                    }
                }
                
                const { data: qcisData, error: qcisError } = await qcisQuery;
                console.log(`[QCIS TV DEBUG] Retornados ${qcisData?.length || 0} registos para Datas ${primeiroDia} a ${ultimoDia}`);
                if (qcisError) console.error("[QCIS TV DEBUG] DB Query Error:", qcisError);

                let ftrPercent = "N/A";
                let dpuScore = "0.00";

                if (qcisData && qcisData.length > 0) {
                    // KPI: FTR (Testes Funcionais)
                    const targetFTR = (opcoesLayout.qcisSubstationFTR || 'testes funcionais').toLowerCase();
                    const ftrAudits = qcisData.filter(a => (a.substation_name || '').toLowerCase().includes(targetFTR));
                    if (ftrAudits.length > 0) {
                        const totalBoats = new Set(ftrAudits.map(a => a.boat_id).filter(Boolean)).size;
                        const zeroBoats = new Set(
                            ftrAudits.filter(a => {
                                const s = (a.seccao || '').toLowerCase();
                                return s.includes('zero') || s.includes('100%');
                            }).map(a => a.boat_id).filter(Boolean)
                        ).size;
                        if (totalBoats > 0) ftrPercent = `${Math.round((zeroBoats / totalBoats) * 100)}%`;
                    }
                    
                    // KPI: DPU (Inspecção Final Embalamento)
                    const targetDPU = (opcoesLayout.qcisSubstationDPU || 'inspecção final embalamento').toLowerCase();
                    const embAudits = qcisData.filter(a => (a.substation_name || '').toLowerCase().includes(targetDPU));
                    if (embAudits.length > 0) {
                        const totalEmbBoats = new Set(embAudits.map(a => a.boat_id).filter(Boolean)).size;
                        const totalDefects = embAudits.reduce((acc, curr) => acc + (curr.count_of_defects || 0), 0);
                        if (totalEmbBoats > 0) dpuScore = (totalDefects / totalEmbBoats).toFixed(2);
                    }
                }

                // 2. Barcos Embalados Ontem (Auditorias QCIS no dia de ontem na Subestação de Embalamento DPU)
                const ontem = new Date();
                ontem.setDate(ontem.getDate() - 1);
                const dataOntemStr = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate()).toISOString().split('T')[0];

                let boatsQuery = supabase.from('qcis_audits')
                    .select('boat_id, substation_name')
                    .eq('fail_date', dataOntemStr);

                if (logicalTargetType === 'LINHA' && logicalTargetId) {
                    const lName = opcoesLayout.qcisLinha?.trim() || configTv.nome_alvo_resolvido;
                    if (lName) {
                        if (opcoesLayout.qcisLinha?.trim()) {
                            boatsQuery = boatsQuery.eq('linha_linha', lName);
                        } else {
                            boatsQuery = boatsQuery.textSearch('linha_linha', lName);
                        }
                    }
                }

                const { data: ontemData } = await boatsQuery;
                
                let countBarcosOntem = 0;
                if (ontemData && ontemData.length > 0) {
                    const targetDPU = (opcoesLayout.qcisSubstationDPU || 'inspecção final embalamento').toLowerCase();
                    const embOntemAudits = ontemData.filter(a => (a.substation_name || '').toLowerCase().includes(targetDPU));
                    const uniqueBoatsOntem = new Set(embOntemAudits.map(a => a.boat_id).filter(Boolean));
                    countBarcosOntem = uniqueBoatsOntem.size;
                }

                advancedMetrics.qcisKpis = {
                    ftrPercent: ftrPercent,
                    dpuEmbalamento: dpuScore,
                    barcosEmbaladosOntem: countBarcosOntem || 0
                };
            } catch (errQCIS) {
                console.error("QCIS Aggregation silent fail:", errQCIS);
                advancedMetrics.qcisKpis = { ftrPercent: "N/A", dpuEmbalamento: "0.00", barcosEmbaladosOntem: 0 };
            }
        }

        // 6. Build Radar Estacoes Array
        let radarEstacoes: any[] = [];

        if (logicalTargetType === 'GERAL') {
            radarEstacoes = radarAreasList.map(area => {
                const alertasNaArea = alertas?.filter(a => {
                    const estacaoId = a.local_ocorrencia_id || a.estacao_id;
                    const estacao = stationsList.find(s => s.id === estacaoId);
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
                const andon = alertas?.find(a => (a.local_ocorrencia_id || a.estacao_id) === station.id);
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
    } catch (err: unknown) {
        let msg = "Erro Técnico TV.";
        if (err instanceof Error) msg = err.message;
        return { success: false, error: msg };
    }
}

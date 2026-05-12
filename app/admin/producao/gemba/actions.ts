'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function getGembaHubData() {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user?.email) throw new Error("Não Autorizado");

        // 1. Achar as fronteiras de Segurança
        let isGlobal = false;
        let meuNome = "";
        let filterString = "";
        let myUserId = "";
        
        if (userData.user.email === 'master@brunswick.pt') {
            isGlobal = true;
        } else {
            const { data: myData } = await supabase.from('operadores').select('id, nome_operador, nivel_permissao').eq('email_acesso', userData.user.email).single();
            if (myData) {
                myUserId = myData.id;
                if (myData.nivel_permissao === 'Admin' || myData.nivel_permissao === 'Recursos Humanos') {
                    isGlobal = true;
                } else {
                    meuNome = myData.nome_operador;
                }
            } else {
                throw new Error("Credenciais Inválidas na Matriz de Talentos");
            }
        }

        // 2. Descobrir as Estações da Jurisdição do Líder via BÚSSOLA
        let bussolaStationIds: string[] = [];
        let areaIds: string[] = [];
        
        const { data: allEstacoes } = await supabase.from('estacoes').select('id, area_id, lider_t1_id, supervisor_t1_id, lider_t2_id, supervisor_t2_id, manutencao_id, qualidade_id, logistica_id');
        
        if (allEstacoes) {
            allEstacoes.forEach(est => {
                if (isGlobal || [est.lider_t1_id, est.supervisor_t1_id, est.lider_t2_id, est.supervisor_t2_id, est.manutencao_id, est.qualidade_id, est.logistica_id].includes(myUserId)) {
                    bussolaStationIds.push(est.id);
                    if (est.area_id && !areaIds.includes(est.area_id)) areaIds.push(est.area_id);
                }
            });
        }
        
        let myStations = [...bussolaStationIds];

        // 3. Buscar os Operadores
        const { data: allOps } = await supabase.from('operadores').select('id, nome_operador, posto_base_id, area_base_id, tag_rfid_operador, lider_nome, supervisor_nome, gestor_nome').eq('status', 'Ativo');
        
        const myOps = (allOps || []).filter(op => {
            if (isGlobal) return true;
            // É liderado diretamente por ele?
            if (op.lider_nome === meuNome || op.supervisor_nome === meuNome || op.gestor_nome === meuNome) return true;
            // Pertence a uma estação ou área que ele lidera na Bússola?
            if (op.posto_base_id && myStations.includes(op.posto_base_id)) return true;
            if (op.area_base_id && areaIds.includes(op.area_base_id)) return true;
            return false;
        });

        // Adicionar postos base dos operadores à lista de estações
        myOps.forEach(op => {
            if (op.posto_base_id && !myStations.includes(op.posto_base_id)) myStations.push(op.posto_base_id);
        });

        // Se o lider nao tiver estacoes/equipa e nao for global, devolvemos tudo vazio
        if (!isGlobal && myStations.length === 0 && myOps.length === 0) {
            return { success: true, data: { andonsCausador: [], andonsVitima: [], ausentes: [], iluoRisco: [], acoesAtrasadas: [], cronogramaAtrasado: [], formacoesAtrasadas: [], baixaPerformance: [], userName: meuNome }};
        }

        // 4. ANDONS (Em Tempo Real - Não resolvidos)
        const { data: rawAndons } = await supabase
            .from('alertas_andon')
            .select('*, estacoes!estacao_id(nome_estacao), causadoras:estacoes!local_ocorrencia_id(nome_estacao)')
            .eq('resolvido', false);

        const andonsCausador: any[] = [];
        const andonsVitima: any[] = [];

        if (rawAndons) {
            rawAndons.forEach(a => {
                const isCausador = isGlobal || myStations.includes(a.local_ocorrencia_id);
                const isVitima = isGlobal || myStations.includes(a.estacao_id);

                if (isCausador) andonsCausador.push(a);
                else if (isVitima) andonsVitima.push(a);
            });
        }

        // 5. Headcount Absentismo Hoje
        const today = new Date().toISOString().split('T')[0];
        const { data: presencasRaw } = await supabase.from('log_ponto_diario')
            .select('operador_rfid')
            .gte('timestamp', `${today}T00:00:00Z`)
            .lte('timestamp', `${today}T23:59:59Z`);

        const allRfidsPresentes = new Set((presencasRaw || []).map((p: any) => p.operador_rfid));
        
        const ausentes: any[] = [];
        const turnoIniciado = allRfidsPresentes.size > 0;

        if (turnoIniciado) {
            myOps.forEach(op => {
                if (!op.tag_rfid_operador || !allRfidsPresentes.has(op.tag_rfid_operador)) {
                    ausentes.push(op);
                }
            });
        }

        // 6. ILUO Risco Crítico
        const { data: iluoData } = await supabase.from('operador_iluo_matriz')
            .select('estacao_id, nivel_iluo, operador_id, estacoes!inner(nome_estacao)');

        const estacaoIluoStats: Record<string, { nome: string, temO_ou_U: boolean, todos_I_ou_L: boolean }> = {};
        if (iluoData) {
            iluoData.forEach(i => {
                // Filtrar apenas para estações da jurisdição
                if (!isGlobal && !myStations.includes(i.estacao_id)) return;
                
                if (!estacaoIluoStats[i.estacao_id]) {
                    const est = i.estacoes as any;
                    const nomeEstacao = est?.nome_estacao || est?.[0]?.nome_estacao || 'Desconhecida';
                    estacaoIluoStats[i.estacao_id] = { nome: nomeEstacao, temO_ou_U: false, todos_I_ou_L: true };
                }
                if (i.nivel_iluo === 'U' || i.nivel_iluo === 'O') {
                    estacaoIluoStats[i.estacao_id].temO_ou_U = true;
                    estacaoIluoStats[i.estacao_id].todos_I_ou_L = false;
                }
            });
        }
        
        const iluoRisco: any[] = Object.values(estacaoIluoStats).filter(e => !e.temO_ou_U && e.todos_I_ou_L);

        // 7. Ações Pendentes (lean_acoes)
        const { data: allAcoes } = await supabase.from('lean_acoes').select('*').neq('status', 'concluido');
        const acoesPendentes = (allAcoes || []).filter(a => {
            if (isGlobal) return true;
            const primeiroNome = meuNome.split(' ')[0];
            return a.responsavel_nome && a.responsavel_nome.toLowerCase().includes(primeiroNome.toLowerCase());
        });
        const acoesAtrasadas = acoesPendentes.filter((a: any) => a.prazo && a.prazo < today);

        // 8. Auditorias 5S Atrasadas (lean_5s_cronograma)
        const { data: all5S } = await supabase.from('lean_5s_cronograma').select('*, estacoes(nome_estacao)').is('data_realizada', null).lte('data_prevista', today);
        
        const cronogramaAtrasado = (all5S || []).filter(c => {
            if (isGlobal) return true;
            return c.auditor_id === myUserId || myStations.includes(c.estacao_id);
        });

        // 9. Formações a Vencer / Atrasadas (rh_planos_formacao)
        const myOpIds = myOps.map(o => o.id);
        const { data: allFormacoes } = await supabase.from('rh_planos_formacao')
            .select('*, formando:operadores!formando_id(nome_operador), estacao:estacoes(nome_estacao)')
            .in('status', ['Planeado', 'Em Curso']);
            
        const formacoesRaw = (allFormacoes || []).filter(f => {
            if (isGlobal) return true;
            return myOpIds.includes(f.formando_id);
        });
        const formacoesAtrasadas = formacoesRaw.filter((f: any) => f.data_fim_estimada && f.data_fim_estimada < today);

        // 10. Piores Performances (avaliacoes_diarias)
        const { data: allAval } = await supabase.from('avaliacoes_diarias')
             .select('funcionario_id, data_avaliacao, nota_hst, nota_epi, nota_5s, nota_eficiencia, nota_objetivos, nota_atitude, nota_qualidade, operadores!inner(nome_operador)')
             .order('data_avaliacao', { ascending: false });

        const avalRaw = (allAval || []).filter(a => {
            if (isGlobal) return true;
            return myOpIds.includes(a.funcionario_id);
        });

        const operadorAvalMap: Record<string, { nome: string, notas: number[] }> = {};
        if (avalRaw) {
             avalRaw.forEach(av => {
                 const media = (av.nota_hst + av.nota_epi + av.nota_5s + av.nota_eficiencia + av.nota_objetivos + av.nota_atitude + av.nota_qualidade) / 7;
                 const opName = (av.operadores as any)?.nome_operador || (av.operadores as any)?.[0]?.nome_operador || "Desconhecido";
                 if (!operadorAvalMap[av.funcionario_id]) operadorAvalMap[av.funcionario_id] = { nome: opName, notas: [] };
                 if (operadorAvalMap[av.funcionario_id].notas.length < 1) operadorAvalMap[av.funcionario_id].notas.push(media); // ultimos registos
             });
        }

        let baixaPerformance = [];
        const opsToMap = Object.keys(operadorAvalMap);
        
        for (const opId of opsToMap) {
             const dataAval = operadorAvalMap[opId];
             if (dataAval.notas.length > 0) {
                 baixaPerformance.push({ nome: dataAval.nome, media: dataAval.notas[0].toFixed(1) });
             }
        }
        
        baixaPerformance.sort((a,b) => parseFloat(a.media) - parseFloat(b.media));
        baixaPerformance = baixaPerformance.slice(0, 4);

        return { 
            success: true, 
            data: {
                andonsCausador,
                andonsVitima,
                ausentes,
                iluoRisco,
                acoesAtrasadas,
                cronogramaAtrasado,
                formacoesAtrasadas,
                baixaPerformance,
                myStationsCount: myStations.length,
                myOpsCount: myOps.length,
                isGlobal,
                userName: meuNome,
                turnoIniciado
            }
        };

    } catch (err: any) {
         return { success: false, error: err?.message };
    }
}

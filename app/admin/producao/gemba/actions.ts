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
                    filterString = `lider_nome.eq."${meuNome}",supervisor_nome.eq."${meuNome}",gestor_nome.eq."${meuNome}"`;
                }
            } else {
                throw new Error("Credenciais Inválidas na Matriz de Talentos");
            }
        }

        // 2. Descobrir as Estações sob a jurisdição do Líder (Postos Base, Áreas e BÚSSOLA ANDON)
        let queryOps = supabase.from('operadores').select('id, nome_operador, posto_base_id, area_base_id, tag_rfid_operador').eq('status', 'Ativo');
        if (!isGlobal && filterString) queryOps = queryOps.or(filterString);
        
        const { data: teamOps } = await queryOps;
        const myOps = teamOps || [];
        
        // Obter os postos diretos e áreas
        const directStations = myOps.map(op => op.posto_base_id).filter(Boolean);
        const myAreas = Array.from(new Set(myOps.map(op => op.area_base_id).filter(Boolean)));
        
        let areaStations: string[] = [];
        if (myAreas.length > 0) {
             const { data: estData } = await supabase.from('estacoes').select('id').in('area_id', myAreas);
             if (estData) areaStations = estData.map(e => e.id);
        }

        // Adicionar a Bússola Diretiva de Responsabilidades
        let bussolaStationIds: string[] = [];
        if (!isGlobal && myUserId) {
            const { data: bData } = await supabase.from('estacoes').select('id')
                .or(`lider_t1_id.eq.${myUserId},supervisor_t1_id.eq.${myUserId},lider_t2_id.eq.${myUserId},supervisor_t2_id.eq.${myUserId},manutencao_id.eq.${myUserId},qualidade_id.eq.${myUserId},logistica_id.eq.${myUserId}`);
            if (bData) bussolaStationIds = bData.map(e => e.id);
        } else if (isGlobal) {
            const { data: bData } = await supabase.from('estacoes').select('id');
            if (bData) bussolaStationIds = bData.map(e => e.id);
        }

        const myStations = Array.from(new Set([...directStations, ...areaStations, ...bussolaStationIds]));
        const myRfids = Array.from(new Set(myOps.map(op => op.tag_rfid_operador).filter(Boolean)));

        // Se o lider nao tiver estacoes/equipa e nao for global, devolvemos tudo vazio
        if (!isGlobal && myStations.length === 0 && myOps.length === 0) {
            return { success: true, data: { andonsCausador: [], andonsVitima: [], ausentes: [], iluoRisco: [], acoesAtrasadas: [], cronogramaAtrasado: [], formacoesAtrasadas: [], baixaPerformance: [], userName: meuNome }};
        }

        // 3. ANDONS (Em Tempo Real - Não resolvidos)
        let andonsQuery = supabase
            .from('alertas_andon')
            .select('*, estacoes!estacao_id(nome_estacao), causadoras:estacoes!estacao_causadora(nome_estacao)')
            .eq('resolvido', false);

        if (!isGlobal) {
             if (myStations.length > 0) {
                 const inClause = `(${myStations.join(',')})`;
                 andonsQuery = andonsQuery.or(`estacao_causadora.in.${inClause},estacao_id.in.${inClause}`);
             } else {
                 andonsQuery = andonsQuery.eq('id', 'block-security');
             }
        }

        const { data: rawAndons } = await andonsQuery;

        const andonsCausador: any[] = [];
        const andonsVitima: any[] = [];

        if (rawAndons) {
            rawAndons.forEach(a => {
                const isCausador = isGlobal || myStations.includes(a.estacao_causadora);
                const isVitima = isGlobal || myStations.includes(a.estacao_id);

                if (isCausador) andonsCausador.push(a);
                else if (isVitima) andonsVitima.push(a);
            });
        }

        // 4. Headcount Absentismo Hoje
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
                if (op.tag_rfid_operador && !allRfidsPresentes.has(op.tag_rfid_operador)) {
                    ausentes.push(op);
                }
            });
        }

        // 5. ILUO Risco Crítico
        let iluoQuery = supabase.from('operador_iluo_matriz')
            .select('estacao_id, nivel_iluo, operador_id, estacoes!inner(nome_estacao)');
        
        if (!isGlobal && myStations.length > 0) {
            iluoQuery = iluoQuery.in('estacao_id', myStations);
        } else if (!isGlobal) {
            iluoQuery = iluoQuery.eq('estacao_id', 'block');
        }

        const { data: iluoData } = await iluoQuery;

        const estacaoIluoStats: Record<string, { nome: string, temO_ou_U: boolean, todos_I_ou_L: boolean }> = {};
        if (iluoData) {
            iluoData.forEach(i => {
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

        // 6. Ações Pendentes (lean_acoes)
        // Como o nome é digitado, vamos procurar usando LIKE pelo primeiro nome do lider
        let queryAcoes = supabase.from('lean_acoes').select('*').neq('status', 'concluido');
        if (!isGlobal) {
             const primeiroNome = meuNome.split(' ')[0];
             if (primeiroNome) {
                 queryAcoes = queryAcoes.ilike('responsavel_nome', `%${primeiroNome}%`);
             } else {
                 queryAcoes = queryAcoes.eq('id', 'block-security');
             }
        }
        const { data: acoesPendentes } = await queryAcoes;
        const acoesAtrasadas = (acoesPendentes || []).filter((a: any) => a.prazo && a.prazo < today);

        // 7. Auditorias 5S Atrasadas (lean_5s_cronograma)
        let cronogramaAtrasado = [];
        if (myStations.length > 0 || isGlobal || myUserId) {
             let query5s = supabase.from('lean_5s_cronograma').select('*, estacoes(nome_estacao)').eq('status', 'Pendente').lte('data_prevista', today);
             
             if (!isGlobal) {
                 if (myStations.length > 0) {
                     query5s = query5s.or(`estacao_id.in.(${myStations.join(',')}),auditor_id.eq.${myUserId}`);
                 } else {
                     query5s = query5s.eq('auditor_id', myUserId);
                 }
             }
             
             const { data: c5s } = await query5s;
             cronogramaAtrasado = c5s || [];
        }

        // --- 8. Formações a Vencer / Atrasadas (rh_planos_formacao) ---
        const myOpIds = myOps.map(o => o.id);
        let formacoesRaw: any[] = [];
        if (myOpIds.length > 0 || isGlobal) {
            let formQuery = supabase.from('rh_planos_formacao')
                .select('*, formando:operadores!formando_id(nome_operador), estacao:estacoes(nome_estacao)')
                .in('status', ['Planeado', 'Em Curso']);
            if (!isGlobal) formQuery = formQuery.in('formando_id', myOpIds);
            const { data } = await formQuery;
            formacoesRaw = data || [];
        }
        const formacoesAtrasadas = formacoesRaw.filter((f: any) => f.data_fim_estimada && f.data_fim_estimada < today);

        // --- 9. Piores Performances (avaliacoes_diarias) ---
        let avalRaw = null;
        if (myOpIds.length > 0 || isGlobal) {
            let avalQuery = supabase.from('avaliacoes_diarias')
                 .select('funcionario_id, data_avaliacao, nota_hst, nota_epi, nota_5s, nota_eficiencia, nota_objetivos, nota_atitude, nota_qualidade, operadores!inner(nome_operador)')
                 .order('data_avaliacao', { ascending: false });
            if (!isGlobal) avalQuery = avalQuery.in('funcionario_id', myOpIds);
            
            const res = await avalQuery;
            avalRaw = res.data;
        }

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
        
        // Ordenar por pior média e pegar os 3 piores
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

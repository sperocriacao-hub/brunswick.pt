import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Clock, Coffee, MapPin, Users, Filter, CalendarDays, ShieldAlert, Briefcase } from 'lucide-react';

import { cookies } from 'next/headers';
import { FactoryHeatmap, DB_AvaliacaoDiaria, DB_OperadorArea } from '@/components/rh/FactoryHeatmap';
import { TopPerformersMural } from '@/components/rh/TopPerformersMural';
import { MatrizNoveBox } from '@/components/rh/MatrizNoveBox';
import { ScorecardLideranca } from '@/components/rh/ScorecardLideranca';

export const dynamic = 'force-dynamic';

export default async function ProdutividadeLiderancaRH({ searchParams }: { searchParams: Promise<{ mes?: string, area?: string }> }) {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // ---- 1. LÓGICA DE AUTORIZAÇÃO E VISIBILIDADE HIERÁRQUICA ----
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div className="p-20 text-center font-bold text-red-500">Sessão Expirada / Não Autorizado</div>;

    let minLevel = 0; // 0 = nobody, 1 = Supervisor (sees Lider), 2 = Gestor (sees Supervisor, Lider), 3 = Admin (sees all)
    if (user.email === 'master@brunswick.pt') {
        minLevel = 3;
    } else {
        const { data: myData } = await supabase.from('operadores').select('funcao').eq('email_acesso', user.email).single();
        if (myData?.funcao === 'Gestor') minLevel = 2;
        else if (myData?.funcao === 'Supervisor') minLevel = 1;
    }

    if (minLevel === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-500">
                <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-900">Acesso Restrito</h1>
                <p className="text-slate-500 max-w-md mt-2">O seu cargo não possui valências hierárquicas para aceder ao mapa de produtividade das Lideranças.</p>
            </div>
        );
    }

    const SP = await searchParams;
    let currentMonthStr: string = SP.mes || "";
    const selectedArea = SP.area || 'Todas';

    if (!currentMonthStr) {
        // Auto-detect last month with data to prevent empty screens on month rollover
        const { data: lastEval } = await supabase.from('avaliacoes_lideranca').select('data_avaliacao').order('data_avaliacao', { ascending: false }).limit(1);
        if (lastEval && lastEval.length > 0 && lastEval[0].data_avaliacao) {
            currentMonthStr = lastEval[0].data_avaliacao.substring(0, 7);
        } else {
            currentMonthStr = new Date().toISOString().substring(0, 7);
        }
    }

    // 2. Fetch Todas as Áreas e Estações (Para a ComboBox)
    const { data: areasCatalog } = await supabase.from('areas_fabrica').select('id, nome_area').order('nome_area');
    const { data: estacoesCatalog } = await supabase.from('estacoes').select('id, nome_estacao, area_id').order('nome_estacao');

    let queryOps = supabase
        .from('operadores')
        .select(`
            id, tag_rfid_operador, nome_operador, funcao, status, area_base_id, posto_base_id, lider_nome, supervisor_nome, gestor_nome,
            areas_fabrica(id, nome_area),
            estacoes!operadores_posto_base_id_fkey(id, nome_estacao)
        `)
        .eq('status', 'Ativo');

    // Se NÃO for admin (minLevel < 3), restringir pesquisa aos próprios liderados diretos
    if (minLevel < 3) {
        const { data: myData } = await supabase.from('operadores').select('nome_operador').eq('email_acesso', user.email).single();
        if (myData?.nome_operador) {
            queryOps = queryOps.or(`lider_nome.eq."${myData.nome_operador}",supervisor_nome.eq."${myData.nome_operador}",gestor_nome.eq."${myData.nome_operador}"`);
        }
    }

    if (selectedArea !== 'Todas') {
        queryOps = queryOps.eq('area_base_id', selectedArea);
    }

    const { data: rawOperadores } = await queryOps;

    const LEADERSHIP_ROLES = ["Gestor", "Supervisor", "Coordenador de Grupo", "Líder de equipa", "Lider de equipa", "Manager"];
    
    const operadores = rawOperadores?.filter(op => LEADERSHIP_ROLES.includes(op.funcao)).map(op => ({
        ...op,
        area_nome: (op.areas_fabrica as any)?.nome_area || 'Geral',
        estacao_nome: (op.estacoes as any)?.nome_estacao || ''
    })) || [];

    // 4. Fetch Avaliações (Para Médias Base Culturais da 9-Box)
    const firstDayStr = `${currentMonthStr}-01`;
    const currentDate = new Date(`${currentMonthStr}-01T00:00:00Z`);
    const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const lastDayStr = new Date(nextMonthDate.getTime() - 1).toISOString().split('T')[0];

    const { data: avaliacoesMes } = await supabase
        .from('avaliacoes_lideranca')
        .select('*')
        .gte('data_avaliacao', firstDayStr)
        .lte('data_avaliacao', lastDayStr);

    // 5. Fetch Dados de Mentoria (Feedbacks Emitidos)
    const { data: rawAptsEmitted } = await supabase
        .from('apontamentos_negativos')
        .select('supervisor_nome, data_apontamento')
        .gte('data_apontamento', firstDayStr)
        .lte('data_apontamento', lastDayStr);

    // 6. Fetch Andons para Cálculo SLA e Gestão Tática
    const { data: rawAndons } = await supabase
        .from('alertas_andon')
        .select(`created_at, resolvido_at, resolvido, operador_rfid, estacoes!alertas_andon_estacao_id_fkey(area_id)`)
        .gte('created_at', `${firstDayStr}T00:00:00Z`)
        .lte('created_at', `${lastDayStr}T23:59:59Z`);

    // 7. Base de Operação (Tarefas e Pausas para OEE de Equipa)
    const { data: rawTarefas } = await supabase
        .from('registos_rfid_realtime')
        .select(`
            id, operador_rfid, timestamp_inicio, timestamp_fim, estacoes(nome_estacao, area_id)
        `)
        .gte('timestamp_inicio', `${firstDayStr}T00:00:00Z`)
        .lte('timestamp_inicio', `${lastDayStr}T23:59:59Z`);

    const { data: rawPausas } = await supabase
        .from('log_pausas_operador')
        .select(`
            id, operador_rfid, motivo, timestamp_inicio, timestamp_fim
        `)
        .gte('timestamp_inicio', `${firstDayStr}T00:00:00Z`)
        .lte('timestamp_inicio', `${lastDayStr}T23:59:59Z`);

    // Helper: Calc Minutes
    const diffMinutes = (inicio: string, fim: string | null) => {
        if (!inicio) return 0;
        const start = new Date(inicio).getTime();
        const end = fim ? new Date(fim).getTime() : new Date().getTime(); // Se não fechou, usa o Agora
        return Math.max(0, Math.floor((end - start) / 60000));
    };

    // Agregar Dados por Líder usando a Perspetiva Estratégica
    const statsOperador = operadores?.map(lider => {
        // Encontrar a Equipa do Líder
        let equipa = rawOperadores?.filter(op => op.lider_nome === lider.nome_operador || op.supervisor_nome === lider.nome_operador) || [];
        if (equipa.length === 0) {
            // Se nao tem direct reports explícitos, usar a área dele como fallback de influência
            equipa = rawOperadores?.filter(op => op.area_base_id === lider.area_base_id && !LEADERSHIP_ROLES.includes(op.funcao)) || [];
        }
        const rfidEquipa = new Set(equipa.map(e => e.tag_rfid_operador));

        // Calcular OEE Reflexo (OEE da Equipa)
        let totalVaEquipa = 0;
        let totalNvaEquipa = 0;
        
        rawTarefas?.forEach(t => {
            if (rfidEquipa.has(t.operador_rfid)) totalVaEquipa += diffMinutes(t.timestamp_inicio, t.timestamp_fim);
        });
        rawPausas?.forEach(p => {
            if (rfidEquipa.has(p.operador_rfid)) totalNvaEquipa += diffMinutes(p.timestamp_inicio, p.timestamp_fim);
        });
        
        const equipeTotalTime = totalVaEquipa + totalNvaEquipa;
        const equipaOee = equipeTotalTime > 0 ? (totalVaEquipa / equipeTotalTime) * 100 : 0;

        // Andons da Equipa (Causados/Levantados por membros da equipa do líder)
        const andonsDominio = rawAndons?.filter(a => a.operador_rfid && rfidEquipa.has(a.operador_rfid)) || [];
        const andonsResolvidos = andonsDominio.filter(a => a.resolvido && a.resolvido_at);
        let tempoTotalSla = 0;
        andonsResolvidos.forEach(a => {
            tempoTotalSla += diffMinutes(a.created_at, a.resolvido_at);
        });
        const mtrAndon = andonsResolvidos.length > 0 ? Math.round(tempoTotalSla / andonsResolvidos.length) : 0;
        const taxaResAndon = andonsDominio.length > 0 ? (andonsResolvidos.length / andonsDominio.length) * 100 : 0;

        // Índice de Mentoria (Feedbacks + Avaliações Liderança)
        const myAvs = avaliacoesMes?.filter(a => a.supervisor_nome === lider.nome_operador) || [];
        const myApts = rawAptsEmitted?.filter(a => a.supervisor_nome === lider.nome_operador) || [];
        const mentorshipCount = myAvs.length + myApts.length;

        // Cultura Score (Média da própria avaliação de Liderança dele - Atitude + Gestão + Melhoria)
        const hisAssessments = avaliacoesMes?.filter(a => a.funcionario_id === lider.id) || [];
        let suaCulturaScore = 0;
        if (hisAssessments.length > 0) {
            const lastAv = hisAssessments[hisAssessments.length - 1]; // Assume latest
            suaCulturaScore = ((lastAv.nota_atitude || 3) + (lastAv.nota_gestao_motivacao || 3) + (lastAv.nota_cultura || 3)) / 3;
        } else {
            suaCulturaScore = 3.0; // Default Standard
        }

        return {
            ...lider,
            totalTrabalhoEfetivo: totalVaEquipa, // Re-aproveitado para manter a Props original de widgets legados se necessário
            equipaOee,
            mtrAndon,
            taxaResAndon,
            mentorshipCount,
            suaCulturaScore,
            equipaTamanho: equipa.length
        };
    }).sort((a, b) => b.equipaOee - a.equipaOee) || [];

    // Macro KPIs Estratégicos
    const overallVa = statsOperador.reduce((sum, curr) => sum + curr.totalTrabalhoEfetivo, 0); // Para mural fallback
    
    // SLA Global de Fábrica
    const globalAndons = rawAndons?.filter(a => a.resolvido && a.resolvido_at) || [];
    let globalGteAndonSla = 0;
    globalAndons.forEach(a => globalGteAndonSla += diffMinutes(a.created_at, a.resolvido_at));
    const mediaGlobalSla = globalAndons.length > 0 ? Math.round(globalGteAndonSla / globalAndons.length) : 0;
    
    const mediaGlobalMentoria = statsOperador.length > 0 ? (statsOperador.reduce((sum, curr) => sum + curr.mentorshipCount, 0)) : 0;
    const mediaGlobalOeeEquipas = statsOperador.length > 0 ? (statsOperador.reduce((sum, curr) => sum + curr.equipaOee, 0) / statsOperador.length) : 0;

    // Gerador Array Meses Formulario
    const ultimosMeses = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        ultimosMeses.push({
            value: d.toISOString().substring(0, 7),
            label: d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }).toUpperCase()
        });
    }

    // Build data for 9-Box
    const noveBoxData = statsOperador.map(lider => ({
        nome: lider.nome_operador,
        equipaOee: lider.equipaOee,
        mentoriaScore: lider.suaCulturaScore,
        andonMins: lider.mtrAndon
    }));

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in zoom-in duration-500 max-w-[1600px] mx-auto">
            {/* Cabeçalho Liderança M.E.S */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-200 pb-6 bg-indigo-50/30 p-4 rounded-xl">
                <div>
                    <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight mb-2 flex items-center gap-3">
                        <Briefcase className="text-indigo-600" size={32} />
                        Feedback Produtividade Liderança
                    </h1>
                    <p className="text-indigo-600/70 font-medium text-sm flex items-center gap-2">
                        <ShieldAlert size={16} /> Painel de Mentoria Estratégica e Risco. Métrica Avalia Reflexo nas Equipas.
                    </p>
                </div>

                <form className="flex items-center gap-3 bg-white p-2 rounded-lg border border-indigo-100 shadow-sm" method="GET">
                    <div className="flex items-center gap-2 px-2 border-r border-indigo-100">
                        <Filter size={16} className="text-indigo-300" />
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest hidden md:inline">Filtros</span>
                    </div>

                    <div className="relative">
                        <select name="mes" defaultValue={currentMonthStr} className="pl-9 pr-8 py-2 w-[180px] bg-indigo-50 border border-indigo-200 rounded-md text-sm font-semibold text-indigo-900 shadow-sm focus:ring-2 focus:ring-indigo-500 appearance-none">
                            {ultimosMeses.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" />
                    </div>

                    <div className="relative">
                        <select name="area" defaultValue={selectedArea} className="pl-9 pr-6 py-2 w-[160px] bg-indigo-50 border border-indigo-200 rounded-md text-sm font-semibold text-indigo-900 shadow-sm focus:ring-2 focus:ring-indigo-500 appearance-none">
                            <option value="Todas">Todas as Áreas</option>
                            {areasCatalog?.map(a => (
                                <option key={a.id} value={a.id}>{a.nome_area}</option>
                            ))}
                        </select>
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" />
                    </div>

                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">
                        Aplicar
                    </button>
                </form>
            </div>

            {/* Macro KPIs Estratégicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border hover:border-indigo-200 transition-colors shadow-sm">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-slate-500 text-[10px] font-bold tracking-widest uppercase flex items-center justify-between">
                            <span>SLA Resol. Andon (Médio)</span>
                            <ShieldAlert size={14} className="text-amber-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-800">{mediaGlobalSla}</span>
                            <span className="text-sm text-slate-500 font-bold">MIN</span>
                        </div>
                        <p className="text-slate-500 font-medium text-xs mt-1 border-t border-slate-100 pt-2">
                            Tempo médio das Chefias a acalmar Anomalias.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border hover:border-indigo-200 transition-colors shadow-sm">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-slate-500 text-[10px] font-bold tracking-widest uppercase flex items-center justify-between">
                            <span>OEE Médio (Equipas Base)</span>
                            <Activity size={14} className="text-indigo-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-extrabold text-indigo-600">{mediaGlobalOeeEquipas.toFixed(1)}%</div>
                        <p className="text-slate-500 font-medium text-xs mt-1 border-t border-slate-100 pt-2">
                            Rendimento Reflexo da Liderança.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border hover:border-indigo-200 transition-colors shadow-sm">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-slate-500 text-[10px] font-bold tracking-widest uppercase flex items-center justify-between">
                            <span>Volume Mentoria</span>
                            <Users size={14} className="text-emerald-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-extrabold text-emerald-600">{mediaGlobalMentoria} <span className="text-lg text-emerald-400">Atos</span></div>
                        <p className="text-slate-500 font-medium text-xs mt-1 border-t border-slate-100 pt-2">
                            Feedbacks pedagógicos emitidos aos Operários.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border hover:border-indigo-200 transition-colors shadow-sm">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-slate-500 text-[10px] font-bold tracking-widest uppercase flex items-center justify-between">
                            <span>Média de Operários Dir.</span>
                            <MapPin size={14} className="text-blue-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-extrabold text-blue-600">
                            {statsOperador.length > 0 ? Math.round(statsOperador.reduce((sum, cur) => sum + cur.equipaTamanho, 0) / statsOperador.length) : 0}
                        </div>
                        <p className="text-slate-500 font-medium text-xs mt-1 border-t border-slate-100 pt-2">
                            Dimensão do Squad por cada Líder Ativo.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-8 mb-8 mt-6">
                <div className="w-full">
                    <MatrizNoveBox data={noveBoxData} />
                </div>
                <div className="w-full">
                    <TopPerformersMural
                        operadores={(operadores as unknown as DB_OperadorArea[])}
                        avaliacoes={(avaliacoesMes as unknown as DB_AvaliacaoDiaria[]) || []}
                        groupBy="funcao"
                    />
                </div>
            </div>

            {/* Painel Central das Tabelas Mentoria RH */}
            <ScorecardLideranca statsOperador={statsOperador} isLeader={true} />
        </div>
    );
}

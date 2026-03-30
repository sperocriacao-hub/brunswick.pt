import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Clock, Coffee, MapPin, Users, Filter, CalendarDays, ShieldAlert, Briefcase } from 'lucide-react';

import { cookies } from 'next/headers';
import { FactoryHeatmap, DB_AvaliacaoDiaria, DB_OperadorArea } from '@/components/rh/FactoryHeatmap';
import { TopPerformersMural } from '@/components/rh/TopPerformersMural';
import { ProdutividadeTable } from '@/components/rh/ProdutividadeTable';

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
    const currentMonthStr = SP.mes || new Date().toISOString().substring(0, 7); // yyyy-MM
    const selectedArea = SP.area || 'Todas';

    // 2. Fetch Todas as Áreas (Para a ComboBox)
    const { data: areasCatalog } = await supabase.from('areas_fabrica').select('id, nome_area').order('nome_area');

    let queryOps = supabase
        .from('operadores')
        .select(`
            id, tag_rfid_operador, nome_operador, funcao, status, area_base_id,
            areas_fabrica(id, nome_area)
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

    const operadores = rawOperadores?.map(op => ({
        ...op,
        area_nome: (op.areas_fabrica as any)?.nome_area || 'Geral'
    })) || [];

    // 4. Fetch Avaliações Diárias do Mês Corrente (Para Heatmap e Top 3)
    const firstDayStr = `${currentMonthStr}-01`;
    // Add 1 to month, handle year rollover, subtract 1 ms to get last day of current month
    const currentDate = new Date(`${currentMonthStr}-01T00:00:00Z`);
    const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const lastDayStr = new Date(nextMonthDate.getTime() - 1).toISOString().split('T')[0];

    const { data: avaliacoesMes } = await supabase
        .from('avaliacoes_lideranca')
        .select('*')
        .gte('data_avaliacao', firstDayStr)
        .lte('data_avaliacao', lastDayStr);

    // 5. Fetch Tarefas (Value Added Time) do mês
    const { data: rawTarefas } = await supabase
        .from('registos_rfid_realtime')
        .select(`
            id, operador_rfid, timestamp_inicio, timestamp_fim, estacoes(nome_estacao)
        `)
        .gte('timestamp_inicio', `${firstDayStr}T00:00:00Z`)
        .lte('timestamp_inicio', `${lastDayStr}T23:59:59Z`);

    // 6. Fetch Pausas (Non-Value Added Time) do mês
    const { data: rawPausas } = await supabase
        .from('log_pausas_operador')
        .select(`
            id, operador_rfid, motivo, timestamp_inicio, timestamp_fim
        `)
        .gte('timestamp_inicio', `${firstDayStr}T00:00:00Z`)
        .lte('timestamp_inicio', `${lastDayStr}T23:59:59Z`);

    // 7. Fetch Pontos (Assiduidade Bruta) do mês
    const { data: rawPontos } = await supabase
        .from('log_ponto_diario')
        .select('*')
        .gte('timestamp', `${firstDayStr}T00:00:00Z`)
        .lte('timestamp', `${lastDayStr}T23:59:59Z`);

    // Helper: Calc Minutes
    const diffMinutes = (inicio: string, fim: string | null) => {
        if (!inicio) return 0;
        const start = new Date(inicio).getTime();
        const end = fim ? new Date(fim).getTime() : new Date().getTime(); // Se não fechou, usa o Agora
        return Math.max(0, Math.floor((end - start) / 60000));
    };

    // Agregar Dados por Lider
    const statsOperador = operadores?.map(op => {
        const suasTarefas = rawTarefas?.filter(t => t.operador_rfid === op.tag_rfid_operador) || [];
        const suasPausas = rawPausas?.filter(p => p.operador_rfid === op.tag_rfid_operador) || [];

        const myStarts = rawPontos?.filter(p => p.operador_rfid === op.tag_rfid_operador && p.tipo_registo === 'ENTRADA') || [];
        const diasPresentes = new Set(myStarts.map(p => p.timestamp.substring(0, 10))).size;

        let totalTrabalhoEfetivo = 0; // OEE Value Added (Minutos Tarefas)
        suasTarefas.forEach(t => {
            totalTrabalhoEfetivo += diffMinutes(t.timestamp_inicio, t.timestamp_fim);
        });

        let totalPausas = 0; // OEE NVA (Minutos em WC, Medico, etc)
        suasPausas.forEach(p => {
            totalPausas += diffMinutes(p.timestamp_inicio, p.timestamp_fim);
        });

        // Contagem de Movimentos Geográficos
        const estacoesVistas = new Set(suasTarefas.map(t => (t.estacoes as any)?.nome_estacao));
        const numEstacoesDiferentes = estacoesVistas.size;

        const totalTrackedTime = totalTrabalhoEfetivo + totalPausas;
        const valueRation = totalTrackedTime > 0 ? (totalTrabalhoEfetivo / totalTrackedTime) * 100 : 0;

        return {
            ...op,
            diasPresentes,
            totalTrabalhoEfetivo,
            totalPausas,
            numEstacoesDiferentes,
            valueRation
        };
    }).sort((a, b) => b.totalTrabalhoEfetivo - a.totalTrabalhoEfetivo) || [];

    // Totais Globais OEE das Lideranças
    const kpiVABruto = statsOperador.reduce((acc, curr) => acc + curr.totalTrabalhoEfetivo, 0);
    const kpiNVABruto = statsOperador.reduce((acc, curr) => acc + curr.totalPausas, 0);
    const taxaProdutividade = kpiVABruto + kpiNVABruto > 0 ? (kpiVABruto / (kpiVABruto + kpiNVABruto)) * 100 : 0;

    // Totais Globais Assiduidade (Contados sob as lideranças scope "selectedArea" (se filtrado))
    const expectedWorkers = statsOperador.length;
    const presentWorkers = statsOperador.reduce((sum, w) => sum + (w.diasPresentes > 0 ? 1 : 0), 0);
    const turnoverFabricaHoje = kpiVABruto + kpiNVABruto;
    const absenteismRate = (expectedWorkers > 0 && (presentWorkers > 0 || turnoverFabricaHoje > 0))
        ? ((expectedWorkers - presentWorkers) / expectedWorkers) * 100
        : 0;

    // Gerador Array Meses Formulario (Ultimos 6 Meses)
    const ultimosMeses = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        ultimosMeses.push({
            value: d.toISOString().substring(0, 7),
            label: d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }).toUpperCase()
        });
    }

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
                        <Clock size={16} /> Visão Exclusiva para Chefias.
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

            {/* Macro KPIs - Expandida 4 Columns c/ Absentismo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border hover:border-indigo-200 transition-colors shadow-sm">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-slate-500 text-[10px] font-bold tracking-widest uppercase flex items-center justify-between">
                            <span>Absenteísmo (Lideranças)</span>
                            <Users size={14} className="text-red-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-800">{absenteismRate.toFixed(1)}%</span>
                        </div>
                        <p className="text-slate-500 font-medium text-xs mt-1 border-t border-slate-100 pt-2">
                            Líderes Ausentes Hoje: <strong className="text-red-500">{expectedWorkers - presentWorkers}</strong> de {expectedWorkers}.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border hover:border-indigo-200 transition-colors shadow-sm">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-slate-500 text-[10px] font-bold tracking-widest uppercase flex items-center justify-between">
                            <span>OEE (Value-Added)</span>
                            <Activity size={14} className="text-indigo-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-extrabold text-indigo-600">{taxaProdutividade.toFixed(1)}%</div>
                        <p className="text-slate-500 font-medium text-xs mt-1 border-t border-slate-100 pt-2">
                            {kpiVABruto} Min Tarefas na Linha Montagem.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border hover:border-indigo-200 transition-colors shadow-sm">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-slate-500 text-[10px] font-bold tracking-widest uppercase flex items-center justify-between">
                            <span>Tempo NVA (Desperdício)</span>
                            <Coffee size={14} className="text-rose-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-extrabold text-rose-600">{kpiNVABruto} <span className="text-lg text-rose-400">min</span></div>
                        <p className="text-slate-500 font-medium text-xs mt-1 border-t border-slate-100 pt-2">
                            Acumulado em Pausas Sistémicas.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border hover:border-indigo-200 transition-colors shadow-sm">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-slate-500 text-[10px] font-bold tracking-widest uppercase flex items-center justify-between">
                            <span>Saltos Nomadas</span>
                            <MapPin size={14} className="text-emerald-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-extrabold text-emerald-600">
                            {expectedWorkers > 0 ? (statsOperador.reduce((sum, curr) => sum + curr.numEstacoesDiferentes, 0) / expectedWorkers).toFixed(1) : 0}
                        </div>
                        <p className="text-slate-500 font-medium text-xs mt-1 border-t border-slate-100 pt-2">
                            Média de Postos Apoiados por Liderança.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top 3 Performers do Mês */}
            <TopPerformersMural
                operadores={(operadores as unknown as DB_OperadorArea[])}
                avaliacoes={(avaliacoesMes as unknown as DB_AvaliacaoDiaria[]) || []}
            />

            {/* Mapa Longitudinal de Calor (Factory Heatmap) */}
            <div className="mt-8 mb-8">
                <FactoryHeatmap
                    avaliacoes={(avaliacoesMes as unknown as DB_AvaliacaoDiaria[]) || []}
                    operadores={(operadores as unknown as DB_OperadorArea[])}
                />
            </div>

            {/* Painel Central das Tabelas OEE RH */}
            <ProdutividadeTable statsOperador={statsOperador} mesIso={currentMonthStr} />
        </div>
    );
}

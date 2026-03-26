'use client';

import React, { useEffect, useState } from 'react';
import { getAndonHistory, fecharAlertaAndon } from './actions';
import { getTVConfigs } from '../../configuracoes/tvs/actions';
import { AlertCircle, Clock, CheckCircle2, Factory, Hammer, Tv, Filter, BarChart2, ListTodo, Activity, Timer } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, differenceInMinutes } from 'date-fns';
import Link from 'next/link';

export default function AndonDashPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [alertas, setAlertas] = useState<any[]>([]);
    const [tvLinks, setTvLinks] = useState<any[]>([]);
    
    // UI State
    const [activeTab, setActiveTab] = useState<'historic' | 'kpis'>('historic');

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterProblema, setFilterProblema] = useState<string>('all');
    const [filterCausadora, setFilterCausadora] = useState<string>('all');
    const [filterDate, setFilterDate] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        const [res, tvsRes] = await Promise.all([getAndonHistory(), getTVConfigs()]);

        if (res.success) {
            setAlertas(res.data || []);
        }
        if (tvsRes.success) {
            setTvLinks(tvsRes.data || []);
        }
        setIsLoading(false);
    }

    async function handleResolver(id: string) {
        if (!window.confirm("Confirmar que este problema na Estação foi superado e a produção retomou?")) return;
        setIsLoading(true);
        await fecharAlertaAndon(id);
        await loadData();
    }

    const calcularTempoPerdido = (start: string, end: string | null) => {
        if (!end) {
            const minutes = differenceInMinutes(new Date(), new Date(start));
            return `${minutes} min`;
        }
        return `${differenceInMinutes(new Date(end), new Date(start))} min`;
    };

    // Calculate unique stations for filter dropdowns
    const uniqueEstacoesProblema = Array.from(new Set(alertas.map(a => a.local_ocorrencia_id))).filter(Boolean);
    const uniqueEstacoesCausadora = Array.from(new Set(alertas.map(a => a.estacao_id))).filter(Boolean);
    
    function getStationName(id: string, type: 'problema' | 'causadora') {
        const al = alertas.find(a => type === 'problema' ? a.local_ocorrencia_id === id : a.estacao_id === id);
        if (!al) return id;
        return type === 'problema' 
            ? (al.estacao_problema?.nome_estacao || 'Desconhecida') 
            : (al.estacao_causadora?.nome_estacao || 'Desconhecida');
    }

    // Apply Filters
    const filteredAlertas = alertas.filter(al => {
        if (filterStatus === 'em_alerta' && al.resolvido) return false;
        if (filterStatus === 'solucionado' && !al.resolvido) return false;
        if (filterProblema !== 'all' && al.local_ocorrencia_id !== filterProblema) return false;
        if (filterCausadora !== 'all' && al.estacao_id !== filterCausadora) return false;
        if (filterDate) {
            const alDate = new Date(al.created_at).toISOString().split('T')[0];
            if (alDate !== filterDate) return false;
        }
        return true;
    });

    // KPI Calculations
    const totalOcorrencias = filteredAlertas.length;
    const resolvidos = filteredAlertas.filter(a => a.resolvido).length;
    const emAberto = totalOcorrencias - resolvidos;

    let totalMinutosPerdidos = 0;
    filteredAlertas.forEach(a => {
        const start = new Date(a.created_at);
        const end = a.resolvido_at ? new Date(a.resolvido_at) : new Date();
        totalMinutosPerdidos += differenceInMinutes(end, start);
    });

    const mttr = resolvidos > 0 ? Math.round(totalMinutosPerdidos / resolvidos) : 0;

    const causadorasCount: Record<string, number> = {};
    filteredAlertas.forEach(a => {
        const nome = a.estacao_causadora?.nome_estacao || 'Desconhecida';
        causadorasCount[nome] = (causadorasCount[nome] || 0) + 1;
    });
    const topCausadoras = Object.entries(causadorasCount).sort((a,b) => b[1] - a[1]).slice(0,5);

    return (
        <div className="p-8 pb-32 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <AlertCircle className="text-red-500" size={36} />
                        Gestão Pós-Venda Fabril (Andon & KPIs)
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Monitorize a saúde da linha de produção e analise tempos perdidos de OEE.
                    </p>
                </div>

                <Card className="bg-slate-900 border-slate-800 text-white shadow-xl max-w-sm w-full shrink-0">
                    <CardHeader className="py-3 px-4 bg-slate-950/50 border-b border-slate-800">
                        <CardTitle className="text-sm font-bold tracking-widest uppercase flex items-center gap-2 text-slate-300">
                            <Tv size={16} className="text-blue-400" /> Acesso a Ecrãs TV
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                        <div className="flex flex-wrap gap-2">
                            {tvLinks.length === 0 ? (
                                <span className="text-xs text-slate-500 p-2">Nenhum ecrã configurado.</span>
                            ) : (
                                tvLinks.map(tv => (
                                    <Link key={tv.id} href={`/tv/live/${tv.id}`} target="_blank">
                                        <Button variant="secondary" size="sm" className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs">
                                            {tv.nome_tv}
                                        </Button>
                                    </Link>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </header>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
                <button 
                    onClick={() => setActiveTab('historic')}
                    className={`px-4 py-2 font-bold text-sm rounded-md transition-all flex items-center gap-2 ${activeTab === 'historic' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ListTodo size={16} /> Histórico Andon
                </button>
                <button 
                    onClick={() => setActiveTab('kpis')}
                    className={`px-4 py-2 font-bold text-sm rounded-md transition-all flex items-center gap-2 ${activeTab === 'kpis' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <BarChart2 size={16} /> KPIs & Estatísticas
                </button>
            </div>

            {activeTab === 'historic' && (
                <Card className="shadow-xl border-slate-200">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-slate-400" />
                            <span className="font-bold text-slate-600 text-sm uppercase tracking-wider">Filtros Avançados</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <input 
                                type="date" 
                                value={filterDate} 
                                onChange={e => setFilterDate(e.target.value)}
                                className="border border-slate-300 rounded-md px-3 py-1.5 focus:border-blue-500 focus:outline-none"
                            />
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 focus:border-blue-500 focus:outline-none">
                                <option value="all">Todos Estados</option>
                                <option value="em_alerta">Em Alerta</option>
                                <option value="solucionado">Solucionados</option>
                            </select>
                            <select value={filterProblema} onChange={e => setFilterProblema(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 focus:border-blue-500 focus:outline-none max-w-[150px] truncate">
                                <option value="all">Qualquer Estação Problema</option>
                                {uniqueEstacoesProblema.map(id => (
                                    <option key={id as string} value={id as string}>{getStationName(id as string, 'problema')}</option>
                                ))}
                            </select>
                            <select value={filterCausadora} onChange={e => setFilterCausadora(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 focus:border-blue-500 focus:outline-none max-w-[150px] truncate">
                                <option value="all">Qualquer Estação Causadora</option>
                                {uniqueEstacoesCausadora.map(id => (
                                    <option key={id as string} value={id as string}>{getStationName(id as string, 'causadora')}</option>
                                ))}
                            </select>
                            <Button variant="outline" size="sm" onClick={() => {
                                setFilterDate(''); setFilterStatus('all'); setFilterProblema('all'); setFilterCausadora('all'); loadData();
                            }}>Reset</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            {/* Layout apertado para caber sem scroll */}
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">
                                    <tr>
                                        <th className="px-4 py-3">Início</th>
                                        <th className="px-4 py-3">Estado</th>
                                        <th className="px-4 py-3 text-center">T. Perd.</th>
                                        <th className="px-4 py-3">Onde (Problema)</th>
                                        <th className="px-4 py-3">Alvo (Causadora)</th>
                                        <th className="px-4 py-3 min-w-[200px]">Contexto OP / Motivo</th>
                                        <th className="px-4 py-3 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {isLoading ? (
                                        <tr><td colSpan={7} className="text-center p-8 text-slate-400">A carregar métricas...</td></tr>
                                    ) : filteredAlertas.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center p-8 text-slate-400">Nenhum incidente corresponde aos filtros.</td></tr>
                                    ) : (
                                        filteredAlertas.map((al) => (
                                            <tr key={al.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                                                    {format(new Date(al.created_at), 'dd/MM HH:mm')}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {al.resolvido ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                                            <CheckCircle2 size={12} /> OK
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold bg-red-100 text-red-700 animate-pulse">
                                                            <AlertCircle size={12} /> ON
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center font-mono font-bold text-xs whitespace-nowrap">
                                                    <span className={al.resolvido ? "text-slate-500" : "text-red-500"}>
                                                        {calcularTempoPerdido(al.created_at, al.resolvido_at)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-slate-700 text-xs line-clamp-2">{al.estacao_problema?.nome_estacao || 'N/A'}</div>
                                                    <div className="text-[10px] text-slate-400 truncate">{al.estacao_problema?.areas_fabrica?.nome_area}</div>
                                                </td>
                                                <td className="px-4 py-3 flex items-center gap-2">
                                                    <div className="bg-slate-100 px-2 py-1.5 rounded border border-slate-200">
                                                        <div className="font-bold text-red-700 text-xs line-clamp-2 leading-tight">{al.estacao_causadora?.nome_estacao || 'N/A'}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-indigo-600 text-[11px] whitespace-nowrap">
                                                        {al.ordens_producao ? `${al.ordens_producao.hin_hull_id || al.ordens_producao.op_numero}` : 'Genérico'} 
                                                        <span className="text-slate-800 ml-1"> - {al.tipo_alerta}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mt-1 italic truncate max-w-[200px]" title={al.descricao_alerta}>{al.descricao_alerta || 'Sem notas'}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {!al.resolvido && (
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            className="h-8 w-8 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                                                            onClick={() => handleResolver(al.id)}
                                                            title="Resolver Paragem"
                                                        >
                                                            <Hammer size={14} />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'kpis' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={16} className="text-blue-500" /> Total Ocorrências
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-slate-800">{totalOcorrencias}</div>
                            <p className="text-xs text-slate-400 mt-1">No período selecionado</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Timer size={16} className="text-amber-500" /> T. Médio Resolução (MTTR)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-slate-800">{mttr} <span className="text-lg text-slate-400">min</span></div>
                            <p className="text-xs text-slate-400 mt-1">Tempo médio de resposta</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={16} className="text-red-500" /> Tempo Total Perdido
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-slate-800">{Math.floor(totalMinutosPerdidos / 60)}<span className="text-lg text-slate-400">h</span> {totalMinutosPerdidos % 60}<span className="text-lg text-slate-400">m</span></div>
                            <p className="text-xs text-slate-400 mt-1">Impacto direto no OEE</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-500" /> Taxa de Resolução
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-slate-800">
                                {totalOcorrencias > 0 ? Math.round((resolvidos / totalOcorrencias) * 100) : 0}<span className="text-lg text-slate-400">%</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 font-bold">{emAberto} em aberto agora</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm md:col-span-2 lg:col-span-4 mt-2">
                        <CardHeader>
                            <CardTitle className="text-slate-800 flex items-center gap-2">
                                <AlertCircle size={20} className="text-red-500" /> Top 5 Causadoras Frequentes (Análise de Gargalos)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topCausadoras.length === 0 ? (
                                <p className="text-slate-400 py-4 text-center">Nenhum dado para analisar com base nos filtros.</p>
                            ) : (
                                <div className="space-y-4">
                                    {topCausadoras.map(([nome, count], idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-bold text-slate-700 text-sm">{nome}</span>
                                                    <span className="font-bold text-red-600 text-sm">{count} ocorrências</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-2">
                                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(count / topCausadoras[0][1]) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

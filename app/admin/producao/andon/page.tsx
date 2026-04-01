'use client';

import React, { useEffect, useState } from 'react';
import { getAndonHistory, fecharAlertaAndon, clonarAlertaAndon, getLoggedOperadorRfid } from './actions';
import { getTVConfigs } from '../../configuracoes/tvs/actions';
import { AlertCircle, Clock, CheckCircle2, Factory, Hammer, Tv, Filter, BarChart2, ListTodo, Activity, Timer, AlertTriangle, TrendingDown, TrendingUp, Trophy, ShieldCheck, Ship } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, differenceInMinutes, subMonths } from 'date-fns';
import Link from 'next/link';
import { buscarEstacoes, dispararAlertaAndon } from '@/app/operador/actions';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from 'recharts';

export default function AndonDashPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [alertas, setAlertas] = useState<any[]>([]);
    const [tvLinks, setTvLinks] = useState<any[]>([]);
    
    // UI State
    const [activeTab, setActiveTab] = useState<'historic' | 'kpis'>('historic');
    const [loggedRfid, setLoggedRfid] = useState<string>('BACKOFFICE_MASTER');

    // Filters (Historic)
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterProblema, setFilterProblema] = useState<string>('all');
    const [filterCausadora, setFilterCausadora] = useState<string>('all');
    const [filterDate, setFilterDate] = useState<string>('');

    // Filters (KPIs)
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
    const [selectedArea, setSelectedArea] = useState<string>('all');

    // ANDON Help Modal State
    const [estacoes, setEstacoes] = useState<any[]>([]);
    const [isAndonModalOpen, setIsAndonModalOpen] = useState(false);
    const [andonType, setAndonType] = useState('Ajuste técnico');
    const [andonDesc, setAndonDesc] = useState('');
    const [causadoraEstacaoId, setCausadoraEstacaoId] = useState('');
    const [localOcorrenciaId, setLocalOcorrenciaId] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        const [res, tvsRes, estsRes, rfidRes] = await Promise.all([getAndonHistory(), getTVConfigs(), buscarEstacoes(), getLoggedOperadorRfid()]);

        if (res.success) {
            setAlertas(res.data || []);
        }
        if (tvsRes.success) {
            setTvLinks(tvsRes.data || []);
        }
        if (estsRes?.success) {
            setEstacoes(estsRes.estacoes || []);
        }
        if (rfidRes) {
            setLoggedRfid(rfidRes);
        }
        setIsLoading(false);
    }

    const confirmAndonFire = async () => {
        if (!localOcorrenciaId || !causadoraEstacaoId) {
            alert("ATENÇÃO: É obrigatório selecionar o Local da Ocorrência e a Estação Causadora.");
            return;
        }
        setIsAndonModalOpen(false);
        const res = await dispararAlertaAndon(causadoraEstacaoId, loggedRfid, undefined, andonType, andonDesc, localOcorrenciaId);

        if (res.success) {
            alert("🚨 Alerta Andon disparado com sucesso!");
            loadData(); // Recarrega logo o front para aparecer na tabela
            setAndonDesc('');
        } else {
            alert("Erro ao disparar alerta: " + res.error);
        }
    };

    async function handleResolver(id: string) {
        if (!window.confirm("Confirmar que este problema na Estação foi superado e a produção retomou?")) return;
        setIsLoading(true);
        await fecharAlertaAndon(id);
        await loadData();
    }

    async function handleClonar(id: string) {
        if (!window.confirm("Pretende reportar a REINCIDÊNCIA deste alarme? Será criado um novo ticket com um novo cronómetro para manter a precisão do OEE.")) return;
        setIsLoading(true);
        const res = await clonarAlertaAndon(id, loggedRfid);
        if (res.success) {
            alert("🚨 Reincidência registada com sucesso!");
        } else {
            alert("Erro ao clonar alerta: " + res.error);
        }
        await loadData();
    }

    const calcularTempoPerdido = (start: string, end: string | null) => {
        if (!end) {
            const minutes = differenceInMinutes(new Date(), new Date(start));
            return `${minutes} min`;
        }
        return `${differenceInMinutes(new Date(end), new Date(start))} min`;
    };

    // Calculate unique AREAS for filter dropdowns
    const mapAreasProblema = new Map<string, string>();
    const mapAreasCausadora = new Map<string, string>();
    alertas.forEach(a => {
        if (a.estacao_problema?.areas_fabrica) {
            mapAreasProblema.set(a.estacao_problema.areas_fabrica.id, a.estacao_problema.areas_fabrica.nome_area);
        }
        if (a.estacao_causadora?.areas_fabrica) {
            mapAreasCausadora.set(a.estacao_causadora.areas_fabrica.id, a.estacao_causadora.areas_fabrica.nome_area);
        }
    });

    const uniqueAreasProblema = Array.from(mapAreasProblema.entries()).map(([id, nome]) => ({id, nome}));
    const uniqueAreasCausadora = Array.from(mapAreasCausadora.entries()).map(([id, nome]) => ({id, nome}));

    // Apply Filters
    const filteredAlertas = alertas.filter(al => {
        if (filterStatus === 'em_alerta' && al.resolvido) return false;
        if (filterStatus === 'solucionado' && !al.resolvido) return false;
        if (filterProblema !== 'all' && al.estacao_problema?.areas_fabrica?.id !== filterProblema) return false;
        if (filterCausadora !== 'all' && al.estacao_causadora?.areas_fabrica?.id !== filterCausadora) return false;
        if (filterDate) {
            const alDate = new Date(al.created_at).toISOString().split('T')[0];
            if (alDate !== filterDate) return false;
        }
        return true;
    });

    // KPI Calculations (Filtered by Global Area Picker)
    const kpisFilteredByArea = alertas.filter(a => {
        if (selectedArea !== 'all' && a.estacao_causadora?.areas_fabrica?.id !== selectedArea) return false;
        return true;
    });

    // Sub-filter for Current Month Selection
    const kpisCurrentMonth = kpisFilteredByArea.filter(a => {
        const alMonth = format(new Date(a.created_at), 'yyyy-MM');
        return alMonth === selectedMonth;
    });

    // Key Base KPIs (based on filtered month + area)
    const totalOcorrencias = kpisCurrentMonth.length;
    const resolvidos = kpisCurrentMonth.filter(a => a.resolvido).length;
    const emAberto = totalOcorrencias - resolvidos;

    let totalMinutosPerdidos = 0;
    kpisCurrentMonth.forEach(a => {
        const start = new Date(a.created_at);
        const end = a.resolvido_at ? new Date(a.resolvido_at) : new Date();
        totalMinutosPerdidos += differenceInMinutes(end, start);
    });

    const mttr = resolvidos > 0 ? Math.round(totalMinutosPerdidos / resolvidos) : 0;

    // Takt Time UI removed upon request (keep pure total time)

    const mttrPorArea: Record<string, { resolvidos: number, minutos: number }> = {};
    const causadorasPerdaCount: Record<string, number> = {};
    const heatmapAreasCount: Record<string, number> = {};

    kpisCurrentMonth.forEach(a => {
        const areaName = a.estacao_causadora?.areas_fabrica?.nome_area || 'Desconhecida';
        heatmapAreasCount[areaName] = (heatmapAreasCount[areaName] || 0) + 1;

        const loss = differenceInMinutes(a.resolvido_at ? new Date(a.resolvido_at) : new Date(), new Date(a.created_at));
        causadorasPerdaCount[areaName] = (causadorasPerdaCount[areaName] || 0) + loss;

        if (a.resolvido && a.resolvido_at) {
            if (!mttrPorArea[areaName]) mttrPorArea[areaName] = { resolvidos: 0, minutos: 0 };
            mttrPorArea[areaName].resolvidos++;
            mttrPorArea[areaName].minutos += loss;
        }
    });

    const rankingMttrData = Object.entries(mttrPorArea)
        .map(([name, data]) => ({
            name,
            mttr: data.resolvidos > 0 ? Math.round(data.minutos / data.resolvidos) : 0
        }))
        .filter(item => item.mttr > 0)
        .sort((a, b) => a.mttr - b.mttr)
        .slice(0, 5); // top 5 mais ágeis

    const topViloes = Object.entries(causadorasPerdaCount)
        .map(([name, loss]) => ({ name, horas: Math.round(loss/60) }))
        .sort((a,b) => b.horas - a.horas)
        .slice(0,5);

    // Pareto Causas (Tipologia vs Horas Perdidas)
    const causasPerdaCount: Record<string, number> = {};
    kpisCurrentMonth.forEach(a => {
        const loss = differenceInMinutes(a.resolvido_at ? new Date(a.resolvido_at) : new Date(), new Date(a.created_at));
        causasPerdaCount[a.tipo_alerta] = (causasPerdaCount[a.tipo_alerta] || 0) + loss;
    });
    const topCausas = Object.entries(causasPerdaCount)
        .map(([name, loss]) => ({ name, horas: Math.round(loss/60) }))
        .sort((a,b) => b.horas - a.horas)
        .slice(0, 5);

    // Tendência últimos 4 meses (Baseado na selectedArea, ignora selectedMonth)
    const last4MonthsStr = Array.from({ length: 4 }).map((_, i) => {
        const d = subMonths(new Date(), 3 - i);
        return format(d, 'yyyy-MM');
    });

    const trendData = last4MonthsStr.map(mStr => {
        const alMonthList = kpisFilteredByArea.filter(a => format(new Date(a.created_at), 'yyyy-MM') === mStr);
        const resolvedList = alMonthList.filter(a => a.resolvido && a.resolvido_at);
        let mTotalLoss = 0;
        resolvedList.forEach(a => { mTotalLoss += differenceInMinutes(new Date(a.resolvido_at!), new Date(a.created_at)); });
        return {
            name: mStr, 
            Ocorrências: alMonthList.length,
            MTTR: resolvedList.length > 0 ? Math.round(mTotalLoss / resolvedList.length) : 0
        };
    });

    // Generate unique areas for filter
    const uniqueAreaList = Array.from(new Set(
        alertas.map(a => {
            const ar = a.estacao_causadora?.areas_fabrica;
            return ar ? JSON.stringify({id: ar.id, nome: ar.nome_area}) : null;
        }).filter(Boolean)
    )).map(s => JSON.parse(s as string));

    // Heróis da fiabilidade
    const allAreasNames = uniqueAreaList.map((a: any) => a.nome);
    const areasComFalhas = new Set(kpisCurrentMonth.map(a => a.estacao_causadora?.areas_fabrica?.nome_area).filter(Boolean));
    const areasLivresDeFalhas = allAreasNames.filter(a => !areasComFalhas.has(a));
    const topFiaveis = areasLivresDeFalhas.length > 0 
        ? areasLivresDeFalhas.map(name => ({name, alertas: 0})) 
        : Object.entries(heatmapAreasCount).map(([name, count]) => ({name, alertas: count as number})).sort((a,b) => a.alertas - b.alertas).slice(0,3);

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

                <Card className="bg-slate-900 border-slate-800 text-white shadow-xl max-w-md w-full shrink-0">
                    <CardHeader className="py-3 px-4 bg-slate-950/50 border-b border-slate-800 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold tracking-widest uppercase flex items-center gap-2 text-slate-300 m-0">
                            <Tv size={16} className="text-blue-400" /> Acesso a Ecrãs TV
                        </CardTitle>
                        <Button
                            variant="destructive"
                            onClick={() => setIsAndonModalOpen(true)}
                            className="bg-red-600 hover:bg-red-700 text-white font-black tracking-widest px-3 py-1.5 h-auto text-xs gap-1 shadow-lg shadow-red-500/20 animate-pulse"
                        >
                            <AlertTriangle size={14} /> Andon Help
                        </Button>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="flex flex-wrap gap-2">
                            {tvLinks.length === 0 ? (
                                <span className="text-xs text-slate-500 p-2">Nenhum ecrã configurado.</span>
                            ) : (
                                tvLinks.map(tv => (
                                    <Link key={tv.id} href={`/tv/live/${tv.id}`} target="_blank">
                                        <Button variant="secondary" size="sm" className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs shadow-sm">
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
                                <option value="all">Qualquer Área Problema</option>
                                {uniqueAreasProblema.map(area => (
                                    <option key={area.id} value={area.id}>{area.nome}</option>
                                ))}
                            </select>
                            <select value={filterCausadora} onChange={e => setFilterCausadora(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 focus:border-blue-500 focus:outline-none max-w-[150px] truncate">
                                <option value="all">Qualquer Área Causadora</option>
                                {uniqueAreasCausadora.map(area => (
                                    <option key={area.id} value={area.id}>{area.nome}</option>
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
                                                    <div className="bg-slate-100 px-2 py-1.5 rounded border border-slate-200 w-full">
                                                        <div className="font-bold text-red-700 text-[11px] uppercase tracking-wider leading-tight truncate">
                                                            {al.estacao_causadora?.areas_fabrica?.nome_area || 'Área'} - {al.estacao_causadora?.nome_estacao || 'Desconhecida'}
                                                        </div>
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
                                                    {!al.resolvido ? (
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            className="h-8 w-8 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                                                            onClick={() => handleResolver(al.id)}
                                                            title="Resolver Paragem"
                                                        >
                                                            <Hammer size={14} />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            className="h-8 w-8 border-amber-500 text-amber-600 hover:bg-amber-50"
                                                            onClick={() => handleClonar(al.id)}
                                                            title="Reincidência / Clonar"
                                                        >
                                                            <Activity size={14} />
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
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row gap-4 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Mês de Análise</label>
                            <input 
                                type="month" 
                                value={selectedMonth} 
                                onChange={e => setSelectedMonth(e.target.value)}
                                className="w-full mt-1 border border-slate-300 rounded-md px-3 py-2 bg-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Filtro por Área</label>
                            <select 
                                value={selectedArea} 
                                onChange={e => setSelectedArea(e.target.value)}
                                className="w-full mt-1 border border-slate-300 rounded-md px-3 py-2 bg-white focus:border-blue-500 focus:outline-none"
                            >
                                <option value="all">Todas as Áreas (Visão Fabril)</option>
                                {uniqueAreaList.map((a: any) => (
                                    <option key={a.id} value={a.id}>{a.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                        <Card className="border-slate-200 shadow-sm relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <AlertTriangle size={64} />
                            </div>
                            <CardHeader className="pb-2 relative z-10">
                                <CardTitle className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={16} className="text-red-400" /> Impacto OEE (Tempo Perdido)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-4xl font-black text-white">{Math.floor(totalMinutosPerdidos / 60)}<span className="text-lg text-slate-400">h</span> {totalMinutosPerdidos % 60}<span className="text-lg text-slate-400">m</span></div>
                                <div className="mt-3 text-xs text-red-300 font-bold bg-red-950/80 p-2 rounded border border-red-900/50 flex items-center gap-2 shadow-inner">
                                    <TrendingDown size={14} className="animate-pulse" /> Impacto direto na eficiência ({totalMinutosPerdidos} min)
                                </div>
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
                    </div>

                    {/* SEGUNDA LINHA: OS NOVOS RANKINGS DE MATURIDADE (LEAN) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* WINNERS: MTTR */}
                        <Card className="border-slate-200 shadow-sm lg:col-span-1 border-t-4 border-t-emerald-500">
                            <CardHeader>
                                <CardTitle className="text-slate-800 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp size={16} className="text-emerald-500" /> Top Áreas (Agilidade Resposta)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                {rankingMttrData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={rankingMttrData} layout="vertical" margin={{ left: -10, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} fontSize={10} tickLine={false} axisLine={false} />
                                            <RechartsTooltip cursor={{fill: '#f8fafc'}} formatter={(val) => [`${val} min`, 'MTTR Médio']} />
                                            <Bar dataKey="mttr" fill="#10b981" radius={[0, 4, 4, 0]}>
                                                {rankingMttrData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#059669' : '#34d399'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">Sem dados suficientes.</div>
                                )}
                            </CardContent>
                        </Card>

                        {/* LOSERS: VILÕES DA PRODUÇÃO */}
                        <Card className="border-slate-200 shadow-sm lg:col-span-1 border-t-4 border-t-red-500">
                            <CardHeader>
                                <CardTitle className="text-slate-800 text-sm flex items-center gap-2 font-bold uppercase tracking-widest">
                                    <AlertCircle size={16} className="text-red-500" /> Ofensores da Produção (Pareto)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                {topViloes.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topViloes} layout="vertical" margin={{ left: -10, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} fontSize={10} tickLine={false} axisLine={false} />
                                            <RechartsTooltip cursor={{fill: '#f8fafc'}} formatter={(val) => [`${val} horas`, 'Tempo Destruído']} />
                                            <Bar dataKey="horas" fill="#ef4444" radius={[0, 4, 4, 0]}>
                                                {topViloes.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#b91c1c' : '#f87171'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">Sem dados suficientes.</div>
                                )}
                            </CardContent>
                        </Card>

                        {/* WINNERS: PÓDIO FIABILIDADE */}
                        <Card className="border-slate-200 shadow-sm lg:col-span-1 bg-slate-50 border-t-4 border-t-amber-500">
                            <CardHeader>
                                <CardTitle className="text-slate-800 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-amber-500" /> Pódio de Fiabilidade
                                </CardTitle>
                                <p className="text-xs text-slate-500 m-0">Áreas com ZERO ou menores níveis de falhas.</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 mt-2">
                                    {topFiaveis.map((area, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-700'}`}>
                                                {idx === 0 ? <Trophy size={16} /> : idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-700 text-sm">{area.name}</div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                                                    {area.alertas === 0 ? '🏆 100% Livre de Falhas' : `${area.alertas} Ocorrências (Top Fabril)`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {topFiaveis.length === 0 && (
                                        <div className="text-center p-4 text-slate-400 italic text-sm">A analisar dados históricos...</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-slate-800 text-sm font-bold uppercase tracking-widest">Volume Reportes</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={11} tickLine={false} axisLine={false} />
                                        <RechartsTooltip cursor={{fill: '#f8fafc'}} />
                                        <Bar dataKey="Ocorrências" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-slate-800 text-sm font-bold uppercase tracking-widest">Tendência MTTR</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={11} tickLine={false} axisLine={false} />
                                        <RechartsTooltip />
                                        <Line type="monotone" dataKey="MTTR" stroke="#10b981" strokeWidth={3} dot={{r:4, fill: '#10b981'}} activeDot={{r:6}} name="Média Resposta (min)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-slate-800 text-sm flex items-center gap-2 font-bold uppercase tracking-widest">
                                    <ListTodo size={16} className="text-indigo-500" /> Top Tempos p/ Incidência
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                {topCausas.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topCausas} layout="vertical" margin={{ left: -10, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={110} fontSize={10} tickLine={false} axisLine={false} />
                                            <RechartsTooltip cursor={{fill: '#f8fafc'}} formatter={(val) => [`${val} horas`, 'Tempo Perdido']} />
                                            <Bar dataKey="horas" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                                                {topCausas.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#7c3aed' : '#a78bfa'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">Sem dados suficientes.</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-slate-200 shadow-sm mt-6">
                        <CardHeader>
                            <CardTitle className="text-slate-800 text-sm flex items-center gap-2 font-bold uppercase tracking-widest">
                                <Factory size={18} className="text-slate-500" /> Mapa de Calor (Termografia de Incidentes)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {uniqueAreaList.map((a: any) => {
                                    const count = heatmapAreasCount[a.nome] || 0;
                                    let bgClass = 'bg-slate-100 border-slate-200 text-slate-500';
                                    if (count > 0 && count <= 2) bgClass = 'bg-amber-100 border-amber-300 text-amber-800';
                                    if (count > 2 && count <= 5) bgClass = 'bg-orange-100 border-orange-400 text-orange-800';
                                    if (count > 5) bgClass = 'bg-red-200 border-red-500 text-red-900 border-2 shadow-sm scale-105';
                                    if (count === 0 && selectedArea === 'all') bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-600';
                                    
                                    return (
                                        <div key={a.id} className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${bgClass}`}>
                                            <span className="text-[10px] uppercase font-bold tracking-widest line-clamp-2 leading-tight mb-2 h-6">{a.nome}</span>
                                            <span className="text-3xl font-black">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ANDON MODAL */}
            <Dialog open={isAndonModalOpen} onOpenChange={setIsAndonModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-red-500 uppercase tracking-widest flex items-center gap-4">
                            <AlertTriangle size={32} />
                            Disparo Andon
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-lg">
                            Esta ação bloqueará de imediato o ecrã na TV selecionada, alertando os supervisores para a falha ou quebra de fluxo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-slate-300 font-bold uppercase tracking-widest mb-2 block">Onde está o problema? (Local Ocorrência)</Label>
                            <select
                                value={localOcorrenciaId}
                                onChange={(e) => {
                                   setLocalOcorrenciaId(e.target.value);
                                   if (!causadoraEstacaoId) setCausadoraEstacaoId(e.target.value); // Autopreencher tv alvo para conveniência
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="" disabled>Selecione onde foi detetada a falha...</option>
                                {estacoes.map(est => (
                                    <option key={est.id} value={est.id}>{est.nome_estacao}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-rose-300 font-bold uppercase tracking-widest mb-2 block">Quem Causou? (Bloqueia TV Alvo)</Label>
                            <select
                                value={causadoraEstacaoId}
                                onChange={(e) => setCausadoraEstacaoId(e.target.value)}
                                className="w-full bg-rose-950/20 border border-rose-900/50 rounded-lg p-3 text-rose-100 focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="" disabled>Selecione a Estação Responsável...</option>
                                {estacoes.map(est => (
                                    <option key={est.id} value={est.id}>{est.nome_estacao}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300 font-bold uppercase tracking-widest mb-2 block">Tipo de Incidência</Label>
                            <select
                                value={andonType}
                                onChange={(e) => setAndonType(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="Ajuste técnico">⚙️ Ajuste Técnico</option>
                                <option value="Avaria de equipamento">🔧 Avaria de Equipamento</option>
                                <option value="Defeito">📉 Defeito</option>
                                <option value="Falta">⚠️ Falta</option>
                                <option value="Fornecimento">📦 Fornecimento</option>
                                <option value="Mal ligado">🔌 Mal ligado</option>
                                <option value="Mal montado">🔨 Mal montado</option>
                                <option value="Pick">🛒 Pick</option>
                                <option value="Qualidade">🔎 Qualidade</option>
                                <option value="Scrap">🗑️ Scrap</option>
                                <option value="Outros">❓ Outros</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300 font-bold uppercase tracking-widest block">Observação (Opcional)</Label>
                            <Textarea
                                value={andonDesc}
                                onChange={(e) => setAndonDesc(e.target.value)}
                                placeholder="Descreva o material em falta ou motivo..."
                                className="bg-slate-950 border-slate-700 text-white focus-visible:ring-red-500 min-h-[80px]"
                            />
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsAndonModalOpen(false)}
                            className="text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            CANCELAR
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmAndonFire}
                            disabled={!localOcorrenciaId || !causadoraEstacaoId}
                            className="bg-red-600 hover:bg-red-700 text-white font-black tracking-widest px-8 shadow-md"
                        >
                            DISPARAR ALARME
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

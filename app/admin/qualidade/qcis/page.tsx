'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Layers, Activity, AlertTriangle, Filter, ShieldAlert, BarChart3, Target, CheckCircle2 } from 'lucide-react';
import { fetchQcisData } from './actions';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type QcisAudit = {
    id: string;
    fail_date: string;
    boat_id: string;
    model_ref: string;
    peca: string;
    responsible_area: string;
    hull_number: number;
    component_name: string;
    substation_name: string;
    defect_description: string;
    seccao: string;
    count_of_defects: number;
    defect_comment: string;
    linha_linha: string;
    lista_categoria: string;
    lista_sub: string;
    lista_gate: string;
};

export default function QcisAnalyticsDashboard() {
    const [audits, setAudits] = useState<QcisAudit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filtro Mestre de Mês
    const today = new Date();
    const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(currentMonthPrefix);

    // Filtros de Período Específico (Sobrepõem o Mês)
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Filtros NASA Secundários
    const [filterModelo, setFilterModelo] = useState('');
    const [filterLinha, setFilterLinha] = useState('');
    const [filterGate, setFilterGate] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');

    const loadData = async () => {
        setIsLoading(true);
        let startDate = customStartDate;
        let endDate = customEndDate;

        // Se falhar algum dos custom dates, cai no "Mês" para estabelecer os limites da API
        if (!startDate || !endDate) {
            const [year, month] = selectedMonth.split('-');
            startDate = startDate || new Date(Number(year), Number(month) - 1, 1).toISOString().split('T')[0];
            endDate = endDate || new Date(Number(year), Number(month), 0).toISOString().split('T')[0];
        }

        const res = await fetchQcisData({ startDate, endDate, _cacheBuster: Date.now().toString() });
        if (res.success && res.data) {
            setAudits(res.data as QcisAudit[]);
        } else {
            setAudits([]);
        }
    useEffect(() => {
        loadData();
    }, [selectedMonth, customStartDate, customEndDate]);

    const monthsDropdown = useMemo(() => {
        const arr = [];
        const t = new Date();
        for(let i=0; i<12; i++) {
            const d = new Date(t.getFullYear(), t.getMonth() - i, 1);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const mStr = d.toLocaleString('pt-PT', { month: 'long' });
            const label = mStr.charAt(0).toUpperCase() + mStr.slice(1) + ' ' + yyyy;
            arr.push({ label, val: `${yyyy}-${mm}` });
        }
        return arr;
    }, []);

    // 1. Filtragens Base
    const filteredBase = useMemo(() => {
        return audits.filter(a => {
            const matchModelo = filterModelo ? a.model_ref === filterModelo : true;
            const matchLinha = filterLinha ? a.linha_linha === filterLinha : true;
            const matchGate = filterGate ? a.lista_gate === filterGate : true;
            const matchCategoria = filterCategoria ? a.lista_categoria === filterCategoria : true;
            return matchModelo && matchLinha && matchGate && matchCategoria;
        });
    }, [audits, filterModelo, filterLinha, filterGate, filterCategoria]);

    // 2. O CORAÇÃO V8.1: Extrair dias ativos cronológicos (6 pelo Mês, ou tudo se período Custom)
    const { activeDays, activeData } = useMemo(() => {
        const uniqueDates = Array.from(new Set(filteredBase.map(a => a.fail_date ? a.fail_date.split('T')[0] : null).filter(Boolean) as string[]));
        uniqueDates.sort((a, b) => b.localeCompare(a)); // Descending
        
        // Se usar um filtro customizado, permitimos até 31 dias. Se for o Mês padrão, os 6 mais recentes.
        const isCustom = customStartDate || customEndDate;
        const maxDays = isCustom ? 31 : 6;
        
        const activeDaysRaw = uniqueDates.slice(0, maxDays).reverse(); // Chronological for charts
        const activeSet = new Set(activeDaysRaw);
        
        const activeDataList = filteredBase.filter(a => {
            const dStr = a.fail_date ? a.fail_date.split('T')[0] : null;
            return dStr && activeSet.has(dStr);
        });

        return { activeDays: activeDaysRaw, activeData: activeDataList };
    }, [filteredBase, customStartDate, customEndDate]);

    // Opções Dinamicas dos Dropdowns (da base de dados do mes)
    const modelosUnicos = Array.from(new Set(filteredBase.map(a => a.model_ref).filter(Boolean))).sort();
    const linhasUnicas = Array.from(new Set(filteredBase.map(a => a.linha_linha).filter(Boolean))).sort();
    const gatesUnicos = Array.from(new Set(filteredBase.map(a => a.lista_gate).filter(Boolean))).sort();
    const categoriasUnicas = Array.from(new Set(filteredBase.map(a => a.lista_categoria).filter(Boolean))).sort();

    // --- MÁQUINAS MATEMÁTICAS GLOBAIS (Sobre os dados ativos) ---
    
    // KPI Clássicos
    const totalDefeitos = activeData.reduce((acc, curr) => acc + (curr.count_of_defects || 0), 0);
    const totalBarcosUnicos = new Set(activeData.map(a => a.boat_id).filter(Boolean)).size;

    // KPI: DPU Global (Defects Per Unit)
    const globalDPU = totalBarcosUnicos > 0 ? (totalDefeitos / totalBarcosUnicos).toFixed(2) : "0.00";

    // KPI: FTR Global % (First Time Rate - Apenas Testes Funcionais)
    const globalFTR = useMemo(() => {
        const ftrAudits = activeData.filter(a => (a.substation_name || '').toLowerCase().includes('testes funcionais'));
        if (ftrAudits.length === 0) return "N/A";
        
        const totalBoats = new Set(ftrAudits.map(a => a.boat_id).filter(Boolean)).size;
        const zeroBoats = new Set(
            ftrAudits.filter(a => {
                const s = (a.seccao || '').toLowerCase();
                return s.includes('zero') || s.includes('100%');
            }).map(a => a.boat_id).filter(Boolean)
        ).size;
        
        if (totalBoats === 0) return "0%";
        return `${Math.round((zeroBoats / totalBoats) * 100)}%`;
    }, [activeData]);

    // Formatador utilitário de Mês
    const fmtDate = (str: string) => str.split('-').reverse().slice(0,2).join('/'); // DD/MM

    // MATRIZ OPERACIONAL (Fail Date vs Quality Gates)
    const { heatmapMatrix, heatmapGates } = useMemo(() => {
        const matrix: Record<string, Record<string, number>> = {};
        const gatesSet = new Set<string>();

        activeData.forEach(a => {
            const dateStr = a.fail_date ? fmtDate(a.fail_date.split('T')[0]) : 'S/ Data';
            const gate = a.lista_gate || 'S/ Gate';
            gatesSet.add(gate);
            
            if (!matrix[dateStr]) matrix[dateStr] = {};
            matrix[dateStr][gate] = (matrix[dateStr][gate] || 0) + (a.count_of_defects || 0);
        });
        
        return { heatmapMatrix: matrix, heatmapGates: Array.from(gatesSet).sort() };
    }, [activeData]);

    // Matemáticas de Subestações (Chronologic Lines)
    const { chartEmbalamento, chartTestes, chartPD, uniqueChartLinhas } = useMemo(() => {
        const linhasSet = new Set<string>();
        
        const embMap: Record<string, Record<string, number>> = {};
        const embBoats: Record<string, Record<string, Set<string>>> = {};
        
        const ftrMap: Record<string, Record<string, number>> = {};
        const ftrZero: Record<string, Record<string, Set<string>>> = {};
        const ftrTotal: Record<string, Record<string, Set<string>>> = {};
        
        const pdMap: Record<string, Record<string, number>> = {};

        activeDays.forEach(d => {
            embMap[d] = {}; embBoats[d] = {};
            ftrMap[d] = {}; ftrZero[d] = {}; ftrTotal[d] = {};
            pdMap[d] = {};
        });

        activeData.forEach(a => {
            if (!a.linha_linha) return;
            const dStr = a.fail_date.split('T')[0];
            const linha = a.linha_linha.trim();
            linhasSet.add(linha);

            const peca = (a.peca || '').toLowerCase();
            const sub = (a.substation_name || '').toLowerCase();
            const seccao = (a.seccao || '').toLowerCase();
            const boatId = a.boat_id || 'unknown';
            const count = a.count_of_defects || 0;

            // Embalamento (PDU) CATCH-ALL
            if (peca.includes('embalam') || sub.includes('embalam')) {
                embMap[dStr][linha] = (embMap[dStr][linha] || 0) + count;
                if (!embBoats[dStr][linha]) embBoats[dStr][linha] = new Set();
                embBoats[dStr][linha].add(boatId);
            }

            // Testes Funcionais (FTR)
            if (sub.includes('testes funcionais')) {
                if (!ftrTotal[dStr][linha]) ftrTotal[dStr][linha] = new Set();
                ftrTotal[dStr][linha].add(boatId);
                
                if (seccao.includes('zero') || seccao.includes('100%')) {
                    if (!ftrZero[dStr][linha]) ftrZero[dStr][linha] = new Set();
                    ftrZero[dStr][linha].add(boatId);
                }
            }

            // P&D (Soma de Defeitos)
            if (sub.includes('p&d') || sub.endsWith('p&d')) {
                pdMap[dStr][linha] = (pdMap[dStr][linha] || 0) + count;
            }
        });

        // Compute Averages per Day
        activeDays.forEach(d => {
            let sumPdu = 0; let actEmb = 0;
            let sumFtr = 0; let actFtr = 0;

            Array.from(linhasSet).forEach(linha => {
                // PDU
                const tEmb = embBoats[d][linha] ? embBoats[d][linha].size : 0;
                if (tEmb > 0) {
                    const pdu = Number(((embMap[d][linha] || 0) / tEmb).toFixed(2));
                    embMap[d][linha] = pdu;
                    sumPdu += pdu; actEmb++;
                } else delete embMap[d][linha];

                // FTR
                const tFtr = ftrTotal[d][linha] ? ftrTotal[d][linha].size : 0;
                if (tFtr > 0) {
                    const zFtr = ftrZero[d][linha] ? ftrZero[d][linha].size : 0;
                    const fVal = Math.round((zFtr / tFtr) * 100);
                    ftrMap[d][linha] = fVal;
                    sumFtr += fVal; actFtr++;
                } else delete ftrMap[d][linha];
            });

            // Globais
            if (actEmb > 0) embMap[d]['Tendência Global'] = Number((sumPdu / actEmb).toFixed(2));
            if (actFtr > 0) ftrMap[d]['Tendência Global'] = Math.round(sumFtr / actFtr);
        });

        const fData = (mapBase: any) => activeDays.map(d => ({ name: fmtDate(d), ...mapBase[d] }));

        return { 
            chartEmbalamento: fData(embMap), 
            chartTestes: fData(ftrMap), 
            chartPD: fData(pdMap),
            uniqueChartLinhas: Array.from(linhasSet).sort()
        };
    }, [activeData, activeDays]);

    // PARETO: Top Defeitos (Descrições mais penalizadoras)
    const paretoData = useMemo(() => {
        const counter: Record<string, number> = {};
        activeData.forEach(a => {
            const desc = a.defect_description || a.peca || 'Sem Descrição';
            counter[desc] = (counter[desc] || 0) + (a.count_of_defects || 0);
        });
        return Object.entries(counter)
            .map(([name, value]) => ({ name, value }))
            .sort((a,b) => b.value - a.value)
            .slice(0, 50); // Top 50 Ofensores
    }, [activeData]);

    const getColor = (idx: number, total: number) => `hsl(${idx * (360 / total)}, 70%, 50%)`;

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400 animate-pulse flex flex-col items-center justify-center h-screen border-slate-900 bg-[#020617]"><Layers size={48} className="text-slate-700 mb-4 animate-spin"/><div>A extrair dados QCIS Dashboard...</div></div>;
    }

    return (
        <div className="p-6 md:p-8 flex flex-col gap-6 bg-[#020617] min-h-[calc(100vh-64px)] overflow-y-auto text-slate-200">
            
            {/* CABEÇALHO E FILTROS DE DATA */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <ShieldAlert className="text-rose-500" /> QCIS Dashboard
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {customStartDate || customEndDate 
                            ? 'Cálculos Exatos isolados no Período Customizado (Max 31 dias).' 
                            : 'Cálculos Exatos da Amostragem dos Últimos 6 Dias Ativos.'}
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Range Inputs */}
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                        <input 
                            type="date" 
                            className="bg-transparent text-sm text-slate-300 outline-none w-32" 
                            value={customStartDate} 
                            onChange={e => setCustomStartDate(e.target.value)} 
                            title="Data de Início"
                        />
                        <span className="text-slate-500 text-xs">até</span>
                        <input 
                            type="date" 
                            className="bg-transparent text-sm text-slate-300 outline-none w-32" 
                            value={customEndDate} 
                            onChange={e => setCustomEndDate(e.target.value)} 
                            title="Data de Fim"
                        />
                        {(customStartDate || customEndDate) && (
                            <button 
                                onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                                className="text-xs text-rose-400 bg-rose-500/20 px-2 py-1 rounded hover:bg-rose-500/30"
                            >
                                Limpar
                            </button>
                        )}
                    </div>
                    <select 
                        value={selectedMonth} 
                        onChange={e => { setSelectedMonth(e.target.value); setCustomStartDate(''); setCustomEndDate(''); }}
                        className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 font-medium"
                    >
                        {monthsDropdown.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                    </select>
                </div>
            </div>

            {/* FILTROS NAVBAR */}
            <div className="flex flex-wrap items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 text-slate-400 hidden lg:flex"><Filter size={18}/><span className="text-sm font-semibold">Filtros Globais</span></div>
                
                <select value={filterModelo} onChange={e => setFilterModelo(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm font-medium text-slate-300 outline-none">
                    <option value="">Todos os Modelos</option>{modelosUnicos.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
                <select value={filterLinha} onChange={e => setFilterLinha(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm font-medium text-slate-300 outline-none">
                    <option value="">Todas as Linhas</option>{linhasUnicas.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
                <select value={filterGate} onChange={e => setFilterGate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm font-medium text-slate-300 outline-none">
                    <option value="">Todos os Gates</option>{gatesUnicos.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
                <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm font-medium text-slate-300 outline-none">
                    <option value="">Todas as Categorias</option>{categoriasUnicas.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
            </div>

            {/* KPIS DE TOPO */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                 <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><AlertTriangle size={64} /></div>
                    <CardHeader className="pb-1"><CardTitle className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Defeitos Capturados</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl lg:text-3xl font-bold text-slate-100">{totalDefeitos}</p></CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Layers size={64} /></div>
                    <CardHeader className="pb-1"><CardTitle className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Barcos Únicos Testados</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl lg:text-3xl font-bold text-slate-100">{totalBarcosUnicos}</p></CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden ring-1 ring-emerald-500/20">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500"><CheckCircle2 size={64} /></div>
                    <CardHeader className="pb-1"><CardTitle className="text-slate-400 text-xs font-semibold uppercase tracking-wider">FTR Global Acumulado</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl lg:text-3xl font-bold text-emerald-400">{globalFTR}</p></CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden ring-1 ring-rose-500/20">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-500"><Target size={64} /></div>
                    <CardHeader className="pb-1"><CardTitle className="text-slate-400 text-xs font-semibold uppercase tracking-wider">DPU Global (Soma/Barco)</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl lg:text-3xl font-bold text-rose-400">{globalDPU}</p></CardContent>
                </Card>
            </div>

            {/* MATRIZ GATES VS DATA E PARETO */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* MATRIZ OPERACIONAL (Fail Date vs Quality Gates) */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl xl:col-span-2">
                    <CardHeader><CardTitle className="text-slate-200">Matriz Operacional: Fail Date vs Quality Gates</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto custom-scrollbar pb-4 max-h-[400px] overflow-y-auto">
                        {Object.keys(heatmapMatrix).length > 0 ? (
                        <Table className="min-w-max">
                            <TableHeader>
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-slate-400 min-w-[120px] font-semibold sticky left-0 bg-slate-900 shadow-[1px_0_0_0_#1e293b] z-10">Data</TableHead>
                                    {heatmapGates.map(g => <TableHead key={g} className="text-center text-slate-400 font-semibold max-w-[150px] truncate" title={g}>{g}</TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeDays.map(dRaw => {
                                    const dateStr = fmtDate(dRaw);
                                    if(!heatmapMatrix[dateStr]) return null;
                                    
                                    return (
                                        <TableRow key={dateStr} className="border-slate-800 hover:bg-slate-800/50">
                                            <TableCell className="font-medium text-slate-300 sticky left-0 bg-slate-900 shadow-[1px_0_0_0_#1e293b] z-10">{dateStr}</TableCell>
                                            {heatmapGates.map(gate => {
                                                const v = heatmapMatrix[dateStr][gate] || 0;
                                                return (
                                                    <TableCell key={gate} className="text-center">
                                                        {v > 0 ? <Badge className={`${v > 15 ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'} font-bold`}>{v}</Badge> : <span className="text-slate-700">-</span>}
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                        ) : <div className="text-slate-500 py-6 text-center italic">Sem anomalias neste período.</div>}
                    </CardContent>
                </Card>

                {/* PARETO DOS DEFEITOS */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl xl:col-span-1">
                    <CardHeader><CardTitle className="text-slate-200">Top Ofensores (Pareto)</CardTitle></CardHeader>
                    <CardContent className="h-[350px]">
                        {paretoData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={paretoData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                                    <YAxis dataKey="name" type="category" width={120} stroke="#94a3b8" fontSize={11} tickFormatter={(v) => v.length > 15 ? v.substring(0, 15) + '...' : v} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}>
                                        {paretoData.slice(0, 10).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#6366f1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-600 italic">Sem ofensores</div>}
                    </CardContent>
                </Card>

            </div>

            {/* 3 GRÁFICOS INFERIORES DE LINHAS (Subestações Críticas) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* EMBALAMENTO */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader><CardTitle className="text-slate-200 text-lg font-bold">Inspecção Final Embalamento (PDU)</CardTitle></CardHeader>
                    <CardContent className="h-80">
                        {chartEmbalamento.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartEmbalamento} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickMargin={8} />
                                    <YAxis stroke="#94a3b8" fontSize={11} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                                    <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                                    {uniqueChartLinhas.map((linha, idx) => (
                                        <Line key={linha} type="monotone" dataKey={linha} stroke={getColor(idx, uniqueChartLinhas.length)} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    ))}
                                    <Line type="monotone" dataKey="Tendência Global" stroke="#fbbf24" strokeWidth={5} dot={{ r: 6, fill: '#0f172a', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-600 italic">Sem dados neste período</div>}
                    </CardContent>
                </Card>

                {/* TESTES FUNCIONAIS (FTR) */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader><CardTitle className="text-slate-200 text-lg font-bold">Testes Funcionais (FTR %)</CardTitle></CardHeader>
                    <CardContent className="h-80">
                        {chartTestes.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartTestes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickMargin={8} />
                                    <YAxis domain={[0, 100]} tickFormatter={(v)=>`${v}%`} stroke="#94a3b8" fontSize={11} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                                    <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                                    {uniqueChartLinhas.map((linha, idx) => (
                                        <Line key={linha} type="monotone" dataKey={linha} stroke={getColor(idx, uniqueChartLinhas.length)} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    ))}
                                    <Line type="monotone" dataKey="Tendência Global" stroke="#fbbf24" strokeWidth={5} dot={{ r: 6, fill: '#0f172a', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-600 italic">Sem dados neste período</div>}
                    </CardContent>
                </Card>

                {/* P&D */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl col-span-1 lg:col-span-2">
                    <CardHeader><CardTitle className="text-slate-200 text-lg font-bold flex items-center gap-2"><Activity className="text-fuchsia-400" /> P&D (Defeitos Totais)</CardTitle></CardHeader>
                    <CardContent className="h-80">
                        {chartPD.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartPD} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickMargin={8} />
                                    <YAxis stroke="#94a3b8" fontSize={11} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                                    <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                                    {uniqueChartLinhas.map((linha, idx) => (
                                        <Line key={linha} type="monotone" dataKey={linha} stroke={getColor(idx, uniqueChartLinhas.length)} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-600 italic">Sem dados neste período</div>}
                    </CardContent>
                </Card>

            </div>

            {/* TABELA DE DADOS RAW */}
            <Card className="bg-slate-900 border-slate-800 shadow-xl">
                 <CardHeader><CardTitle className="text-slate-200">Lista Histórica de Auditorias (Período Ativo)</CardTitle></CardHeader>
                 <CardContent>
                     <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-[500px] overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-slate-800/50 sticky top-0 z-10 backdrop-blur">
                                <TableRow className="border-slate-700">
                                    <TableHead className="text-slate-300">Data</TableHead>
                                    <TableHead className="text-slate-300">Boat ID</TableHead>
                                    <TableHead className="text-slate-300">Gate</TableHead>
                                    <TableHead className="text-slate-300">Substation</TableHead>
                                    <TableHead className="text-slate-300">Secção</TableHead>
                                    <TableHead className="text-slate-300">Peça</TableHead>
                                    <TableHead className="text-slate-300">Defeitos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeData.length > 0 ? activeData.slice(0, 100).map((a, i) => (
                                    <TableRow key={a.id || i} className="border-slate-800 hover:bg-slate-800/30">
                                        <TableCell className="text-slate-300">{a.fail_date ? fmtDate(a.fail_date.split('T')[0]) : 'N/A'}</TableCell>
                                        <TableCell className="font-medium text-blue-400">{a.boat_id}</TableCell>
                                        <TableCell className="text-slate-300">{a.lista_gate || '-'}</TableCell>
                                        <TableCell className="text-slate-300 max-w-[150px] truncate" title={a.substation_name}>{a.substation_name || '-'}</TableCell>
                                        <TableCell className="text-slate-300">{a.seccao || '-'}</TableCell>
                                        <TableCell className="text-slate-300 max-w-[200px] truncate" title={a.peca}>{a.peca || '-'}</TableCell>
                                        <TableCell className="font-bold text-center text-rose-400">{a.count_of_defects || 0}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={7} className="text-center py-6 text-slate-500 italic">Sem auditorias na seleção atual</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {activeData.length > 100 && <div className="text-right text-xs text-slate-500 mt-2">Mostrando as primeiras 100 linhas ativas.</div>}
                 </CardContent>
            </Card>

        </div>
    );
}

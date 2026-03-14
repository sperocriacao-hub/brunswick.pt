'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Layers, Activity, AlertTriangle, Filter, ShieldAlert, BarChart3 } from 'lucide-react';
import { fetchQcisData } from './actions';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
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

    // Filtros NASA Secundários
    const [filterModelo, setFilterModelo] = useState('');
    const [filterLinha, setFilterLinha] = useState('');
    const [filterGate, setFilterGate] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');

    const loadData = async () => {
        setIsLoading(true);
        const [year, month] = selectedMonth.split('-');
        // Limita o download à API estritamente para o Mês Selecionado (Impede latência)
        const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];

        const res = await fetchQcisData({ startDate, endDate, _cacheBuster: Date.now().toString() });
        if (res.success && res.data) {
            setAudits(res.data as QcisAudit[]);
        } else {
            setAudits([]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [selectedMonth]);

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

    // 2. O CORAÇÃO V8: Extrair apenas os ÚLTIMOS 3 DIAS ATIVOS
    const { active3Days, last3DaysData } = useMemo(() => {
        const uniqueDates = Array.from(new Set(filteredBase.map(a => a.fail_date ? a.fail_date.split('T')[0] : null).filter(Boolean) as string[]));
        uniqueDates.sort((a, b) => b.localeCompare(a)); // Descending
        const active3Days = uniqueDates.slice(0, 3).reverse(); // Chronological for charts
        const active3Set = new Set(active3Days);
        
        const last3DaysData = filteredBase.filter(a => {
            const dStr = a.fail_date ? a.fail_date.split('T')[0] : null;
            return dStr && active3Set.has(dStr);
        });

        return { active3Days, last3DaysData };
    }, [filteredBase]);

    // Opções Dinamicas dos Dropdowns
    const modelosUnicos = Array.from(new Set(filteredBase.map(a => a.model_ref).filter(Boolean))).sort();
    const linhasUnicas = Array.from(new Set(filteredBase.map(a => a.linha_linha).filter(Boolean))).sort();
    const gatesUnicos = Array.from(new Set(filteredBase.map(a => a.lista_gate).filter(Boolean))).sort();
    const categoriasUnicas = Array.from(new Set(filteredBase.map(a => a.lista_categoria).filter(Boolean))).sort();

    // --- KPIs Globais (Apenas 3 Dias) ---
    const totalDefeitos = last3DaysData.reduce((acc, curr) => acc + (curr.count_of_defects || 0), 0);
    const totalBarcosUnicos = new Set(last3DaysData.map(a => a.boat_id).filter(Boolean)).size;

    // Matriz 1: Modelos vs Gates (3 Dias)
    const { heatmapMatrix, heatmapGates } = useMemo(() => {
        const matrix: Record<string, Record<string, number>> = {};
        const gatesSet = new Set<string>();

        last3DaysData.forEach(a => {
            const model = a.model_ref || 'Desconhecido';
            const gate = a.lista_gate || 'S/ Gate';
            gatesSet.add(gate);
            if (!matrix[model]) matrix[model] = {};
            matrix[model][gate] = (matrix[model][gate] || 0) + (a.count_of_defects || 0);
        });
        return { heatmapMatrix: matrix, heatmapGates: Array.from(gatesSet).sort() };
    }, [last3DaysData]);

    // Matemáticas de Subestações
    const { chartEmbalamento, chartTestes, chartPD, uniqueChartLinhas } = useMemo(() => {
        const linhasSet = new Set<string>();
        
        const embMap: Record<string, Record<string, number>> = {};
        const embBoats: Record<string, Record<string, Set<string>>> = {};
        
        const ftrMap: Record<string, Record<string, number>> = {};
        const ftrZero: Record<string, Record<string, Set<string>>> = {};
        const ftrTotal: Record<string, Record<string, Set<string>>> = {};
        
        const pdMap: Record<string, Record<string, number>> = {};

        active3Days.forEach(d => {
            embMap[d] = {}; embBoats[d] = {};
            ftrMap[d] = {}; ftrZero[d] = {}; ftrTotal[d] = {};
            pdMap[d] = {};
        });

        last3DaysData.forEach(a => {
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
        active3Days.forEach(d => {
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

        const fmtDate = (str: string) => str.split('-').reverse().slice(0,2).join('/'); // DD/MM
        const fData = (mapBase: any) => active3Days.map(d => ({ name: fmtDate(d), ...mapBase[d] }));

        return { 
            chartEmbalamento: fData(embMap), 
            chartTestes: fData(ftrMap), 
            chartPD: fData(pdMap),
            uniqueChartLinhas: Array.from(linhasSet).sort()
        };
    }, [last3DaysData, active3Days]);

    const getColor = (idx: number, total: number) => `hsl(${idx * (360 / total)}, 70%, 50%)`;

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400 animate-pulse flex flex-col items-center justify-center h-screen border-slate-900 bg-[#020617]"><Layers size={48} className="text-slate-700 mb-4 animate-spin"/><div>A extrair dados imaculados V8 da Supabase...</div></div>;
    }

    return (
        <div className="p-6 md:p-8 flex flex-col gap-6 bg-[#020617] min-h-[calc(100vh-64px)] overflow-y-auto text-slate-200">
            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="text-rose-500" /> QCIS Dashboard (V8 Clean Slate)
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Cálculos Exatos e Isolados dos últimos 3 dias Úteis do Mês.</p>
                </div>
                <select 
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 font-medium"
                >
                    {monthsDropdown.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                </select>
            </div>

            {/* FILTROS NAVBAR */}
            <div className="flex flex-wrap items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 text-slate-400 hidden lg:flex"><Filter size={18}/><span className="text-sm font-semibold">Filtros Globais</span></div>
                
                <select value={filterModelo} onChange={e => setFilterModelo(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm font-medium text-slate-200 outline-none">
                    <option value="">Todos os Modelos</option>{modelosUnicos.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
                <select value={filterLinha} onChange={e => setFilterLinha(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm font-medium text-slate-200 outline-none">
                    <option value="">Todas as Linhas</option>{linhasUnicas.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
                <select value={filterGate} onChange={e => setFilterGate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm font-medium text-slate-200 outline-none">
                    <option value="">Todos os Gates</option>{gatesUnicos.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
                <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm font-medium text-slate-200 outline-none">
                    <option value="">Todas as Categorias</option>{categoriasUnicas.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
            </div>

            {/* KPIS (3 Dias) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle size={64} /></div>
                    <CardHeader className="pb-2"><CardTitle className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Defeitos Capturados</CardTitle></CardHeader>
                    <CardContent><p className="text-4xl font-bold text-white">{totalDefeitos}</p></CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Layers size={64} /></div>
                    <CardHeader className="pb-2"><CardTitle className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Barcos Únicos Testados</CardTitle></CardHeader>
                    <CardContent><p className="text-4xl font-bold text-white">{totalBarcosUnicos}</p></CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><BarChart3 size={64} /></div>
                    <CardHeader className="pb-2"><CardTitle className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Histórico Avaliado</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold text-emerald-400 mt-2">{active3Days.length > 0 ? active3Days.map(d=>d.split('-').reverse().slice(0,2).join('/')).join(' | ') : 'Sem dados'}</p></CardContent>
                </Card>
            </div>

            {/* MATRIZ GATES VS MODELO */}
            <Card className="bg-slate-900 border-slate-800 shadow-xl">
                <CardHeader><CardTitle className="text-white">Matriz Operacional: Modelos vs Quality Gates</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto custom-scrollbar pb-4">
                    {Object.keys(heatmapMatrix).length > 0 ? (
                    <Table className="min-w-max">
                        <TableHeader>
                            <TableRow className="border-slate-800 hover:bg-transparent">
                                <TableHead className="text-slate-400 min-w-[150px] font-semibold">Modelo</TableHead>
                                {heatmapGates.map(g => <TableHead key={g} className="text-center text-slate-400 font-semibold">{g}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.keys(heatmapMatrix).sort().map(model => (
                                <TableRow key={model} className="border-slate-800 hover:bg-slate-800/50">
                                    <TableCell className="font-medium text-slate-200">{model}</TableCell>
                                    {heatmapGates.map(gate => {
                                        const v = heatmapMatrix[model][gate] || 0;
                                        return (
                                            <TableCell key={gate} className="text-center">
                                                {v > 0 ? <Badge className={`${v > 15 ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'} font-bold`}>{v}</Badge> : <span className="text-slate-700">-</span>}
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    ) : <div className="text-slate-500 py-6 text-center italic">Nenhuma anomalia listada nos últimos 3 dias úteis.</div>}
                </CardContent>
            </Card>

            {/* 3 GRÁFICOS INFERIORES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                {/* EMBALAMENTO */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader><CardTitle className="text-white text-lg font-bold">Inspecção Final Embalamento (PDU)</CardTitle></CardHeader>
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
                    <CardHeader><CardTitle className="text-white text-lg font-bold">Testes Funcionais (FTR %)</CardTitle></CardHeader>
                    <CardContent className="h-80">
                        {chartTestes.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartTestes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickMargin={8} />
                                    <YAxis domain={[0, 100]} tickFormatter={(v)=>`${v}%`} stroke="#94a3b8" fontSize={11} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} formatter={(val: number) => [`${val}%`, '']} />
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
                    <CardHeader><CardTitle className="text-white text-lg font-bold flex items-center gap-2"><Activity className="text-fuchsia-400" /> P&D (Defeitos Totais)</CardTitle></CardHeader>
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
        </div>
    );
}

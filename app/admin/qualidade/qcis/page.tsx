'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Layers, Activity, AlertTriangle, AlertCircle, BarChart3, Filter, ShieldAlert } from 'lucide-react';
import { fetchQcisData } from './actions';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Sector, LineChart, Line, Legend, CartesianGrid, LabelList } from 'recharts';

// Tipagem baseada no schema do PostgreSQL 'qcis_audits'
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
    
    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterModelo, setFilterModelo] = useState('');
    const [filterLinha, setFilterLinha] = useState('');
    const [filterGate, setFilterGate] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [filterSubstation, setFilterSubstation] = useState('');

    // Default: Sem limites de data globais, busca tudo o que existe no DB.
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const loadData = async () => {
        setIsLoading(true);
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
    }, [startDate, endDate]);

    // Dinamicamente gerar os últimos 12 meses para o Dropdown Standardizado
    const monthsDropdown = useMemo(() => {
        const arr = [];
        const today = new Date();
        for(let i=0; i<12; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const mStr = d.toLocaleString('pt-PT', { month: 'long' });
            const label = mStr.charAt(0).toUpperCase() + mStr.slice(1) + ' ' + d.getFullYear();
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            arr.push({ label, val: `${yyyy}-${mm}` });
        }
        return arr;
    }, []);

    // Aplicar Filtros ao Dataset Principal
    const filteredAudits = useMemo(() => {
        return audits.filter(a => {
            const ls = searchTerm.toLowerCase();
            const matchSearch = !ls || 
                                a.boat_id?.toLowerCase().includes(ls) || 
                                a.defect_comment?.toLowerCase().includes(ls) ||
                                a.defect_description?.toLowerCase().includes(ls) ||
                                a.substation_name?.toLowerCase().includes(ls) ||
                                a.lista_categoria?.toLowerCase().includes(ls) ||
                                a.lista_sub?.toLowerCase().includes(ls) ||
                                a.responsible_area?.toLowerCase().includes(ls) ||
                                a.linha_linha?.toLowerCase().includes(ls) ||
                                a.lista_gate?.toLowerCase().includes(ls) ||
                                a.fail_date?.includes(ls);
            const matchModelo = filterModelo ? a.model_ref === filterModelo : true;
            const matchLinha = filterLinha ? a.linha_linha === filterLinha : true;
            const matchGate = filterGate ? a.lista_gate === filterGate : true;
            const matchCategoria = filterCategoria ? a.lista_categoria === filterCategoria : true;
            const matchArea = filterArea ? a.responsible_area === filterArea : true;
            const matchSubstation = filterSubstation ? a.substation_name === filterSubstation : true;
            
            return matchSearch && matchModelo && matchLinha && matchGate && matchCategoria && matchArea && matchSubstation;
        });
    }, [audits, searchTerm, filterModelo, filterLinha, filterGate, filterCategoria, filterArea, filterSubstation]);

    // Extrair opções únicas para os dropdowns de filtro (After Global Filter to allow drill-down or raw from Audits)
    const modelosUnicos = Array.from(new Set(filteredAudits.map(a => a.model_ref).filter(Boolean)));
    const linhasUnicas = Array.from(new Set(filteredAudits.map(a => a.linha_linha).filter(Boolean)));
    const gatesUnicos = Array.from(new Set(filteredAudits.map(a => a.lista_gate).filter(Boolean)));
    const categoriasUnicas = Array.from(new Set(filteredAudits.map(a => a.lista_categoria).filter(Boolean)));
    const areasUnicas = Array.from(new Set(filteredAudits.map(a => a.responsible_area).filter(Boolean)));
    const substationUnicas = Array.from(new Set(filteredAudits.map(a => a.substation_name).filter(Boolean))).sort();

    // KPI 1: Total Defeitos
    const totalDefeitos = filteredAudits.reduce((acc, curr) => acc + (curr.count_of_defects || 0), 0);
    
    // KPI 1.5: DPU (Defects Per Unit)
    const totalBarcosUnicos = new Set(filteredAudits.map(a => a.boat_id).filter(Boolean)).size;
    const dpu = totalBarcosUnicos > 0 ? (totalDefeitos / totalBarcosUnicos).toFixed(2) : '0.00';
    
    // KPI 2: Top Boat ID Offenders (Top 3)
    const conteioPorBoat = filteredAudits.reduce((acc, curr) => {
        if(curr.boat_id) acc[curr.boat_id] = (acc[curr.boat_id] || 0) + (curr.count_of_defects || 0);
        return acc;
    }, {} as Record<string, number>);
    const top3Boats = Object.entries(conteioPorBoat)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 3);

    // Gráfico 1: Pareto por Descrição de Defeito (defect_description)
    const chartDataDefeitos = useMemo(() => {
        const agp = filteredAudits.reduce((acc, curr) => {
            const def = curr.defect_description || 'Não Descrito';
            acc[def] = (acc[def] || 0) + (curr.count_of_defects || 0);
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(agp)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredAudits]);

    // HEATMAP: Quality Gate vs Linha do Tempo (Datas)
    const { heatMapData, heatMapDates } = useMemo(() => {
        const map: Record<string, Record<string, number>> = {};
        const datesSet = new Set<string>();

        // 1. Gather all unique dates in the dataset
        filteredAudits.forEach(a => {
            if (!a.lista_gate || !a.fail_date) return;
            const rawDate = a.fail_date.split('T')[0];
            datesSet.add(rawDate);
        });

        // 2. Sort dates chronologically
        const sortedDates = Array.from(datesSet).sort();
        
        // 3. Populate sums
        filteredAudits.forEach(a => {
            if (!a.lista_gate || !a.fail_date) return;
            const gate = String(a.lista_gate).trim();
            const dateStr = a.fail_date.split('T')[0];
            
            if(!map[gate]) map[gate] = {};
            if(!map[gate][dateStr]) map[gate][dateStr] = 0;
            map[gate][dateStr] += (a.count_of_defects || 0);
        });

        // 4. Transform into Array
        const dataArr = Object.entries(map).map(([gate, values]) => {
            const row: any = { gate };
            sortedDates.forEach(d => row[d] = values[d] || 0);
            return row;
        }).sort((a, b) => a.gate.localeCompare(b.gate, undefined, { numeric: true, sensitivity: 'base' }));

        // A pedido do utilizador, a timeline final deve conter visualmente todos os dias filtrados. Se for demais, scroll horizontal resolve.
        return { heatMapData: dataArr, heatMapDates: sortedDates };
    }, [filteredAudits]);

    // 6-Day Rolling Window Logic
    const { rolling6Days, rolling6DaysList } = useMemo(() => {
        const datesSet = new Set<string>();
        filteredAudits.forEach(a => {
            if (a.fail_date) datesSet.add(a.fail_date.split('T')[0]);
        });
        // Sort descending to get the latest 6 days
        const sortedDates = Array.from(datesSet).sort((a,b) => b.localeCompare(a));
        const last6 = sortedDates.slice(0, 6);
        return { rolling6Days: new Set(last6), rolling6DaysList: last6.sort((a,b) => a.localeCompare(b)) }; 
    }, [filteredAudits]);

    // 3 Substation Flow Charts (Rolling 6 Active Days - Daily Trends)
    const { chartEmbalamento, chartTestes, chartPD, uniqueChartLinhas } = useMemo(() => {
        const embalamentoMap: Record<string, Record<string, number>> = {};
        const embalamentoBoatsMap: Record<string, Record<string, Set<string>>> = {};
        const testesMap: Record<string, Record<string, number>> = {};
        const pdMap: Record<string, Record<string, number>> = {};
        
        const ftrZeroMap: Record<string, Record<string, Set<string>>> = {};
        const ftrTotalMap: Record<string, Record<string, Set<string>>> = {};
        
        // Globals (Tendência Total)
        const embGlobalDefectsMap: Record<string, number> = {};
        const embGlobalBoatsMap: Record<string, Set<string>> = {};
        const ftrGlobalZeroMap: Record<string, Set<string>> = {};
        const ftrGlobalTotalMap: Record<string, Set<string>> = {};
        const pdGlobalMap: Record<string, number> = {};

        const linhasSet = new Set<string>();

        rolling6DaysList.forEach(d => {
            embalamentoMap[d] = {};
            embalamentoBoatsMap[d] = {};
            testesMap[d] = {};
            pdMap[d] = {};
            ftrZeroMap[d] = {};
            ftrTotalMap[d] = {};
            
            embGlobalDefectsMap[d] = 0;
            embGlobalBoatsMap[d] = new Set();
            ftrGlobalZeroMap[d] = new Set();
            ftrGlobalTotalMap[d] = new Set();
            pdGlobalMap[d] = 0;
        });

        filteredAudits.forEach(a => {
            if (!a.fail_date || !a.linha_linha) return;
            const dStr = a.fail_date.split('T')[0];
            if (!rolling6Days.has(dStr)) return;

            const sub = (a.substation_name || '').toLowerCase();
            const linha = a.linha_linha.trim();
            const seccao = (a.seccao || '').toLowerCase();
            const boatId = a.boat_id || 'unknown';

            linhasSet.add(linha);

            // Embalamento (Volume de Defeitos -> converted to PDU later)
            if (sub.includes('final embalamento')) {
                embalamentoMap[dStr][linha] = (embalamentoMap[dStr][linha] || 0) + (a.count_of_defects || 0);
                if(!embalamentoBoatsMap[dStr][linha]) embalamentoBoatsMap[dStr][linha] = new Set();
                embalamentoBoatsMap[dStr][linha].add(boatId);
            }

            // Testes Funcionais (FTR - First Time Rate %)
            if (sub.includes('testes funcionais')) {
                if(!ftrTotalMap[dStr][linha]) ftrTotalMap[dStr][linha] = new Set();
                ftrTotalMap[dStr][linha].add(boatId);
                ftrGlobalTotalMap[dStr].add(boatId);

                if (seccao.includes('zero') || seccao.includes('100%')) {
                    if(!ftrZeroMap[dStr][linha]) ftrZeroMap[dStr][linha] = new Set();
                    ftrZeroMap[dStr][linha].add(boatId);
                    ftrGlobalZeroMap[dStr].add(boatId);
                }
            }

            // P&D (Volume de Defeitos)
            if (sub.includes('p&d') || sub.endsWith('p&d')) {
                pdMap[dStr][linha] = (pdMap[dStr][linha] || 0) + (a.count_of_defects || 0);
                pdGlobalMap[dStr] += (a.count_of_defects || 0);
            }
        });

        // Compile FTR Percentages & Embalamento PDUs
        rolling6DaysList.forEach(d => {
            let embSumPDU = 0;
            let embActiveLines = 0;
            
            let ftrSumPct = 0;
            let ftrActiveLines = 0;

            linhasSet.forEach(linha => {
                // Testes Funcionais (FTR)
                const totalBoats = ftrTotalMap[d][linha] ? ftrTotalMap[d][linha].size : 0;
                if (totalBoats > 0) {
                    const zeroBoats = ftrZeroMap[d][linha] ? ftrZeroMap[d][linha].size : 0;
                    const ftrVal = Math.round((zeroBoats / totalBoats) * 100);
                    testesMap[d][linha] = ftrVal;
                    ftrSumPct += ftrVal;
                    ftrActiveLines++;
                } else {
                    delete testesMap[d][linha]; // Exclude line from day if no data
                }
                
                // Embalamento (PDU: Per Defect Unit)
                const embBoats = embalamentoBoatsMap[d][linha] ? embalamentoBoatsMap[d][linha].size : 0;
                if (embBoats > 0) {
                    const embDefects = embalamentoMap[d][linha] || 0;
                    const pduVal = Number((embDefects / embBoats).toFixed(2));
                    embalamentoMap[d][linha] = pduVal;
                    embSumPDU += pduVal;
                    embActiveLines++;
                } else {
                    delete embalamentoMap[d][linha]; // Exclude line from day if no data
                }
            });
            
            // Global Calcs (Tendência Global da Fábrica exclui as Linhas inativas matematicamente)
            if (embActiveLines > 0) {
                embalamentoMap[d]['Tendência Global'] = Number((embSumPDU / embActiveLines).toFixed(2));
            }
            if (ftrActiveLines > 0) {
                testesMap[d]['Tendência Global'] = Math.round(ftrSumPct / ftrActiveLines);
            }
        });

        const formatLineData = (map: Record<string, Record<string, number>>) => {
            return rolling6DaysList.map(date => {
                const [y, m, day] = date.split('-');
                return { name: `${day}/${m}`, ...map[date] };
            });
        };

        return { 
            chartEmbalamento: formatLineData(embalamentoMap),
            chartTestes: formatLineData(testesMap),
            chartPD: formatLineData(pdMap),
            uniqueChartLinhas: Array.from(linhasSet).sort()
        };
    }, [filteredAudits, rolling6Days, rolling6DaysList]);

    // Chart: Substation Name
    const chartDataSubstation = useMemo(() => {
        const agp = filteredAudits.reduce((acc, curr) => {
            const sub = curr.substation_name || curr.lista_categoria || 'N/A';
            acc[sub] = (acc[sub] || 0) + (curr.count_of_defects || 0);
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(agp)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredAudits]);

    // Chart: Lista Sub
    const chartDataListaSub = useMemo(() => {
        const agp = filteredAudits.reduce((acc, curr) => {
            const sub = curr.lista_sub || 'N/A';
            acc[sub] = (acc[sub] || 0) + (curr.count_of_defects || 0);
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(agp)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredAudits]);

    // Helper to get array of dates between two dates
    const getDaysArray = (s: string, e: string) => {
        if (!s || !e) return [];
        const [sy, sm, sd] = s.split('-');
        const [ey, em, ed] = e.split('-');
        const a = [];
        for(let d = new Date(Number(sy), Number(sm)-1, Number(sd)); d <= new Date(Number(ey), Number(em)-1, Number(ed)); d.setDate(d.getDate() + 1)) {
            const yy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            a.push(`${yy}-${mm}-${dd}`);
        }
        return a;
    };

    // Trend Graph: Date vs Categoria (LineChart)
    const chartDataTrend = useMemo(() => {
        const lineMap: Record<string, Record<string, number>> = {};
        const categories = new Set<string>();

        // 1. Gather all unique categories and find date boundaries if global dates are empty
        let minD = '9999-12-31';
        let maxD = '0000-01-01';
        
        filteredAudits.forEach(a => {
            categories.add(a.lista_categoria || 'Outros');
            if(a.fail_date) {
                const dStr = a.fail_date.split('T')[0];
                if(dStr < minD) minD = dStr;
                if(dStr > maxD) maxD = dStr;
            }
        });

        const effectiveStart = startDate || (minD !== '9999-12-31' ? minD : '');
        const effectiveEnd = endDate || (maxD !== '0000-01-01' ? maxD : '');

        // 2. Initialize the entire matrix with 0 to prevent Recharts from breaking the timeline
        if (effectiveStart && effectiveEnd) {
            getDaysArray(effectiveStart, effectiveEnd).forEach(d => {
                lineMap[d] = {};
                categories.forEach(c => lineMap[d][c] = 0);
            });
        }

        // 3. Populate sums
        filteredAudits.forEach(a => {
            if(!a.fail_date) return;
            const dateStr = a.fail_date.split('T')[0];
            const cat = a.lista_categoria || 'Outros';

            if(!lineMap[dateStr]) lineMap[dateStr] = {};
            if(lineMap[dateStr][cat] === undefined) lineMap[dateStr][cat] = 0;
            lineMap[dateStr][cat] += (a.count_of_defects || 0);
        });

        return {
            data: Object.entries(lineMap)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([name, cats]) => ({ name, ...cats })),
            categories: Array.from(categories)
        };
    }, [filteredAudits, startDate, endDate]);

    // Trend Graph: Daily Substation separated by Line 
    const chartDataDailySubstation = useMemo(() => {
        const lineMap: Record<string, Record<string, number>> = {};
        const linhasSet = new Set<string>();

        // 1. Gather all unique linhas and find boundaries
        let minD = '9999-12-31';
        let maxD = '0000-01-01';
        
        filteredAudits.forEach(a => {
            linhasSet.add(a.linha_linha || 'Outra Linha');
            if(a.fail_date) {
                const dStr = a.fail_date.split('T')[0];
                if(dStr < minD) minD = dStr;
                if(dStr > maxD) maxD = dStr;
            }
        });

        const effectiveStart = startDate || (minD !== '9999-12-31' ? minD : '');
        const effectiveEnd = endDate || (maxD !== '0000-01-01' ? maxD : '');

        // 2. Initialize matrix with 0
        if (effectiveStart && effectiveEnd) {
            getDaysArray(effectiveStart, effectiveEnd).forEach(d => {
                lineMap[d] = {};
                linhasSet.forEach(l => lineMap[d][l] = 0);
            });
        }

        // 3. Populate sums
        filteredAudits.forEach(a => {
            if(!a.fail_date) return;
            const dateStr = a.fail_date.split('T')[0];
            const linha = a.linha_linha || 'Outra Linha';

            if(!lineMap[dateStr]) lineMap[dateStr] = {};
            if(lineMap[dateStr][linha] === undefined) lineMap[dateStr][linha] = 0;
            lineMap[dateStr][linha] += (a.count_of_defects || 0);
        });

        return {
            data: Object.entries(lineMap)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([name, linhas]) => ({ name, ...linhas })),
            linhas: Array.from(linhasSet)
        };
    }, [filteredAudits, startDate, endDate]);

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header Mestre NASA Style */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 absolute pointer-events-none"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Activity className="text-cyan-400" size={32} />
                        QCIS Quality Analytics
                    </h1>
                    <p className="text-slate-400 font-medium mt-2 max-w-xl">
                        Monitorização de auditorias, rastreabilidade de defeitos e inteligência estatística de inspeção com origem no ecossistema SAP da Brunswick.
                    </p>
                </div>
                
                {/* Controladores Globais */}
                <div className="relative z-10 flex flex-wrap gap-3 items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 px-2 text-slate-300">
                        <Filter size={16} /> <span className="text-sm font-bold uppercase tracking-wider">Filtros</span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-700">
                        <select 
                            value={startDate ? startDate.substring(0,7) : ""}
                            onChange={e => {
                                if(!e.target.value) {
                                    setStartDate('');
                                    setEndDate('');
                                    return;
                                }
                                const [y, m] = e.target.value.split('-');
                                const firstDay = new Date(Number(y), Number(m)-1, 1).toISOString().split('T')[0];
                                const lastDay = new Date(Number(y), Number(m), 0).toISOString().split('T')[0];
                                setStartDate(firstDay);
                                setEndDate(lastDay);
                            }}
                            className="bg-transparent text-white text-sm px-2 py-1 cursor-pointer focus:outline-none"
                            title="Mês Específico"
                        >
                            <option value="">Todo o Histórico</option>
                            {monthsDropdown.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                        </select>
                        <div className="h-4 w-px bg-slate-700"></div>
                        <input 
                            type="date" 
                            title="Data Inicial"
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)}
                            className="bg-transparent text-white text-sm px-2 py-1 cursor-pointer focus:outline-none"
                        />
                        <span className="text-slate-500 text-xs">até</span>
                        <input 
                            type="date" 
                            title="Data Final"
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)}
                            className="bg-transparent text-white text-sm px-2 py-1 cursor-pointer focus:outline-none"
                        />
                    </div>
                    
                    <select 
                        value={filterCategoria} 
                        onChange={e => setFilterCategoria(e.target.value)}
                        className="bg-slate-900 text-white border-slate-700 rounded-lg text-sm px-3 py-2 cursor-pointer focus:ring-1 focus:ring-cyan-500"
                    >
                        <option value="">Todas Categorias</option>
                        {categoriasUnicas.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    
                    <select 
                        value={filterArea} 
                        onChange={e => setFilterArea(e.target.value)}
                        className="bg-slate-900 text-white border-slate-700 rounded-lg text-sm px-3 py-2 cursor-pointer focus:ring-1 focus:ring-cyan-500"
                    >
                        <option value="">Todas Áreas</option>
                        {areasUnicas.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>

                    <select 
                        value={filterSubstation} 
                        onChange={e => setFilterSubstation(e.target.value)}
                        className="bg-slate-900 text-white border-slate-700 rounded-lg text-sm px-3 py-2 cursor-pointer focus:ring-1 focus:ring-cyan-500 max-w-xs truncate"
                    >
                        <option value="">Todas Substations</option>
                        {substationUnicas.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>

                    <select 
                        value={filterLinha} 
                        onChange={e => setFilterLinha(e.target.value)}
                        className="bg-slate-900 text-white border-slate-700 rounded-lg text-sm px-3 py-2 cursor-pointer focus:ring-1 focus:ring-cyan-500"
                    >
                        <option value="">Todas Linhas</option>
                        {linhasUnicas.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>

                    <select 
                        value={filterModelo} 
                        onChange={e => setFilterModelo(e.target.value)}
                        className="bg-slate-900 text-white border-slate-700 rounded-lg text-sm px-3 py-2 cursor-pointer focus:ring-1 focus:ring-cyan-500"
                    >
                        <option value="">Todos Modelos</option>
                        {modelosUnicos.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>

                    <select 
                        value={filterGate} 
                        onChange={e => setFilterGate(e.target.value)}
                        className="bg-slate-900 text-white border-slate-700 rounded-lg text-sm px-3 py-2 cursor-pointer focus:ring-1 focus:ring-cyan-500"
                    >
                        <option value="">Todos Gates</option>
                        {gatesUnicos.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <Activity size={16} className="text-emerald-500"/> DPU Global
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black text-white">{dpu}</div>
                        <p className="text-slate-500 text-xs mt-2">Defeitos por Unidade no período</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <ShieldAlert size={16} className="text-rose-500"/> Volume Total (Qtd. Defeitos)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black text-white">{totalDefeitos}</div>
                        <p className="text-slate-500 text-xs mt-2">Correlacionado às amostras filtradas</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <AlertTriangle size={16} className="text-amber-500"/> Top 3 Boat ID Crítico
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 relative z-10">
                        {top3Boats.length > 0 ? (
                            top3Boats.map((boat, idx) => (
                                <div key={boat[0]} className="flex items-center justify-between border-b border-slate-800/50 pb-1 last:border-0">
                                    <span className="text-sm font-bold text-amber-400">{idx + 1}. {boat[0]}</span>
                                    <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded">{boat[1]} defs</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-slate-500">Nenhum registo</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <Layers size={16} className="text-cyan-500"/> Total Barcos Únicos (HINs)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black text-white">{totalBarcosUnicos}</div>
                        <p className="text-slate-500 text-xs mt-2">Cascos isolados neste período</p>
                    </CardContent>
                </Card>
            </div>

            {/* Graficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                            <BarChart3 className="text-cyan-400" /> Pareto: Detratores por Descrição de Defeito
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[600px] pr-2 
                        [&::-webkit-scrollbar]:w-1.5
                        [&::-webkit-scrollbar-track]:bg-slate-900/50
                        [&::-webkit-scrollbar-track]:rounded-full
                        [&::-webkit-scrollbar-thumb]:bg-gradient-to-b
                        [&::-webkit-scrollbar-thumb]:from-cyan-500
                        [&::-webkit-scrollbar-thumb]:to-blue-600
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        hover:[&::-webkit-scrollbar-thumb]:from-cyan-400
                        hover:[&::-webkit-scrollbar-thumb]:to-blue-500
                        transition-all
                    ">
                        {chartDataDefeitos.length > 0 ? (
                            <div style={{ height: Math.max(320, chartDataDefeitos.length * 40), width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartDataDefeitos} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis type="number" stroke="#475569" />
                                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={280} tick={{fill: '#cbd5e1', textAnchor: 'start', dx: -270}} />
                                        <Tooltip 
                                            cursor={{fill: '#1e293b'}} 
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                                            {chartDataDefeitos.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#f43f5e' : index === 1 ? '#f59e0b' : '#0ea5e9'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-slate-600">Sem dados para o filtro</div>
                        )}
                    </CardContent>
                </Card>

                {/* Heatmap: Gate vs Timeline */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                            <Activity className="text-amber-400" /> Heatmap Temporal: Quality Gate vs Datas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-x-auto 
                        [&::-webkit-scrollbar]:h-2
                        [&::-webkit-scrollbar-track]:bg-slate-900/50
                        [&::-webkit-scrollbar-track]:rounded-full
                        [&::-webkit-scrollbar-thumb]:bg-gradient-to-r
                        [&::-webkit-scrollbar-thumb]:from-amber-500
                        [&::-webkit-scrollbar-thumb]:to-amber-800
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        hover:[&::-webkit-scrollbar-thumb]:from-amber-400
                        hover:[&::-webkit-scrollbar-thumb]:to-amber-600
                    ">
                        <table className="w-full text-sm text-center text-slate-300 min-w-max">
                            <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 border-b border-r border-slate-700 text-left sticky left-0 bg-slate-900/90 backdrop-blur-sm z-20 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">Quality Gate</th>
                                    {heatMapDates.map(d => {
                                        const [y, m, day] = d.split('-');
                                        return (
                                            <th key={d} className="px-3 py-3 border-b border-slate-700 whitespace-nowrap min-w-[50px]">
                                                {`${day}/${m}`}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {heatMapData.map((row) => {
                                    const getColor = (val: number) => {
                                        if (!val || val === 0) return 'bg-transparent text-slate-600';
                                        if (val < 3) return 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold rounded-lg';
                                        if (val < 10) return 'bg-amber-500/50 text-white border border-amber-500/70 font-bold shadow-lg shadow-amber-500/20 rounded-lg';
                                        return 'bg-amber-600 text-white border border-amber-500 font-black shadow-xl shadow-amber-600/40 rounded-lg scale-110 z-10';
                                    };

                                    return (
                                        <tr key={row.gate} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                            <td className="px-4 py-3 font-semibold text-slate-200 text-left border-r border-slate-800/50 sticky left-0 bg-slate-900/90 backdrop-blur-sm z-20 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
                                                {row.gate}
                                            </td>
                                            {heatMapDates.map(d => {
                                                const val = row[d] || 0;
                                                return (
                                                    <td key={d} className="px-1 py-1">
                                                        <div className={`w-full h-full min-h-[32px] flex items-center justify-center transition-all ${getColor(val)}`}>
                                                            {val > 0 ? val : '-'}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {heatMapData.length === 0 && (
                            <div className="h-40 flex items-center justify-center text-slate-600">Sem dados analíticos</div>
                        )}
                    </CardContent>
                </Card>

                {/* Heatmap: Gate vs Timeline is now above, next is Embalamento */}
                {/* Rolling 6 Days Substation Trend Flow Charts */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col col-span-1 lg:col-span-2">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                            <Activity className="text-cyan-400" /> Inspecção Final Embalamento (Últ. 6 Dias)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        {chartEmbalamento.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartEmbalamento} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} tick={{ fill: '#cbd5e1' }} />
                                    <YAxis stroke="#94a3b8" fontSize={11} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    {uniqueChartLinhas.map((linha, idx) => (
                                        <Line key={linha} type="monotone" dataKey={linha} name={linha} stroke={`hsl(${idx * (360 / uniqueChartLinhas.length)}, 70%, 50%)`} strokeWidth={2} strokeOpacity={0.6} dot={{ r: 3, fill: '#0f172a', strokeWidth: 1 }} activeDot={{ r: 5 }} />
                                    ))}
                                    <Line type="monotone" dataKey="Tendência Global" name="Tendência Global" stroke="#fbbf24" strokeWidth={5} dot={{ r: 5, fill: '#0f172a', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-600">Sem dados analíticos</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                            <Activity className="text-emerald-400" /> FTR - Testes Funcionais (Últ. 6 Dias)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        {chartTestes.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartTestes} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} tick={{ fill: '#cbd5e1' }} />
                                    <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} stroke="#94a3b8" fontSize={11} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} formatter={(value: any) => [`${value}%`, '']} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    {uniqueChartLinhas.map((linha, idx) => (
                                        <Line key={linha} type="monotone" dataKey={linha} name={linha} stroke={`hsl(${idx * (360 / uniqueChartLinhas.length)}, 70%, 50%)`} strokeWidth={2} strokeOpacity={0.6} dot={{ r: 3, fill: '#0f172a', strokeWidth: 1 }} activeDot={{ r: 5 }} />
                                    ))}
                                    <Line type="monotone" dataKey="Tendência Global" name="Tendência Global" stroke="#fbbf24" strokeWidth={5} dot={{ r: 5, fill: '#0f172a', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-600">Sem dados analíticos</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl col-span-1 lg:col-span-2 flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                            <Activity className="text-fuchsia-400" /> P&D (Últ. 6 Dias)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        {chartPD.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartPD} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} tick={{ fill: '#cbd5e1' }} />
                                    <YAxis stroke="#94a3b8" fontSize={11} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    {uniqueChartLinhas.map((linha, idx) => (
                                        <Line key={linha} type="monotone" dataKey={linha} name={linha} stroke={`hsl(${idx * (360 / uniqueChartLinhas.length)}, 70%, 50%)`} strokeWidth={2} strokeOpacity={0.6} dot={{ r: 3, fill: '#0f172a', strokeWidth: 1 }} activeDot={{ r: 5 }} />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-600">Sem dados analíticos</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Graficos Adicionais (Trend, Substation, Lista Sub) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-900 border-slate-800 shadow-xl col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                            <Activity className="text-emerald-400" /> Trend Cronológico (Evolução por Categoria)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-96">
                        {chartDataTrend.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartDataTrend.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                                    <YAxis stroke="#94a3b8" fontSize={11} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    {chartDataTrend.categories.map((cat, idx) => (
                                        <Line 
                                            key={cat}
                                            type="monotone" 
                                            dataKey={cat} 
                                            name={cat}
                                            stroke={`hsl(${idx * (360 / chartDataTrend.categories.length)}, 70%, 50%)`} 
                                            strokeWidth={3}
                                            dot={{ r: 3, fill: '#0f172a', strokeWidth: 2 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-600">Sem dados cronológicos suficientes</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                            <Activity className="text-blue-400" /> Acompanhamento Diário Substation (por Linha)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-96">
                        {chartDataDailySubstation.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartDataDailySubstation.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                                    <YAxis stroke="#94a3b8" fontSize={11} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    {chartDataDailySubstation.linhas.map((l, idx) => (
                                        <Line 
                                            key={l}
                                            type="monotone" 
                                            dataKey={l} 
                                            name={`Linha ${l}`}
                                            stroke={`hsl(${idx * (360 / Math.max(chartDataDailySubstation.linhas.length, 1))}, 70%, 60%)`} 
                                            strokeWidth={3}
                                            dot={{ r: 3, fill: '#0f172a', strokeWidth: 2 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-600">Sem dados cronológicos suficientes</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                            <BarChart3 className="text-violet-400" /> Top Audit Substation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[500px] pr-2">
                        {chartDataSubstation.length > 0 ? (
                            <div style={{ height: Math.max(320, chartDataSubstation.length * 40), width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartDataSubstation} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                        <XAxis type="number" stroke="#475569" />
                                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={120} />
                                        <Tooltip 
                                            cursor={{fill: '#1e293b'}} 
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-slate-600">Sem dados para a Substation</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                            <BarChart3 className="text-amber-400" /> Top Origem (Lista Sub)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[500px] pr-2">
                        {chartDataListaSub.length > 0 ? (
                            <div style={{ height: Math.max(320, chartDataListaSub.length * 40), width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartDataListaSub} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                        <XAxis type="number" stroke="#475569" />
                                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={120} />
                                        <Tooltip 
                                            cursor={{fill: '#1e293b'}} 
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="value" fill="#fbbf24" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-slate-600">Sem dados para a Lista Sub</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Log Book Principal */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                    <Input
                        placeholder="Pesquisar Boat ID ou sintoma exacto (ex: risco)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    />
                </div>
                <div className="overflow-x-auto max-h-[600px]">
                    <Table>
                        <TableHeader className="bg-slate-950 sticky top-0 z-20">
                            <TableRow className="border-slate-800 hover:bg-slate-950">
                                <TableHead className="font-bold text-slate-400 uppercase text-xs">Data Aud.</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-xs">Boat ID</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-xs">Gate</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-xs">Auditoria (Substation)</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-xs">Área Origem</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-xs">Defeito</TableHead>
                                <TableHead className="text-right font-bold text-slate-400 uppercase text-xs">Qtd</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-slate-500 bg-slate-900 mt-10 p-10">
                                        <Activity className="mx-auto h-8 w-8 text-cyan-500 animate-pulse mb-2" />
                                        Sintonizando frequências de Qualidade...
                                    </TableCell>
                                </TableRow>
                            ) : filteredAudits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-slate-600 bg-slate-900 font-medium">
                                        <AlertCircle className="mx-auto h-12 w-12 text-slate-700 mb-3" />
                                        Limpo. Sem anomalias registadas sob este espetro.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAudits.slice(0, 150).map((audit) => (
                                    <TableRow key={audit.id} className="border-slate-800/80 hover:bg-slate-800/50 transition-colors">
                                        <TableCell className="text-slate-400 font-mono text-sm whitespace-nowrap">
                                            {audit.fail_date ? new Date(audit.fail_date).toLocaleDateString() : '--'}
                                        </TableCell>
                                        <TableCell className="font-black text-white">{audit.boat_id}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-slate-600 text-slate-300 bg-slate-800">
                                                {audit.lista_gate || '--'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-300">{audit.substation_name || audit.lista_categoria}</TableCell>
                                        <TableCell className="text-amber-400 text-sm font-semibold">{audit.lista_sub || audit.responsible_area}</TableCell>
                                        <TableCell className="text-slate-400 max-w-sm truncate" title={audit.defect_comment || audit.defect_description}>
                                            <span className="text-slate-200 font-bold">{audit.defect_description}</span>
                                            {audit.defect_comment && <span className="ml-2 italic text-slate-500">({audit.defect_comment})</span>}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-rose-400 font-bold">
                                            {audit.count_of_defects}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

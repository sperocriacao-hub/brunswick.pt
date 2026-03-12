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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Sector } from 'recharts';

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

    const loadData = async () => {
        setIsLoading(true);
        const res = await fetchQcisData();
        if (res.success && res.data) {
            setAudits(res.data as QcisAudit[]);
        } else {
            setAudits([]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Extrair opções únicas para os dropdowns de filtro
    const modelosUnicos = Array.from(new Set(audits.map(a => a.model_ref).filter(Boolean)));
    const linhasUnicas = Array.from(new Set(audits.map(a => a.linha_linha).filter(Boolean)));
    const gatesUnicos = Array.from(new Set(audits.map(a => a.lista_gate).filter(Boolean)));

    // Aplicar Filtros ao Dataset Principal
    const filteredAudits = useMemo(() => {
        return audits.filter(a => {
            const matchSearch = a.boat_id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                a.defect_comment?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchModelo = filterModelo ? a.model_ref === filterModelo : true;
            const matchLinha = filterLinha ? a.linha_linha === filterLinha : true;
            const matchGate = filterGate ? a.lista_gate === filterGate : true;
            
            return matchSearch && matchModelo && matchLinha && matchGate;
        });
    }, [audits, searchTerm, filterModelo, filterLinha, filterGate]);

    // KPI 1: Total Defeitos
    const totalDefeitos = filteredAudits.reduce((acc, curr) => acc + (curr.count_of_defects || 0), 0);
    
    // KPI 2: Top Model Offender
    const conteioPorModelo = filteredAudits.reduce((acc, curr) => {
        if(curr.model_ref) acc[curr.model_ref] = (acc[curr.model_ref] || 0) + (curr.count_of_defects || 0);
        return acc;
    }, {} as Record<string, number>);
    const topModelo = Object.entries(conteioPorModelo).sort((a,b) => b[1] - a[1])[0] || ['-', 0];

    // Gráfico 1: Pareto por Categoria (Top 10)
    const chartDataCategorias = useMemo(() => {
        const agp = filteredAudits.reduce((acc, curr) => {
            const cat = curr.lista_categoria || 'Não Categorizado';
            acc[cat] = (acc[cat] || 0) + (curr.count_of_defects || 0);
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(agp)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [filteredAudits]);

    // Heatmap Approximation (Cross: Gate vs Dia da Semana)
    const heatMapData = useMemo(() => {
        const map: Record<string, Record<string, number>> = {};
        
        filteredAudits.forEach(a => {
            if(!a.fail_date || !a.lista_gate) return;
            const gate = a.lista_gate;
            const diaSemana = new Date(a.fail_date).toLocaleDateString('pt-PT', { weekday: 'short' });
            
            if(!map[gate]) map[gate] = { 'seg': 0, 'ter': 0, 'qua': 0, 'qui': 0, 'sex': 0 };
            if(map[gate][diaSemana] !== undefined) {
                map[gate][diaSemana] += a.count_of_defects || 0;
            }
        });
        
        return Object.entries(map).map(([gate, dias]) => ({
            gate, 
            seg: dias.seg, 
            ter: dias.ter, 
            qua: dias.qua, 
            qui: dias.qui, 
            sex: dias.sex 
        }));
    }, [filteredAudits]);

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <AlertTriangle size={16} className="text-amber-500"/> Top Modelo Crítico
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-amber-400">{topModelo[0]}</div>
                        <p className="text-slate-500 text-xs mt-2">Responsável por {topModelo[1]} defeitos registados</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <Layers size={16} className="text-cyan-500"/> Volume de Ocorrências (HINs)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black text-white">{filteredAudits.length}</div>
                        <p className="text-slate-500 text-xs mt-2">Linhas individuais de auditoria</p>
                    </CardContent>
                </Card>
            </div>

            {/* Graficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                            <BarChart3 className="text-cyan-400" /> Pareto: Detratores por Categoria
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        {chartDataCategorias.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartDataCategorias} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                                    <XAxis type="number" stroke="#475569" />
                                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                                    <Tooltip 
                                        cursor={{fill: '#1e293b'}} 
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                                        {chartDataCategorias.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#f43f5e' : index === 1 ? '#f59e0b' : '#0ea5e9'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-600">Sem dados para o filtro</div>
                        )}
                    </CardContent>
                </Card>

                {/* Heatmap Custom */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                            <Activity className="text-rose-400" /> Heatmap: Gate vs Dia da Semana
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-300">
                            <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 border-b border-slate-700">Quality Gate</th>
                                    <th className="px-4 py-3 border-b border-slate-700 text-center">Seg</th>
                                    <th className="px-4 py-3 border-b border-slate-700 text-center">Ter</th>
                                    <th className="px-4 py-3 border-b border-slate-700 text-center">Qua</th>
                                    <th className="px-4 py-3 border-b border-slate-700 text-center">Qui</th>
                                    <th className="px-4 py-3 border-b border-slate-700 text-center">Sex</th>
                                </tr>
                            </thead>
                            <tbody>
                                {heatMapData.map((row) => {
                                    // Helper function to color the cell bg based on value
                                    const getColor = (val: number) => {
                                        if (val === 0) return 'bg-transparent text-slate-600';
                                        if (val < 3) return 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold rounded-lg';
                                        if (val < 10) return 'bg-rose-500/50 text-white border border-rose-500/70 font-bold shadow-lg shadow-rose-500/20 rounded-lg';
                                        return 'bg-rose-600 text-white border border-rose-500 font-black shadow-xl shadow-rose-600/40 rounded-lg scale-110 z-10';
                                    };

                                    return (
                                        <tr key={row.gate} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                            <td className="px-4 py-3 font-semibold text-slate-200">{row.gate}</td>
                                            <td className="p-2 text-center"><div className={`py-2 px-1 transition-all ${getColor(row.seg)}`}>{row.seg}</div></td>
                                            <td className="p-2 text-center"><div className={`py-2 px-1 transition-all ${getColor(row.ter)}`}>{row.ter}</div></td>
                                            <td className="p-2 text-center"><div className={`py-2 px-1 transition-all ${getColor(row.qua)}`}>{row.qua}</div></td>
                                            <td className="p-2 text-center"><div className={`py-2 px-1 transition-all ${getColor(row.qui)}`}>{row.qui}</div></td>
                                            <td className="p-2 text-center"><div className={`py-2 px-1 transition-all ${getColor(row.sex)}`}>{row.sex}</div></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {heatMapData.length === 0 && (
                            <div className="h-40 flex items-center justify-center text-slate-600">Sem dados sufucientes</div>
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

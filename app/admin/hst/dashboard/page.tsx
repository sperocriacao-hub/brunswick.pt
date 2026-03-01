'use client';

import React, { useEffect, useState } from 'react';
import { getSafetyCross, SafetyDayInfo } from './actions';
import { ShieldAlert, CalendarDays, AlertTriangle, AlertCircle, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const CROSS_LAYOUT = [
    null, null, 1, 2, 3, null, null,
    null, null, 4, 5, 6, null, null,
    7, 8, 9, 10, 11, 12, 13,
    14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27,
    null, null, 28, 29, 30, null, null,
    null, null, 31, null, null, null, null
];

export default function SafetyCrossDashboard() {
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1); // 1 to 12

    const [crossData, setCrossData] = useState<SafetyDayInfo[]>([]);
    const [kpiAnual, setKpiAnual] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [year, month]);

    async function loadData() {
        setIsLoading(true);
        const res = await getSafetyCross(year, month);
        if (res.success && res.data) {
            setCrossData(res.data);
            setKpiAnual(res.kpiAnual || 0);
        }
        setIsLoading(false);
    }

    // Retorna a cor com base no nível calculado no action
    const getLevelColor = (level: number) => {
        switch (level) {
            case 0: return 'bg-emerald-500 text-white shadow-emerald-500/50'; // Dia Livre (Acidentes=0)
            case 1: return 'bg-yellow-400 text-slate-800 shadow-yellow-400/50'; // Incidente sem gravidade
            case 2: return 'bg-orange-500 text-white shadow-orange-500/50'; // Acidente Sem Baixa
            case 3: return 'bg-red-600 text-white animate-pulse shadow-red-600/50'; // Acidente Com Baixa (Grave)
            case 4: return 'bg-slate-100 text-slate-300 border-slate-200'; // Dia Futuro
            default: return 'bg-slate-100 text-slate-300';
        }
    };

    const getTooltip = (day: number) => {
        const info = crossData.find(d => d.day === day);
        if (!info) return '';
        if (info.level === 4) return 'Dia ainda não decorrido';
        if (info.level === 0) return 'Dia seguro - Zero incidentes';
        return `Nível ${info.level}: ${info.tooltip}\n${info.ocorrenciasStr || ''}`;
    };

    // Contagem Rápida
    const safeDays = crossData.filter(d => d.level === 0).length;
    const futureDays = crossData.filter(d => d.level === 4).length;
    const accidentsThisMonth = crossData.filter(d => d.level === 2 || d.level === 3).length;

    return (
        <div className="p-8 pb-32 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="mb-4 flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <ShieldAlert className="text-rose-600" size={36} />
                        Cruz de Segurança (HST)
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Mural visual de Saúde e Segurança. Um dia verde é uma vitória para todos.
                    </p>
                </div>

                {/* Seletor Mês/Ano */}
                <div className="flex bg-white rounded-lg p-2 shadow-sm border border-slate-200">
                    <select
                        className="bg-transparent text-slate-700 font-bold px-4 py-2 outline-none cursor-pointer"
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                    >
                        {Array.from({ length: 12 }).map((_, i) => {
                            const date = new Date(2000, i, 1);
                            return <option key={i} value={i + 1}>{format(date, 'MMMM', { locale: pt }).toUpperCase()}</option>
                        })}
                    </select>
                    <div className="w-px bg-slate-200 my-2 mx-1"></div>
                    <select
                        className="bg-transparent text-slate-700 font-bold px-4 py-2 outline-none cursor-pointer"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                    >
                        {[year - 1, year, year + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Coluna da Cruz (Esquerda - 3/4) */}
                <div className="lg:col-span-3 flex justify-center items-center p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
                    {isLoading ? (
                        <div className="animate-pulse flex flex-col items-center p-20 text-slate-400">
                            <ShieldAlert size={48} className="mb-4 text-slate-200" />
                            A desenhar métricas...
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-2 sm:gap-4 p-4 w-full max-w-2xl mx-auto">
                            {CROSS_LAYOUT.map((dayNum, idx) => {
                                if (dayNum === null) {
                                    return <div key={`empty-${idx}`} className="w-full aspect-square"></div>;
                                }

                                const info = crossData.find(d => d.day === dayNum);
                                const isHidden = !info; // Ex: Fevereiro não tem dia 30/31

                                if (isHidden) {
                                    return <div key={`hide-${dayNum}`} className="w-full aspect-square"></div>;
                                }

                                const colorClass = getLevelColor(info.level);

                                return (
                                    <div
                                        key={`day-${dayNum}`}
                                        className={`w-full aspect-square flex items-center justify-center rounded-xl shadow-lg border-2 ${colorClass} transition-all duration-300 hover:scale-105 cursor-help relative group`}
                                        title={getTooltip(dayNum)}
                                    >
                                        <span className="text-xl sm:text-3xl font-black">{dayNum}</span>

                                        {/* Fallback Tooltip for Mobile via CSS peer/group */}
                                        <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] w-48 p-2 rounded-md shadow-2xl z-50 left-1/2 -translate-x-1/2">
                                            {info.level === 4 ? 'Dia Futuro' :
                                                info.level === 0 ? 'Nenhum Acidente' :
                                                    <div className="whitespace-pre-wrap">{getTooltip(dayNum)}</div>
                                            }
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Painel Lateral KPIs */}
                <div className="space-y-4">
                    <Card className="shadow-lg border-emerald-100 bg-emerald-50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Award size={64} /></div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-emerald-800 text-sm tracking-widest uppercase flex items-center gap-2">
                                <CalendarDays size={16} /> Dias Seguros
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-extrabold text-emerald-600">
                                {safeDays} <span className="text-lg font-medium text-emerald-600/50">/ {crossData.length - futureDays}</span>
                            </div>
                            <p className="text-xs text-emerald-700 mt-1 font-medium">Dias de {format(new Date(year, month - 1), 'MMM', { locale: pt })} sem incidentes.</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-red-100 bg-red-50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle size={64} /></div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-red-800 text-sm tracking-widest uppercase flex items-center gap-2">
                                <AlertCircle size={16} /> Acidentes (Mês)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-extrabold text-red-600">
                                {accidentsThisMonth}
                            </div>
                            <p className="text-xs text-red-700 mt-1 font-medium">Ocorrências registadas c/ Danos.</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-slate-200">
                        <CardHeader className="pb-2 bg-slate-50 border-b border-slate-100">
                            <CardTitle className="text-slate-700 text-sm tracking-widest uppercase flex items-center gap-2">
                                Resumo Anual HST {year}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex justify-between items-end border-b border-slate-100 pb-3 mb-3">
                                <span className="text-sm font-bold text-slate-500">Total Ocorrências</span>
                                <span className="text-xl font-black text-slate-800">{kpiAnual}</span>
                            </div>
                            <div className="space-y-2 mt-4 text-xs font-semibold">
                                <div className="flex items-center gap-2 text-slate-600"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Zero Entradas (Acidente)</div>
                                <div className="flex items-center gap-2 text-slate-600"><div className="w-3 h-3 rounded-full bg-yellow-400"></div> Incidente/Quase-Acidente</div>
                                <div className="flex items-center gap-2 text-slate-600"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Acidente (Sem Baixa)</div>
                                <div className="flex items-center gap-2 text-slate-600"><div className="w-3 h-3 rounded-full bg-red-600"></div> Acidente (Com Baixa)</div>
                                <div className="flex items-center gap-2 text-slate-400 mt-2"><div className="w-3 h-3 border border-slate-300 rounded-full"></div> Dias não decorridos</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

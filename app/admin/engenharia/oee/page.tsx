'use client';

import { useState, useEffect } from 'react';
import { fetchMicroOEEData } from '@/app/admin/actions';
import { Loader2, AlertTriangle, Clock, RefreshCw, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell } from 'recharts';

export default function OEEPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [tabelaCruzamento, setTabelaCruzamento] = useState<any[]>([]);
    const [gargalos, setGargalos] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const res = await fetchMicroOEEData();
            if (res.success) {
                setTabelaCruzamento(res.tabelaCruzamento || []);
                setGargalos(res.gargalos || []);
            } else {
                setErrorMsg(res.error || 'Erro desconhecido');
            }
        } catch (e: any) {
            setErrorMsg(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Calcula Globais
    const totalProd = tabelaCruzamento.reduce((acc, op) => acc + Number(op.horasProducao), 0);
    const totalPausa = tabelaCruzamento.reduce((acc, op) => acc + Number(op.horasPausa), 0);
    const pieData = [
        { name: 'Produção (Net Time)', value: Number(totalProd.toFixed(1)) },
        { name: 'Desperdício (NVA)', value: Number(totalPausa.toFixed(1)) }
    ];
    const COLORS = ['#22c55e', '#ef4444']; // Verde e Vermelho

    // Prepara dados para o Stacked Bar Chart (Top 10 max view)
    const barData = tabelaCruzamento.slice(0, 10).map(op => ({
        name: op.nome.split(' ')[0], // Primeiro nome
        Produção: Number(op.horasProducao),
        Desperdício: Number(op.horasPausa)
    }));

    return (
        <div className="animate-fade-in p-6 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <BarChart2 className="text-indigo-600" /> Hub Micro-Tempos OEE
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Audite a relação intrínseca entre o esforço real de Produção (Net Time) e os Desperdícios Declarados (NVA) dos últimos 30 dias.
                    </p>
                </div>
                <div>
                    <button
                        onClick={loadData}
                        disabled={isLoading}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                        Recarregar
                    </button>
                </div>
            </header>

            {errorMsg && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-md shadow-sm">
                    <strong>Erro de Integração:</strong> {errorMsg}
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 opacity-50 space-y-4">
                    <Loader2 size={48} className="animate-spin text-indigo-500" />
                    <span className="text-slate-500 font-medium tracking-wider">A calcular matriz algorítmica...</span>
                </div>
            ) : (
                <>
                    {/* Linha Superior - Gráficos Resumo */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                        <div className="glass-panel p-6 flex flex-col items-center justify-center">
                            <h3 className="font-bold text-slate-700 mb-2 w-full text-center border-b border-slate-100 pb-2">
                                Rácio Global (Fábrica)
                            </h3>
                            <div className="w-full h-48 mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => [`${value} Horas`, '']} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel p-6 lg:col-span-2">
                            <h3 className="font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">
                                Contribuição vs Desperdício por Operador (Top 10)
                            </h3>
                            <div className="w-full h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={barData}
                                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}h`} fontSize={12} />
                                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(value: any) => [`${value} Horas`, '']} />
                                        <Legend />
                                        <Bar dataKey="Produção" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                        <Bar dataKey="Desperdício" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* Grelha Master Analítica NVA */}
                        <div className="glass-panel p-0 overflow-hidden xl:col-span-2 flex flex-col">
                            <div className="p-5 border-b border-slate-100 bg-white">
                                <h3 className="font-bold text-slate-800 text-lg">Distribuição Detalhada (NVA)</h3>
                                <p className="text-xs text-slate-500">Métricas analíticas totais por Operador ativo na Base de Dados.</p>
                            </div>
                            <div className="overflow-x-auto flex-1 bg-slate-50/30">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100/50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="px-5 py-3 rounded-tl-lg">Colaborador</th>
                                            <th className="px-5 py-3 text-right text-emerald-600">Produção Pura</th>
                                            <th className="px-5 py-3 text-right text-rose-500">Atrasos (Pausas)</th>
                                            <th className="px-5 py-3 text-right">Carga Total</th>
                                            <th className="px-5 py-3 text-right border-l border-slate-200">Eficiência(%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {tabelaCruzamento.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-slate-400">Sem atividade na fábrica nos últimos 30 dias.</td>
                                            </tr>
                                        ) : (
                                            tabelaCruzamento.map((row, i) => (
                                                <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                                                    <td className="px-5 py-3 font-semibold text-slate-700 flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                                                            {i + 1}
                                                        </div>
                                                        {row.nome}
                                                    </td>
                                                    <td className="px-5 py-3 text-right font-mono font-medium text-emerald-600">{row.horasProducao}h</td>
                                                    <td className="px-5 py-3 text-right font-mono font-medium text-rose-500">{row.horasPausa}h</td>
                                                    <td className="px-5 py-3 text-right font-mono text-slate-600 font-bold">{row.total}h</td>
                                                    <td className="px-5 py-3 text-right border-l border-slate-100">
                                                        <span className={`px-2 py-1 rounded inline-block w-16 text-center font-bold text-xs shadow-sm ${Number(row.eficiencia) >= 80 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                            Number(row.eficiencia) >= 50 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                                'bg-rose-100 text-rose-700 border border-rose-200'
                                                            }`}>
                                                            {row.eficiencia}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Top 5 Gargalos da Semana */}
                        <div className="glass-panel overflow-hidden border border-rose-100 flex flex-col">
                            <div className="p-5 border-b border-rose-100 bg-rose-50">
                                <h3 className="font-bold text-rose-800 text-base flex items-center gap-2">
                                    <AlertTriangle size={18} /> Alertas de Gargalo
                                </h3>
                                <p className="text-xs text-rose-600 mt-1">As 5 O.P.s singulares que mais reteram tempo na fábrica nos últimos 7 dias.</p>
                            </div>
                            <div className="p-0 flex-1 bg-white">
                                {gargalos.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">Nenhum registo de produção excessivo detetado.</div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {gargalos.map((g, i) => (
                                            <div key={i} className="px-5 py-4 hover:bg-rose-50/30 transition-colors flex justify-between items-center group">
                                                <div>
                                                    <div className="font-bold text-slate-700 flex items-center gap-2">
                                                        OP: {g.op_numero}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                        <Clock size={12} className="text-rose-400" /> Passagem na {g.estacao}
                                                    </div>
                                                </div>
                                                <div className="bg-rose-100 text-rose-700 font-mono font-bold px-3 py-1.5 rounded-md text-sm shadow-sm border border-rose-200 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                                    {g.horasGasto}h
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
}

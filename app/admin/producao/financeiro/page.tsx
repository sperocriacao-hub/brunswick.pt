"use client";

import React, { useEffect, useState } from 'react';
import { calculateFinancialDeviations } from '@/app/admin/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, TrendingDown, TrendingUp, Euro, Clock, AlertTriangle } from 'lucide-react';

export default function IndicadoresFinanceirosPage() {
    const [loading, setLoading] = useState(true);
    const [finDados, setFinDados] = useState<any[]>([]);
    const [kpis, setKpis] = useState({
        balancoGlobal: "0.00",
        isBalancoPositivo: true,
        barcosAvaliados: 0
    });

    useEffect(() => {
        calculateFinancialDeviations(30).then((res) => {
            if (res.success && res.data && res.kpis) {
                setFinDados(res.data);
                setKpis(res.kpis);
            } else {
                console.error("Erro a carregar as desvios financeiros", res.error);
            }
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="animate-spin text-slate-300" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 p-4 md:p-8">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">OEE Financeiro (Salários & SLA)</h1>
                <p className="text-slate-500 mt-1 font-medium">Análise de rentabilidade laboral baseada no histórico de produção dos últimos 30 dias.</p>
            </div>

            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={`border-l-4 ${kpis.isBalancoPositivo ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
                    <CardHeader className="pb-2">
                        <CardDescription className="font-semibold uppercase tracking-wider text-xs">Balanço Global (Lucro/Prejuízo OEE)</CardDescription>
                        <CardTitle className={`text-4xl flex items-center gap-2 ${kpis.isBalancoPositivo ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {kpis.isBalancoPositivo ? <TrendingUp size={36} /> : <TrendingDown size={36} />}
                            {kpis.isBalancoPositivo ? "+" : ""}{kpis.balancoGlobal} €
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-500">Diferença entre o Orçamento Planejado (SLA) vs o Custo Efetivo dos Operadores (Salário/Hora).</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="font-semibold uppercase tracking-wider text-xs flex gap-2 items-center"><Clock size={16} /> Barcos Contabilizados</CardDescription>
                        <CardTitle className="text-4xl text-slate-800">{kpis.barcosAvaliados}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-500">Unidades de Produção avaliadas na Janela Temporal.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de Analítica (Ledger) */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg flex gap-2 items-center text-slate-800"><Euro size={18} /> PNL de Intervenção Fabril</CardTitle>
                    <CardDescription>O "Custo Real" tem em conta o Salário/Hora exato de quem picou (RFID) nas estações deste barco multiplicando-o pelo tempo de estada ativo na estação.</CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 border-y border-slate-200">
                            <TableRow>
                                <TableHead className="w-[120px] font-bold text-slate-600 uppercase text-[10px] tracking-wider">HIN / O.P.</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Modelo / Linha</TableHead>
                                <TableHead className="text-right font-bold text-slate-600 uppercase text-[10px] tracking-wider">SLA Planeado (H)</TableHead>
                                <TableHead className="text-right font-bold text-slate-600 uppercase text-[10px] tracking-wider">Tempos Gastos (H)</TableHead>
                                <TableHead className="text-right font-bold text-slate-600 uppercase text-[10px] tracking-wider bg-slate-100">Custo Orçamentado</TableHead>
                                <TableHead className="text-right font-bold text-slate-600 uppercase text-[10px] tracking-wider bg-slate-100">Custo Real (RFID)</TableHead>
                                <TableHead className="text-right font-bold text-slate-600 uppercase text-[10px] tracking-wider">Desvio Financ.</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {finDados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-slate-500 bg-slate-50/50">
                                        Nenhuma métrica financeira calculável nestes 30 dias.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                finDados.map((row) => (
                                    <TableRow key={row.op_id} className={`transition-colors ${!row.isLucro ? 'bg-rose-50/10 hover:bg-rose-50/30' : 'hover:bg-slate-50'}`}>
                                        <TableCell className="font-mono text-xs font-semibold">{row.numero}</TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-slate-800 text-sm">{row.modelo}</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-widest">{row.linha}</div>
                                        </TableCell>
                                        <TableCell className="text-right text-slate-600 font-medium">{row.tempoSLAH}</TableCell>
                                        <TableCell className={`text-right font-bold ${Number(row.tempoRealH) > Number(row.tempoSLAH) ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {row.tempoRealH}
                                        </TableCell>

                                        <TableCell className="text-right text-slate-500 font-mono bg-slate-50/50 border-l border-slate-100">{row.custoPlaneado} €</TableCell>
                                        <TableCell className="text-right text-slate-800 font-mono font-semibold bg-slate-50/50 border-r border-slate-100">{row.custoReal} €</TableCell>

                                        <TableCell className="text-right">
                                            <div className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-xs ${row.isLucro ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                {!row.isLucro && <AlertTriangle size={12} />}
                                                {row.isLucro ? '+' : ''}{row.desvioFinanceiro} €
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}

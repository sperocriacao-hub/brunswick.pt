"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Activity, TrendingUp, TrendingDown, Settings2, ClipboardCheck, Trophy, Target, AlertTriangle, Crosshair } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuditoriasRecentes } from './actions';
import Link from 'next/link';

export default function Dashboard5SPage() {
    const [auditorias, setAuditorias] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        setLoading(true);
        const res = await getAuditoriasRecentes();
        if (res.success) {
            setAuditorias(res.data || []);
        }
        setLoading(false);
    }

    return (
        <div className="p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500 pb-32">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-6 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <Activity className="text-blue-600" size={36} /> Comando Central 5S
                    </h1>
                    <p className="text-lg text-slate-500 mt-1">Monitorização de Cultura Fabril, Disciplina e Limpeza.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/lean/5s/setup">
                        <Button variant="outline" className="font-bold border-blue-200 text-blue-700 hover:bg-blue-50">
                            <Settings2 className="w-5 h-5 mr-2" /> Motor de Checklists
                        </Button>
                    </Link>
                    <Link href="/operador/5s" target="_blank">
                        <Button className="bg-teal-600 hover:bg-teal-700 font-bold shadow-lg shadow-teal-200">
                            <Crosshair className="w-5 h-5 mr-2" /> Abrir Quiosque 5S
                        </Button>
                    </Link>
                </div>
            </header>

            <Tabs defaultValue="historico" className="w-full">
                <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="historico" className="font-bold">Histórico de Rondas</TabsTrigger>
                    <TabsTrigger value="kpis" className="font-bold text-amber-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white">KPIs & Gincana</TabsTrigger>
                </TabsList>

                <TabsContent value="historico">

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : auditorias.length === 0 ? (
                <div className="p-16 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center">
                    <ClipboardCheck className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Fábrica Sem Avaliações</h3>
                    <p>Inicie a primeira ronda na fábrica para mapear a situação de referência (Baserate).</p>
                    <Link href="/operador/5s" target="_blank" className="mt-6">
                        <Button className="bg-teal-600 hover:bg-teal-700">Abrir Quiosque 5S</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {auditorias.map(aud => {
                        const score = Number(aud.percentagem);
                        let colorClass = "border-emerald-200 bg-emerald-50 text-emerald-700";
                        let icon = <TrendingUp className="text-emerald-500" size={24} />;
                        
                        if (score < 80 && score >= 60) {
                            colorClass = "border-amber-200 bg-amber-50 text-amber-700";
                            icon = <TrendingUp className="text-amber-500" size={24} />;
                        } else if (score < 60) {
                            colorClass = "border-rose-200 bg-rose-50 text-rose-700";
                            icon = <TrendingDown className="text-rose-500" size={24} />;
                        }

                        return (
                            <Card key={aud.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <div className={`h-2 w-full \${colorClass.split(' ')[1]}`}></div>
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg">{aud.areas_fabrica?.nome_area}</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                {aud.estacoes?.nome_estacao || 'Avaliação Geral da Área'}
                                            </p>
                                        </div>
                                        {icon}
                                    </div>
                                    
                                    <div className="flex items-end gap-2 mb-4">
                                        <span className={`text-4xl font-black tracking-tighter \${colorClass.split(' ')[2]}`}>
                                            {score.toFixed(0)}%
                                        </span>
                                        <span className="text-sm text-slate-400 font-medium mb-1">Score 5S</span>
                                    </div>

                                    <div className="border-t border-slate-100 pt-4 mt-2 flex justify-between items-center text-xs text-slate-500">
                                        <span>Auditor: <strong className="text-slate-700">{aud.operadores?.nome_operador || 'Sistema'}</strong></span>
                                        <span>{new Date(aud.data_auditoria).toLocaleDateString()}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
            </TabsContent>

            <TabsContent value="kpis" className="space-y-6">
                {auditorias.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-blue-100 font-medium uppercase tracking-widest text-xs mb-1">Média Global 5S</p>
                                            <h3 className="text-5xl font-black">{(auditorias.reduce((a, b) => a + Number(b.percentagem), 0) / auditorias.length).toFixed(0)}%</h3>
                                        </div>
                                        <Activity size={32} className="text-blue-300 opacity-50" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-amber-400 to-amber-600 text-white border-0 shadow-lg relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 opacity-20"><Trophy size={100} /></div>
                                <CardContent className="p-6 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-amber-100 font-medium uppercase tracking-widest text-xs mb-1">Campeão da Gincana</p>
                                            <h3 className="text-2xl font-black leading-tight">
                                                {auditorias.reduce((max, obj) => Number(obj.percentagem) > Number(max.percentagem) ? obj : max, auditorias[0])?.areas_fabrica?.nome_area}
                                            </h3>
                                            <p className="text-amber-100 font-bold mt-2 text-lg">{Math.max(...auditorias.map(a => Number(a.percentagem))).toFixed(0)}% Score</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-rose-500 to-rose-700 text-white border-0 shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-rose-100 font-medium uppercase tracking-widest text-xs mb-1">Maior Foco de Atenção</p>
                                            <h3 className="text-2xl font-black leading-tight">
                                                {auditorias.reduce((min, obj) => Number(obj.percentagem) < Number(min.percentagem) ? obj : min, auditorias[0])?.areas_fabrica?.nome_area}
                                            </h3>
                                            <p className="text-rose-100 font-bold mt-2 text-lg flex items-center gap-2">
                                                <AlertTriangle size={16}/>
                                                {Math.min(...auditorias.map(a => Number(a.percentagem))).toFixed(0)}% Score
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                    <Target className="text-blue-500" size={20} /> Roadmap & Metas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-800">Meta Fabril: 85%</h4>
                                            <p className="text-sm text-slate-500">Objetivo de conformidade global 5S até ao fim do trimestre.</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-blue-600">
                                                {((auditorias.reduce((a, b) => a + Number(b.percentagem), 0) / auditorias.length) >= 85) ? 'Atingido!' : 'Em Curso'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <div className="p-12 text-center text-slate-500">Sem dados suficientes para calcular KPIs.</div>
                )}
            </TabsContent>
            </Tabs>
        </div>
    );
}

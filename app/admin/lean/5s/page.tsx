"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Activity, TrendingUp, TrendingDown, Settings2, ClipboardCheck } from 'lucide-react';
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
                    <Link href="/admin/lean/5s/executar">
                        <Button className="bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200">
                            <ClipboardCheck className="w-5 h-5 mr-2" /> Iniciar Ronda 5S
                        </Button>
                    </Link>
                </div>
            </header>

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : auditorias.length === 0 ? (
                <div className="p-16 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center">
                    <ClipboardCheck className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Fábrica Sem Avaliações</h3>
                    <p>Inicie a primeira ronda na fábrica para mapear a situação de referência (Baserate).</p>
                    <Link href="/admin/lean/5s/executar" className="mt-6">
                        <Button className="bg-blue-600 hover:bg-blue-700">Começar Agora</Button>
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
        </div>
    );
}

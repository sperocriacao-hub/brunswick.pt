'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getMoldesKPIData } from './actions';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Loader2, Activity, Wrench, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

export default function MoldesDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            const res = await getMoldesKPIData();
            if (res.success) {
                setStats(res.data);
            }
            setLoading(false);
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return <div className="p-8 flex justify-center text-slate-500 font-medium"><Loader2 className="animate-spin w-8 h-8" /></div>;
    }

    if (!stats) {
        return <div className="p-8 text-center text-rose-500">Falha ao carregar KPI.</div>;
    }

    const { defectDistribution, problemMolds, globalStatus } = stats;

    return (
        <div className="p-8 space-y-8 pb-32 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500">
            <header className="flex justify-between items-end border-b pb-4 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Inteligência Operacional TPM</h1>
                    <p className="text-lg text-slate-500 mt-1">Análise Crónica de Defeitos e Estrangulamento de Ferramental</p>
                </div>
                <Button variant="outline" onClick={() => router.push('/admin/manutencao/moldes')}>
                    Voltar à Lista TPM
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-sm border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total de Intervenções OEE</CardDescription>
                        <CardTitle className="text-4xl font-black text-slate-800">{globalStatus.total}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 mt-2 text-sm font-medium">
                            <span className="text-rose-500"><Activity className="inline w-4 h-4 mr-1" /> {globalStatus.abertas} Abertas</span>
                            <span className="text-emerald-500"><Wrench className="inline w-4 h-4 mr-1" /> {globalStatus.fechadas} Resolvidas</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Pode ser adicionado cards de Tempo Medio de Resolucao ou Custo Logistico etc */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldAlert className="text-amber-500 w-5 h-5" /> Distribuição de Defeitos Mapeados</CardTitle>
                        <CardDescription>Percentagem histórica dos códigos de anomalia registados no Pin Mapping.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {defectDistribution && defectDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={defectDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {defectDistribution.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`${value} Ocorrências`, 'Frequência']} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">Sem dados de Defeitos Mapeados.</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Top 5 Ferramental Crítico</CardTitle>
                        <CardDescription>Moldes com maior volume de ordens de manutenção levantadas.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {problemMolds && problemMolds.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={problemMolds}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                    layout="vertical"
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="interventions" name="N.º Manutenções" fill="#ef4444" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">Nenhum histórico de manutenção crónico.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

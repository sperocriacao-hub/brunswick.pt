import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCircle2, ArrowLeft, CalendarDays, LineChart as LineChartIcon, Shield, Activity, TrendingUp, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { RadarClientChart } from '@/components/rh/RadarClientChart';
import { LineClientChart } from '@/components/rh/LineClientChart';

export const dynamic = 'force-dynamic';

export default async function PerfilOperadorRH({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch Data
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // 1. Fetch Operador Data
    const { data: operador, error: errOp } = await supabase
        .from('operadores')
        .select('*, areas_fabrica(nome_area)')
        .eq('id', id)
        .single();

    if (errOp || !operador) {
        return notFound();
    }

    // 2. Fetch Last 30 Evaluations
    const { data: avaliacoesRaw } = await supabase
        .from('avaliacoes_diarias')
        .select('*')
        .eq('funcionario_id', id)
        .order('data_avaliacao', { ascending: false })
        .limit(30);

    const avaliacoes = (avaliacoesRaw || []).reverse(); // Order from oldest to newest for the chart

    // Calculate Radar Averages
    const avgScore = {
        hst: 0, epi: 0, limpeza: 0, qualidade: 0, eficiencia: 0, objetivos: 0, atitude: 0
    };

    let totalGlobal = 0;

    if (avaliacoes.length > 0) {
        avaliacoes.forEach(ev => {
            avgScore.hst += ev.nota_hst;
            avgScore.epi += ev.nota_epi;
            avgScore.limpeza += ev.nota_5s;
            avgScore.qualidade += ev.nota_qualidade;
            avgScore.eficiencia += ev.nota_eficiencia;
            avgScore.objetivos += ev.nota_objetivos;
            avgScore.atitude += ev.nota_atitude;

            totalGlobal += (ev.nota_hst + ev.nota_epi + ev.nota_5s + ev.nota_qualidade + ev.nota_eficiencia + ev.nota_objetivos + ev.nota_atitude) / 7;
        });

        // Normalize
        const count = avaliacoes.length;
        Object.keys(avgScore).forEach(k => {
            avgScore[k as keyof typeof avgScore] = Number((avgScore[k as keyof typeof avgScore] / count).toFixed(1));
        });
        totalGlobal = Number((totalGlobal / count).toFixed(1));
    }

    const radarData = [
        { subject: 'HST', A: avgScore.hst, fullMark: 4 },
        { subject: 'EPI', A: avgScore.epi, fullMark: 4 },
        { subject: 'Limpeza/5S', A: avgScore.limpeza, fullMark: 4 },
        { subject: 'Qualidade', A: avgScore.qualidade, fullMark: 4 },
        { subject: 'Eficiência', A: avgScore.eficiencia, fullMark: 4 },
        { subject: 'Objetivos', A: avgScore.objetivos, fullMark: 4 },
        { subject: 'Atitude', A: avgScore.atitude, fullMark: 4 },
    ];

    // Format Data for Line Chart
    const lineData = avaliacoes.map(ev => {
        const dSum = ev.nota_hst + ev.nota_epi + ev.nota_5s + ev.nota_qualidade + ev.nota_eficiencia + ev.nota_objetivos + ev.nota_atitude;
        return {
            date: new Date(ev.data_avaliacao).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
            score: Number((dSum / 7).toFixed(1))
        }
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500 pb-20">
            {/* Header Navigation */}
            <div className="flex items-center justify-between border-b pb-4 border-slate-200">
                <div className="flex items-center gap-4">
                    <a href="/admin/rh/avaliacoes" className="p-2 border rounded-full hover:bg-slate-100 transition-colors text-slate-500">
                        <ArrowLeft size={20} />
                    </a>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            Perfil Gráfico (Raio-X)
                        </h1>
                        <p className="text-slate-500 font-medium text-sm flex items-center gap-2 mt-1">
                            Análise Longitudinal a 30 dias de <span className="font-bold text-blue-600">{operador.nome_operador}</span>
                        </p>
                    </div>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Matrícula</div>
                    <div className="text-xl font-mono font-bold text-slate-800">#{operador.numero_operador}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna 1: Info e Medias */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-white to-slate-50">
                        <CardHeader className="pb-2 border-b border-slate-100">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                <UserCircle2 className="w-5 h-5 text-blue-500" />
                                Identidade Laboral
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-white shadow-md flex items-center justify-center text-blue-600 text-4xl font-extrabold mb-4">
                                    {operador.nome_operador.charAt(0).toUpperCase()}
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 line-clamp-1 w-full">{operador.nome_operador}</h2>
                                <p className="text-slate-500 mt-1">{operador.funcao || 'Operador Padrão'}</p>

                                <Badge variant="secondary" className="mt-4 px-4 py-1 text-sm bg-blue-50 text-blue-700 border-blue-200 shadow-sm">
                                    {(operador.areas_fabrica as any)?.nome_area || 'Linha Geral'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                Média Consolidada (Últ. {avaliacoes.length} dias)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-2">
                                <span className={`text-5xl font-extrabold ${totalGlobal >= 3.5 ? 'text-green-600' : totalGlobal >= 2.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {totalGlobal > 0 ? totalGlobal.toFixed(1) : '--'}
                                </span>
                                <span className="text-slate-400 font-bold mb-1 text-xl">/ 4.0</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Coluna 2: Radar Chart */}
                <Card className="shadow-sm border-slate-200 bg-white lg:col-span-1">
                    <CardHeader className="pb-0">
                        <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            Polígono de Proficiência (Skills)
                        </CardTitle>
                        <CardDescription>Média Absoluta por Pilar de Atuação</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 h-[350px] w-full flex items-center justify-center">
                        {avaliacoes.length > 0 ? (
                            <RadarClientChart data={radarData} />
                        ) : (
                            <div className="text-slate-400 italic">Sem volume de dados para Poli-Análise.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Coluna 3: Line Chart */}
                <Card className="shadow-sm border-slate-200 bg-white lg:col-span-1">
                    <CardHeader className="pb-0">
                        <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
                            <LineChartIcon className="w-5 h-5 text-emerald-500" />
                            Trajetória de Resiliência
                        </CardTitle>
                        <CardDescription>Evolução da Nota Diária (Últimos 30 Dias)</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 h-[350px] w-full flex items-center justify-center">
                        {avaliacoes.length > 1 ? (
                            <LineClientChart data={lineData} />
                        ) : (
                            <div className="text-slate-400 italic text-center text-sm px-4">
                                É necessário um mínimo de 2 dias laborais registados para processar a Função Linear de Tendência.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}

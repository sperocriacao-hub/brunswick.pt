"use client";

import React, { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { UserCircle2, ArrowLeft, AlertTriangle, ChevronRight, Activity } from 'lucide-react';
import Link from 'next/link';
import { buscarPerfilCompetencia } from './actions';

type PerfProps = {
    params: Promise<{ id: string }>;
};

export default function OperadorPerfilPage({ params }: PerfProps) {
    const resolvedParams = React.use(params);
    const id = resolvedParams.id;
    const [isLoading, setIsLoading] = useState(true);
    const [err, setErr] = useState('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [op, setOp] = useState<any>(null);
    const [radarData, setRadarData] = useState([]);
    const [timelineData, setTimelineData] = useState([]);
    const [apontamentos, setApontamentos] = useState([]);

    useEffect(() => {
        carregar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const carregar = async () => {
        setIsLoading(true);
        const res = await buscarPerfilCompetencia(id);

        if (res.success) {
            setOp(res.operador);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setRadarData(res.radarMatriz as any);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setTimelineData(res.historicoEvolutivo as any);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setApontamentos(res.apontamentos as any);
        } else {
            setErr(res.error || 'Erro a carregar as grelhas biológicas');
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return <div className="p-12 text-center opacity-50 flex items-center justify-center gap-3"><Activity className="animate-pulse" /> Decifrando o Perfil de Talento...</div>;
    }

    if (err || !op) {
        return <div className="p-12 text-center text-red-400"><strong>Erro Crítico:</strong> {err || 'Pessoa não encontrada no sistema HR.'}</div>;
    }

    const mGlobalFormat = op.matriz_talento_media ? Number(op.matriz_talento_media).toFixed(1) : 'N/A';

    return (
        <div className="container p-6 animate-fade-in">
            <header className="mb-6 flex justify-between items-start">
                <div className="flex gap-4">
                    <Link href="/admin/rh" className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors text-[var(--primary)] border border-[rgba(255,255,255,0.1)]">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 text-sm text-[var(--accent)] font-mono mb-1">
                            <span>Recursou Humanos</span> <ChevronRight size={14} className="opacity-50" /> <span>ILUO & Performance</span>
                        </div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', margin: 0 }} className="flex gap-3 items-center">
                            {op.nome_operador}
                            {Number(mGlobalFormat) >= 3.5 && <span className="text-[10px] bg-[#f59e0b] text-slate-900 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold -translate-y-1 inline-block">Top Performer</span>}
                        </h1>
                        <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "0.25rem", fontFamily: 'monospace' }}>Crachá Nº {op.numero_operador} | Função Atual: {op.funcao || 'N/A'}</p>
                    </div>
                </div>

                <div className="glass-panel px-6 py-4 flex flex-col items-end border-[rgba(255,255,255,0.05)]" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <span className="text-xs uppercase font-bold tracking-wider opacity-60">Média Vitalícia (0-4)</span>
                    <span className="text-3xl font-black text-[var(--primary)] leading-none mt-1">{mGlobalFormat}</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                {/* RADAR CHART - A ARANHA */}
                <section className="glass-panel p-6 flex flex-col" style={{ minHeight: '400px' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <UserCircle2 size={20} className="text-[#a855f7]" />
                        <h2 className="font-bold text-lg">Perfil Simétrico de Matriz</h2>
                    </div>
                    <p className="text-xs opacity-50 mb-6">Média Agregada por Eixo Curricular desde a Contratação.</p>

                    <div className="flex-1 w-full relative -ml-4">
                        {radarData[0] && radarData[0]['A'] === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center opacity-40 italic">Funcionario aguarda primeira avaliação.</div>
                        ) : (
                            <ResponsiveContainer width={500} height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }} />
                                    <PolarRadiusAxis
                                        angle={30}
                                        domain={[0, 4]}
                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                                        tickCount={5}
                                    />
                                    <Radar name={op.nome_operador} dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.5} strokeWidth={2} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#a855f7' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>

                {/* TIMELINE HISTORICA */}
                <section className="glass-panel p-6 flex flex-col" style={{ minHeight: '400px' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <Activity size={20} className="text-[#3b82f6]" />
                        <h2 className="font-bold text-lg">Evolução do Rendimento Diário</h2>
                    </div>
                    <p className="text-xs opacity-50 mb-6">Tracking da pontuação média nas últimas 30 avaliações sumetidas.</p>

                    <div className="flex-1 w-full">
                        {timelineData.length === 0 ? (
                            <div className="h-full flex items-center justify-center opacity-40 italic">Gráfico Indisponível (Registo Vazio).</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timelineData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="Data" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                    <YAxis domain={[0, 4]} tickCount={5} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#3b82f6', borderRadius: '8px' }}
                                        itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                                    />
                                    <Line type="monotone" dataKey="Média" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>
            </div>

            {/* TABELA DE REGISTO DISCIPLINAR */}
            <section className="glass-panel p-0 overflow-hidden">
                <div className="p-6 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center bg-[rgba(0,0,0,0.2)]">
                    <div>
                        <h2 className="font-bold text-lg flex items-center gap-2 text-red-400">
                            <AlertTriangle size={18} /> Caderneta de Apontamentos (Falhas &lt; 2.0)
                        </h2>
                        <p className="text-xs opacity-60">Histórico inalterável de retificações introduzidas pelo Supervisor de Linha.</p>
                    </div>
                </div>

                <div className="p-6">
                    {apontamentos.length === 0 ? (
                        <div className="text-center py-8 opacity-50 bg-[rgba(255,255,255,0.02)] rounded-lg font-mono text-sm border border-dashed border-[rgba(255,255,255,0.1)]">
                            Este colaborador não tem qualquer infração disciplinar registada.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {apontamentos.map((apt: Record<string, unknown>, i: number) => (
                                <div key={i} className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-3 items-center">
                                            <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold font-mono">KPI: {String(apt.topico_falhado)}</span>
                                            <span className="text-xs opacity-50">Avaliado por {String(apt.supervisor_nome)} • {new Date(String(apt.data_apontamento)).toLocaleDateString()}</span>
                                        </div>
                                        <div className="bg-red-500 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm">
                                            {Number(apt.nota_atribuida).toFixed(1)}
                                        </div>
                                    </div>
                                    <p className="text-sm opacity-90 italic p-3 bg-[rgba(0,0,0,0.3)] rounded mt-1 border border-[rgba(255,255,255,0.05)]">
                                        &quot;{String(apt.justificacao)}&quot;
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

        </div>
    );
}

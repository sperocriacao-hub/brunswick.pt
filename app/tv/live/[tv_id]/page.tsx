'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { AlertTriangle, Clock, Factory, MonitorPlay, ShieldCheck, Trophy, Target, TrendingUp, Zap, Clock4, CheckCircle2 } from 'lucide-react';
import { buscarDashboardsTV } from '../../actions';

// Supabase Anon Client for Websockets Listeners ONLY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CustomTVDashboardPage() {
    const params = useParams();
    const tvId = params.tv_id as string;

    const [nomeTv, setNomeTv] = useState('A CARREGAR...');
    const [alvoNome, setAlvoNome] = useState('SISTEMA INICIALIZANDO');

    // Core Data
    const [barcosAtivos, setBarcosAtivos] = useState<any[]>([]);
    const [alertas, setAlertas] = useState<any[]>([]);
    const [opcoesLayout, setOpcoesLayout] = useState<any>({});
    const [metrics, setMetrics] = useState<any>({ kpiOee: {}, heroiTurno: null, melhorArea: null, gargalos: [] });

    const [refreshTick, setRefreshTick] = useState(0);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!tvId) return;

        async function fetchState() {
            const res = await buscarDashboardsTV(tvId);
            if (res.success && res.config) {
                setNomeTv(res.config.nome_tv);
                setAlvoNome(res.config.nome_alvo_resolvido);
                setBarcosAtivos(res.barcos || []);
                setAlertas(res.alertasGlobais || []);
                setOpcoesLayout(res.config.opcoes_layout || {});
                setMetrics(res.advancedMetrics || {});
            } else {
                setNomeTv("🔴 SINAL PERDIDO");
                setAlvoNome("Esta TV não foi configurada ou perdeu a ligação ao servidor M.E.S.");
            }
        }
        fetchState();
    }, [tvId, refreshTick]);

    useEffect(() => {
        if (!tvId) return;

        const channelAndon = supabase
            .channel(`tv-andon-${tvId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas_andon' }, () => {
                setRefreshTick(t => t + 1);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ordens_producao' }, () => {
                setRefreshTick(t => t + 1);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes_tv', filter: `id=eq.${tvId}` }, () => {
                setRefreshTick(t => t + 1);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channelAndon);
        };
    }, [tvId]);

    const temAlertaCritico = alertas.length > 0;

    if (nomeTv.includes("SINAL PERDIDO")) {
        return (
            <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center p-12 text-slate-500">
                <MonitorPlay size={120} className="mb-8 opacity-20" />
                <h1 className="text-6xl font-black mb-4 uppercase">{nomeTv}</h1>
                <p className="text-3xl font-mono">{alvoNome}</p>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen flex flex-col overflow-hidden selection:bg-rose-500/30 bg-slate-950 text-slate-200">

            {/* --- NASA HUD TOP HEADER --- */}
            <header className="flex items-center justify-between border-b-[4px] border-slate-800 bg-slate-900/50 p-6 shadow-md z-10 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="bg-blue-600 p-4 rounded-2xl shadow-lg border border-blue-400">
                        <Factory size={48} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase text-white truncate max-w-4xl">{alvoNome}</h1>
                        <p className="text-xl text-blue-400 font-bold tracking-widest uppercase flex items-center gap-3">
                            <MonitorPlay size={20} className="text-blue-500" /> M.E.S. DATALINK: {nomeTv}
                        </p>
                    </div>
                </div>

                <div className="flex items-center bg-black/60 border border-slate-700 rounded-2xl px-8 py-4 shadow-[inset_0_4px_10px_rgba(0,0,0,0.6)]">
                    <Clock size={36} className="text-emerald-400 mr-5 animate-pulse" />
                    <span className="text-5xl font-mono font-black tracking-widest text-emerald-400">
                        {time.toLocaleTimeString('pt-PT', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            </header>

            {/* --- MASTER GRID CONTENT --- */}
            <main className="flex-1 overflow-hidden grid grid-cols-12 gap-6 p-6">

                {/* LEFT COL: ORDENS EM CURSO (Production Queue) - Takes 4 cols or 5 cols */}
                <section className="col-span-4 flex flex-col gap-6 overflow-hidden">
                    <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 border-b-2 border-slate-800 pb-2">
                        <Zap size={24} className="text-blue-500" /> Produção Ativa
                    </h2>

                    {barcosAtivos.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-white bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-800">
                            <Factory size={80} className="mb-6 text-slate-600" />
                            <h2 className="text-3xl font-bold tracking-widest uppercase text-slate-500 text-center">
                                SEM BARCOS NA LINHA
                            </h2>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {barcosAtivos.map((barco) => (
                                <div key={barco.id} className="bg-slate-900/80 border border-slate-700 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-sm text-slate-400 font-bold uppercase tracking-widest">HULL ID</h3>
                                            <p className="text-4xl font-black text-white truncate drop-shadow-md">
                                                {barco.hin_hull_id || barco.op_numero}
                                            </p>
                                        </div>
                                        <span className={`text-sm font-black uppercase px-3 py-1 rounded-full border ${barco.status === 'IN_PROGRESS' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-amber-500/20 text-amber-400 border-amber-500/50'}`}>
                                            {barco.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-800">
                                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-1">MODELO</p>
                                        <p className="text-2xl text-blue-300 font-black truncate uppercase">
                                            {barco.modelos?.nome_modelo} <span className="text-slate-600 ml-2">SM {barco.semana_planeada}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* CENTER COL: NASA WIDGETS (Takes 5 columns) */}
                <section className="col-span-5 flex flex-col gap-6 overflow-y-auto pr-2 pb-6">
                    {opcoesLayout.showOeeDay && (
                        <div className="bg-slate-900/80 border border-slate-700/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
                            <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Target size={24} className="text-blue-400" /> Rendimento (OEE) Global
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 flex flex-col items-center justify-center">
                                    <span className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Dia Atual</span>
                                    <span className={`text-6xl font-black ${metrics.kpiOee?.diarioRealizado >= metrics.kpiOee?.diarioObjetivo ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {metrics.kpiOee?.diarioRealizado || 0}%
                                    </span>
                                    <span className="text-slate-600 text-xs mt-1">OBJETIVO: {metrics.kpiOee?.diarioObjetivo || 85}%</span>
                                </div>
                                {opcoesLayout.showOeeMonth && (
                                    <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 flex flex-col items-center justify-center">
                                        <span className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Mês Atual</span>
                                        <span className={`text-6xl font-black ${metrics.kpiOee?.mensalRealizado >= metrics.kpiOee?.mensalObjetivo ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {metrics.kpiOee?.mensalRealizado || 0}%
                                        </span>
                                        <span className="text-slate-600 text-xs mt-1">OBJETIVO: {metrics.kpiOee?.mensalObjetivo || 85}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6 w-full">
                        {opcoesLayout.showWorkerOfMonth && metrics.heroiTurno && (
                            <div className="bg-slate-900/80 border border-slate-700/50 rounded-3xl p-6 shadow-2xl relative flex flex-col justify-between">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                                    <Trophy size={18} /> Herói de Alta-Performance
                                </h2>
                                <div>
                                    <p className="text-3xl font-black text-white leading-none mb-2">{metrics.heroiTurno.nome}</p>
                                    <p className="text-slate-400 text-sm font-mono tracking-widest">ID: {metrics.heroiTurno.numero_operador}</p>
                                </div>
                                <div className="mt-4 inline-block bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-1 self-start">
                                    <span className="text-amber-400 font-black tracking-widest text-sm text-center block">RATE: {metrics.heroiTurno.nota_eficiencia || 95}%</span>
                                </div>
                            </div>
                        )}

                        {opcoesLayout.showSafeArea && metrics.melhorArea && (
                            <div className="bg-slate-900/80 border border-slate-700/50 rounded-3xl p-6 shadow-2xl relative flex flex-col justify-between">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                                    <ShieldCheck size={18} /> Foco de Segurança Zero Acidentes
                                </h2>
                                <div>
                                    <p className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-1">Área Segura (Destaque)</p>
                                    <p className="text-3xl font-black text-white leading-tight">{metrics.melhorArea.nome}</p>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="text-emerald-400 text-2xl font-black">{metrics.melhorArea.score}%</span>
                                    <span className="text-slate-600 text-xs uppercase font-bold max-w-[100px] leading-tight">Score HST Mensal</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {opcoesLayout.showBottlenecks && metrics.gargalos.length > 0 && (
                        <div className="bg-slate-900/80 border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
                            <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                <TrendingUp size={24} className="text-rose-500" /> Radar de Gargalos (Atrasos Físicos)
                            </h2>
                            <div className="space-y-3 mt-2">
                                {metrics.gargalos.map((g: any, i: number) => (
                                    <div key={i} className="bg-slate-950 rounded-xl p-4 border border-rose-900/30 flex justify-between items-center">
                                        <span className="text-lg font-bold text-white uppercase">{g.estacoes?.nome_estacao || 'Desconhecida'}</span>
                                        <span className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-md text-sm font-black tracking-widest">
                                            {g.tipo_alerta}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* RIGHT COL: DEDICATED ANDON SIDEBAR (Takes 3 columns) */}
                <section className="col-span-3 flex flex-col h-full bg-slate-900 border-l border-slate-800 rounded-l-3xl overflow-hidden shadow-2xl relative">

                    {!temAlertaCritico ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/40">
                            <div className="w-32 h-32 rounded-full border-4 border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                                <CheckCircle2 size={64} className="text-emerald-500" />
                            </div>
                            <h2 className="text-3xl font-black uppercase text-emerald-500 tracking-widest mb-2">MONITORIZAÇÃO GLOBAL NOMINAL</h2>
                            <p className="text-emerald-700/80 font-bold uppercase tracking-widest text-lg">SEM ALERTAS OU INTERRUPÇÕES</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col relative animate-pulse-slow">
                            {/* Glowing Background Header for Sidebar */}
                            <div className="bg-red-600 p-8 shadow-[0_5px_30px_rgba(220,38,38,0.4)] relative z-10 flex flex-col items-center justify-center text-center">
                                <AlertTriangle size={64} className="text-white animate-bounce mb-4" />
                                <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-2">ANDON ALARME</h2>
                                <p className="text-red-200 font-bold text-lg tracking-widest uppercase">Ações Necessárias</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-red-950/20">
                                {alertas.map(al => (
                                    <div key={al.id} className="bg-black/60 border border-red-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
                                        <span className="text-red-400 font-bold uppercase tracking-widest text-sm mb-1 block truncate">
                                            EST. {al.estacoes?.nome_estacao || "DESCONHECIDA"}
                                        </span>
                                        <span className="text-white font-black text-2xl uppercase block leading-tight mb-2">
                                            {al.tipo_alerta}
                                        </span>
                                        {al.descricao_alerta && (
                                            <span className="text-slate-300 text-sm mb-4 line-clamp-2 leading-snug block">
                                                "{al.descricao_alerta}"
                                            </span>
                                        )}
                                        <div className="pt-4 border-t border-red-900/50 flex justify-between items-center">
                                            <span className="text-slate-500 font-mono text-xs tracking-widest">FUNC: {al.operador_rfid}</span>
                                            <span className="bg-red-500 text-white px-3 py-1 rounded-md text-xs font-black uppercase shadow-lg">Espera</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}

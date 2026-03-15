'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { AlertTriangle, Clock, Factory, MonitorPlay, ShieldCheck, Trophy, Target, TrendingUp, Zap, Clock4, CheckCircle2, UserX, Activity, HeartPulse, PackageCheck, Award, Star } from 'lucide-react';
import { buscarDashboardsTV } from '../../actions';
import KanbanBoard from '../../../admin/producao/planeamento/components/KanbanBoard';

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
    const [radarEstacoes, setRadarEstacoes] = useState<any[]>([]);
    const [tipoAlvo, setTipoAlvo] = useState<string>('');
    const [opcoesLayout, setOpcoesLayout] = useState<any>({});
    const [metrics, setMetrics] = useState<any>({ kpiOee: {}, heroiTurno: null, melhorArea: null, gargalos: [] });
    const [planeamentoOrdens, setPlaneamentoOrdens] = useState<any[]>([]);

    const [refreshTick, setRefreshTick] = useState(0);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        
        // Diminuir o rem base para simular maior resolução (75% do tamanho original de 16px), cabendo mais widgets
        document.documentElement.style.fontSize = '12px';

        return () => {
            clearInterval(timer);
            // Reverter se sair da página
            document.documentElement.style.fontSize = '16px';
        };
    }, []);

    useEffect(() => {
        if (!tvId) return;

        async function fetchState() {
            const res = await buscarDashboardsTV(tvId);
            if (res.success && res.config) {
                setNomeTv(res.config.nome_tv);
                setAlvoNome(res.config.nome_alvo_resolvido);
                setTipoAlvo(res.config.tipo_alvo || '');
                
                if (res.config.tipo_alvo === 'PLANEAMENTO') {
                    setPlaneamentoOrdens(res.planeamentoData || []);
                } else {
                    setBarcosAtivos(res.barcos || []);
                    setAlertas(res.alertasGlobais || []);
                    setRadarEstacoes(res.radarEstacoes || []);
                    setOpcoesLayout(res.config.opcoes_layout || {});
                    setMetrics(res.advancedMetrics || {});
                }
            } else {
                setNomeTv("🔴 SINAL PERDIDO");
                setAlvoNome("Esta TV não foi configurada ou perdeu a ligação ao servidor M.E.S.");
            }
        }
        fetchState();
    }, [tvId, refreshTick]);

    useEffect(() => {
        if (!tvId) return;

        // Fallback robusto que atualiza os dados em pano de fundo a cada 60s
        // Isto assegura que KPIs (RH, Qualidade) que não têm webhooks de Realtime no momento também se mantenham frescos.
        const fallbackInterval = setInterval(() => {
            setRefreshTick(t => t + 1);
        }, 60000);

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
            clearInterval(fallbackInterval);
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

    if (tipoAlvo === 'PLANEAMENTO') {
        return (
            <div className="w-screen h-screen flex flex-col overflow-hidden bg-slate-950 text-slate-200">
                {/* --- NASA HUD TOP HEADER --- */}
                <header className="flex items-center justify-between border-b-[4px] border-slate-800 bg-slate-900/50 p-3 shadow-md z-10 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center justify-center pr-2">
                            <img src="/logo.png" alt="Logo" className="h-[3rem] w-auto object-contain drop-shadow-xl" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black tracking-tighter uppercase text-white truncate max-w-4xl leading-none">{alvoNome}</h1>
                            <p className="text-[0.625rem] text-blue-400 font-bold tracking-widest uppercase flex items-center gap-1.5 mt-1.5 opacity-80">
                                <MonitorPlay size={12} className="text-blue-500" /> DATALINK: {nomeTv}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center bg-black/60 border border-slate-700 rounded-2xl px-6 py-2 shadow-[inset_0_4px_10px_rgba(0,0,0,0.6)]">
                        <Clock size={28} className="text-emerald-400 mr-4 animate-pulse" />
                        <span className="text-4xl font-mono font-black tracking-widest text-emerald-400">
                            {time.toLocaleTimeString('pt-PT', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                </header>
                
                <div className="flex-1 overflow-hidden p-4 relative kanban-tv-wrapper bg-slate-950">
                     <KanbanBoard inicialOrdens={planeamentoOrdens} />
                </div>
                {/* Strict CSS override to make Kanban passive on TVs */}
                <style dangerouslySetInnerHTML={{__html: `
                    .kanban-tv-wrapper button { display: none !important; }
                    .kanban-tv-wrapper .glass-panel { pointer-events: none !important; transform: scale(1.02); margin-top: 4px; border: 1px solid rgba(59,130,246,0.3) !important; background: rgba(15,23,42,0.8) !important;}
                    .kanban-tv-wrapper { padding-top: 2rem !important; }
                `}} />
            </div>
        );
    }

    return (
        <div className="w-screen h-screen flex flex-col overflow-hidden selection:bg-rose-500/30 bg-slate-950 text-slate-200">

            {/* --- NASA HUD TOP HEADER --- */}
            <header className="flex items-center justify-between border-b-[4px] border-slate-800 bg-slate-900/50 p-3 shadow-md z-10 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center justify-center pr-2">
                        <img src="/logo.png" alt="Logo" className="h-[3rem] w-auto object-contain drop-shadow-xl" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase text-white truncate max-w-4xl leading-none">{alvoNome}</h1>
                        <p className="text-[0.625rem] text-blue-400 font-bold tracking-widest uppercase flex items-center gap-1.5 mt-1.5 opacity-80">
                            <MonitorPlay size={12} className="text-blue-500" /> DATALINK: {nomeTv}
                        </p>
                    </div>
                </div>

                <div className="flex items-center bg-black/60 border border-slate-700 rounded-2xl px-6 py-2 shadow-[inset_0_4px_10px_rgba(0,0,0,0.6)]">
                    <Clock size={28} className="text-emerald-400 mr-4 animate-pulse" />
                    <span className="text-4xl font-mono font-black tracking-widest text-emerald-400">
                        {time.toLocaleTimeString('pt-PT', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            </header>

            {/* --- AREA ANDON NOTIFICATION BAR (RADAR NASA 3D) --- */}
            {radarEstacoes.length > 0 && (
                <div className={`w-full relative shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] border-b-[3px] border-t-[3px] transition-colors duration-1000 z-10 shrink-0 select-none overflow-hidden ${radarEstacoes.some(a => a.hasAndon) ? 'bg-slate-900 border-y-red-950/80 shadow-[inset_0_0_50px_rgba(220,38,38,0.15)]' : 'bg-slate-900 border-slate-950'} ${tipoAlvo === 'GERAL' ? 'py-5 px-4' : 'py-8 px-8'}`}>
                    
                    {/* The 3D Conveyor Belt (Track Line / Linha Puxada) */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-8 bg-slate-950 border-y-2 border-slate-800 shadow-[inset_0_3px_8px_rgba(0,0,0,0.9),0_2px_4px_rgba(255,255,255,0.02)] z-0 overflow-hidden flex items-center">
                         <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]"></div>
                         <div className="w-full h-1 bg-black/80 shadow-[0_1px_0_rgba(255,255,255,0.05)]"></div>
                    </div>

                    <div className={`relative flex items-center z-10 ${tipoAlvo === 'GERAL' ? 'justify-between flex-nowrap gap-2 max-w-full overflow-hidden' : 'justify-center flex-wrap gap-8'}`}>
                        {radarEstacoes.map((station) => (
                            <div key={station.id} className="flex items-center group relative">
                                
                                <div className={`flex flex-col items-center justify-center rounded-lg transition-all duration-500 transform ${tipoAlvo === 'GERAL' ? 'flex-1 min-w-0 max-w-[120px] px-2 py-2.5' : 'shrink-0 min-w-[140px] px-3 py-3.5'} ${station.hasAndon ? 'bg-gradient-to-b from-red-500 to-red-800 border-2 border-red-300 shadow-[0_6px_0_#450a0a,0_15px_25px_rgba(220,38,38,0.5)] -translate-y-1.5' : 'bg-gradient-to-b from-slate-600 to-slate-800 border-2 border-slate-500 shadow-[0_5px_0_#020617,0_8px_15px_rgba(0,0,0,0.6)]'}`}>
                                    
                                    {/* 3D Top highlight for volumetric effect */}
                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/15 rounded-t-sm"></div>

                                    <div className="flex items-center gap-2 w-full justify-center mt-1">
                                        {station.hasAndon ? (
                                            <div className="relative flex justify-center items-center shrink-0 w-6 h-6 mb-1">
                                                {/* Giroflex Core / Base */}
                                                <div className="absolute w-3 h-3 bg-white rounded-full border-2 border-red-500 z-10 shadow-[0_0_20px_rgba(255,0,0,1),0_0_40px_rgba(255,0,0,0.8)]"></div>
                                                {/* Rotating Light Beam (Siren Sweep) */}
                                                <div className="absolute w-16 h-16 bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(255,255,255,0.5)_360deg)] rounded-full animate-spin z-0 pointer-events-none origin-center mix-blend-overlay"></div>
                                                {/* Intense Red Pulse (Siren Volumetric Glow) */}
                                                <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-red-500 opacity-60 z-0 drop-shadow-[0_0_10px_rgba(220,38,38,0.9)]"></span>
                                            </div>
                                        ) : (
                                            <div className="rounded-full bg-emerald-400 border-2 border-emerald-200 shadow-[0_0_10px_rgba(52,211,153,0.8)] shrink-0 h-3 w-3"></div>
                                        )}
                                        
                                        <div className="flex flex-col justify-center min-w-0 items-center text-center">
                                            <span className={`font-black uppercase tracking-widest leading-tight truncate w-full ${tipoAlvo === 'GERAL' ? 'text-[0.6rem]' : 'text-xs'} ${station.hasAndon ? 'text-white' : 'text-slate-100'}`} style={{ textShadow: station.hasAndon ? '0 1px 3px rgba(0,0,0,0.9)' : '0 1px 2px rgba(0,0,0,0.7)' }}>
                                                {station.nome_estacao.split('-').pop()?.trim() || station.nome_estacao}
                                            </span>
                                        </div>
                                    </div>
                                    {station.hasAndon && tipoAlvo !== 'GERAL' && (
                                        <div className="mt-2.5 w-full bg-black/60 rounded flex items-center justify-center p-1.5 border-t border-red-500/40 shadow-inner">
                                            <span className="text-[0.6rem] text-red-100 font-bold uppercase truncate text-center leading-none" style={{ textShadow: '0 1px 1px black' }}>
                                                {station.andonType || 'ALARME ATIVO'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- MASTER GRID CONTENT --- */}
            <main className="flex-1 overflow-hidden flex gap-6 p-6">

                {/* LEFT COL: ORDENS EM CURSO (Production Queue) - Takes 35% */}
                <section className="w-[35%] flex flex-col gap-6 overflow-hidden">
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

                {/* CENTER COL: NASA WIDGETS (Takes 45%) */}
                <section className="w-[45%] grid grid-cols-3 auto-rows-min gap-4 overflow-y-auto pr-2 pb-6 relative">
                    {opcoesLayout.showOeeDay && (
                        <div className="col-span-3 bg-slate-900/80 border border-slate-700/50 rounded-3xl p-4 shadow-2xl relative overflow-hidden flex flex-col gap-3">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
                            <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Target size={24} className="text-blue-400" /> Rendimento Global
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 flex flex-col items-center justify-center">
                                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Dia Atual</span>
                                    <span className={`text-4xl lg:text-5xl font-black ${metrics.kpiOee?.diarioRealizado >= metrics.kpiOee?.diarioObjetivo ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {metrics.kpiOee?.diarioRealizado || 0}%
                                    </span>
                                    <span className="text-slate-600 text-[10px] mt-1 font-bold">OBJETIVO: {metrics.kpiOee?.diarioObjetivo || 85}%</span>
                                </div>
                                {opcoesLayout.showOeeMonth && (
                                    <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 flex flex-col items-center justify-center">
                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Mês Atual</span>
                                        <span className={`text-4xl lg:text-5xl font-black ${metrics.kpiOee?.mensalRealizado >= metrics.kpiOee?.mensalObjetivo ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {metrics.kpiOee?.mensalRealizado || 0}%
                                        </span>
                                        <span className="text-slate-600 text-[10px] mt-1 font-bold">OBJETIVO: {metrics.kpiOee?.mensalObjetivo || 85}%</span>
                                    </div>
                                )}
                                {opcoesLayout.showEfficiency && (
                                    <div className="bg-rose-950/20 rounded-2xl p-4 border border-rose-900/50 flex flex-col items-center justify-center">
                                        <span className="text-rose-500/80 text-xs font-bold uppercase tracking-widest mb-1">Atraso vs Plano</span>
                                        <span className="text-4xl lg:text-5xl font-black text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                                            {metrics.kpiOee?.percentagemAtraso || 0}%
                                        </span>
                                        <span className="text-rose-900 text-[10px] mt-1 font-bold">BACKLOG: {metrics.kpiOee?.atrasoMinutos || 0} MIN</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {opcoesLayout.showQCISQuality && metrics.qcisKpis && (
                        <div className="col-span-3 bg-slate-900/80 border border-slate-700/50 rounded-3xl p-4 shadow-2xl relative overflow-hidden flex flex-col gap-3">
                            <h2 className="text-xl font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                <ShieldCheck size={24} className="text-indigo-500" /> Qualidade (Mês)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col items-center justify-center bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">FTR Global</span>
                                    <span className={`text-4xl lg:text-5xl font-black ${parseInt(metrics.qcisKpis.ftrPercent) >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{metrics.qcisKpis.ftrPercent}</span>
                                    <span className="text-slate-600 text-[10px] mt-1 font-bold">OBJETIVO: 80%</span>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">DPU Embalamento</span>
                                    <span className={`text-4xl lg:text-5xl font-black ${(parseFloat(metrics.qcisKpis.dpuEmbalamento) <= 18 && parseFloat(metrics.qcisKpis.dpuEmbalamento) > 0) ? 'text-emerald-400' : 'text-rose-400'}`}>{metrics.qcisKpis.dpuEmbalamento}</span>
                                    <span className="text-slate-600 text-[10px] mt-1 font-bold">OBJETIVO: 18.0</span>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-indigo-950/30 p-4 rounded-2xl border border-indigo-900/50 shadow-inner">
                                    <span className="text-indigo-400/80 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><PackageCheck size={14}/> Barcos Embalados</span>
                                    <span className="text-4xl lg:text-5xl font-black text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.3)]">{metrics.qcisKpis.barcosEmbaladosOntem}</span>
                                    <span className="text-indigo-900 text-[10px] mt-1 font-bold uppercase">Acumulado Ontem</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {opcoesLayout.showWorkerOfMonth && metrics.heroiTurno && (
                        <div className="col-span-1 md:col-span-2 bg-slate-900/80 border border-slate-700/50 rounded-3xl p-5 shadow-2xl relative flex overflow-hidden group">
                            {/* Decorative background effects */}
                            <div className="absolute -right-6 -top-6 text-blue-500/5 rotate-12 transition-transform group-hover:rotate-45 duration-700">
                                <Trophy size={140} />
                            </div>
                            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full"></div>

                            {/* Main Content Area */}
                            <div className="relative z-10 flex flex-col w-full">
                                <h2 className="text-xs font-black uppercase tracking-widest text-yellow-500 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                                    <Trophy size={16} /> Alta-Performance (Funcionário do Mês)
                                </h2>

                                <div className="flex items-center gap-6 mt-2">
                                    {/* Spotlight Avatar (HR Dash Style) */}
                                    <div className="relative shrink-0 flex flex-col items-center">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-4xl font-extrabold shadow-[0_0_20px_rgba(59,130,246,0.5)] ring-4 ring-slate-800">
                                            {metrics.heroiTurno.nome_operador.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-3 inset-x-0 mx-auto w-fit bg-yellow-400 text-yellow-950 text-[10px] font-black px-3 py-0.5 rounded-full shadow-lg border border-yellow-300 tracking-wider">
                                            1º LUGAR
                                        </div>
                                    </div>

                                    {/* Contas e Score */}
                                    <div className="flex flex-col flex-1 pl-2 justify-center">
                                        <h4 className="text-2xl font-black text-white line-clamp-1 drop-shadow-md">
                                            {metrics.heroiTurno.nome_operador}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-3">
                                            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-4 py-1.5 rounded-full shadow-inner">
                                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                                                <span className="font-black text-blue-400 text-xl leading-none">
                                                    {metrics.heroiTurno.nota_eficiencia || 0}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none pt-1">
                                                    OEE Score
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Evolução Mini-Chart */}
                                    {metrics.heroiTurno.progresso_diario && metrics.heroiTurno.progresso_diario.length > 0 && (
                                        <div className="text-right flex flex-col justify-end shrink-0 pl-4 border-l border-slate-800">
                                            <span className="text-slate-500 text-[9px] uppercase font-black tracking-widest mb-1 block w-full text-center">Evolução Mensal</span>
                                            <div className="flex items-end gap-1 h-14 w-32 opacity-90 justify-center">
                                                {metrics.heroiTurno.progresso_diario.map((dia: any, idx: number) => {
                                                    const maxScore = Math.max(100, ...metrics.heroiTurno.progresso_diario.map((d: any) => d.nota_eficiencia));
                                                    const heightPercent = Math.max(10, Math.min((dia.nota_eficiencia / maxScore) * 100, 100));
                                                    return (
                                                        <div key={idx} className="flex-1 w-full bg-slate-950/60 rounded-t-sm flex items-end overflow-hidden border-b border-slate-700 h-full relative group">
                                                            <div style={{ height: `${heightPercent}%` }} className="w-full bg-gradient-to-t from-blue-700 to-blue-400 rounded-t-sm transition-all duration-1000 group-hover:bg-blue-300 drop-shadow-[0_0_5px_rgba(59,130,246,0.3)]"></div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {opcoesLayout.showSafeArea && metrics.melhorArea && (
                        <div className="col-span-1 bg-gradient-to-bl from-emerald-500/10 to-slate-900/80 border border-emerald-500/30 rounded-3xl p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 text-emerald-500/5 rotate-[-15deg]">
                                <ShieldCheck size={100} />
                            </div>
                            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-3 flex items-center gap-2 relative z-10">
                                <ShieldCheck size={16} /> Zero Acidentes
                            </h2>
                            <div className="relative z-10">
                                <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-1 drop-shadow-sm w-full truncate border-b border-emerald-500/20 pb-1">
                                    Destaque Segurança ({metrics.melhorArea.tipo || 'Área'})
                                </p>
                                <p className="text-2xl font-black text-white leading-tight line-clamp-2 mt-1">{metrics.melhorArea.nome}</p>
                            </div>
                            <div className="mt-2 flex items-center gap-2 relative z-10 bg-black/40 rounded-xl p-2 border border-slate-800 self-start">
                                <span className="text-emerald-400 text-xl font-black ml-1">{metrics.melhorArea.score}%</span>
                                <span className="text-slate-500 text-[9px] uppercase font-bold w-[60px] leading-tight text-center">Score HSE</span>
                            </div>
                        </div>
                    )}

                    {opcoesLayout.showAbsentismo && metrics.absentismo && (
                        <div className="col-span-1 bg-gradient-to-tr from-slate-900/90 to-blue-950/40 border border-slate-700/50 rounded-3xl p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden group">
                            {/* Decorative Tech Overlay */}
                            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
                            <div className="absolute -bottom-4 -left-4 text-slate-800/30 rotate-12 transition-transform group-hover:-rotate-12 duration-700">
                                <UserX size={100} />
                            </div>

                            <h2 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2 relative z-10 border-b border-blue-500/20 pb-2">
                                <UserX size={16} /> Assiduidade
                            </h2>

                            <div className="relative z-10 flex flex-col justify-between h-full">
                                {/* Presences (Huge highlight) */}
                                <div className="flex flex-col mb-4">
                                    <p className="text-6xl font-black leading-none text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                                        {Math.max(0, metrics.absentismo.cadastrados - metrics.absentismo.faltosos)}
                                        <span className="text-xl text-slate-500 font-bold ml-1">/{metrics.absentismo.cadastrados}</span>
                                    </p>
                                    <p className="text-emerald-500/80 text-[10px] font-black tracking-widest mt-2 uppercase bg-emerald-950/40 border border-emerald-900/50 w-fit px-3 py-1 rounded-full shadow-inner">
                                        Operadores Ativos
                                    </p>
                                </div>

                                {/* Absences (Warning highlight) */}
                                <div className="self-end mt-auto bg-rose-950/30 border border-rose-900/50 rounded-2xl p-3 w-full flex justify-between items-center backdrop-blur-sm">
                                    <span className="text-[10px] font-black text-rose-500/80 uppercase tracking-widest">
                                        Faltosos
                                    </span>
                                    <span className="text-3xl font-black text-rose-500 drop-shadow-md">
                                        {metrics.absentismo.faltosos}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {opcoesLayout.showHstKpis && metrics.hstKpis && (
                        <div className="col-span-1 bg-gradient-to-br from-slate-900/90 to-cyan-950/30 border border-slate-700/50 rounded-3xl p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden group">
                            {/* Decorative Tech Overlay */}
                            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full"></div>
                            <div className="absolute right-2 top-2 text-cyan-500/10 rotate-12 transition-transform group-hover:rotate-45 duration-700">
                                <Activity size={80} />
                            </div>

                            <h2 className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-4 flex items-center gap-2 relative z-10 border-b border-cyan-500/20 pb-2">
                                <ShieldCheck size={16} /> Auditorias & Diário
                            </h2>
                            
                            <div className="space-y-5 relative z-10 flex-1 flex flex-col justify-center">
                                {/* Conformidade Fabril Widget */}
                                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-3 shadow-inner relative overflow-hidden">
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-800">
                                        <div className={`absolute bottom-0 w-full transition-all duration-1000 ${metrics.hstKpis.conformidadeFabril < 90 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'}`} style={{ height: `${metrics.hstKpis.conformidadeFabril}%` }}></div>
                                    </div>
                                    
                                    <div className="flex justify-between items-end mb-2 pr-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-tight w-20">Conformidade Global</span>
                                        <span className={`text-4xl font-black leading-none drop-shadow-md ${metrics.hstKpis.conformidadeFabril < 90 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {metrics.hstKpis.conformidadeFabril}%
                                        </span>
                                    </div>
                                    <div className="pr-4">
                                        <div className="w-full bg-slate-900 rounded-full h-1.5 shadow-inner">
                                            <div className={`h-1.5 rounded-full transition-all duration-1000 ${metrics.hstKpis.conformidadeFabril < 90 ? 'bg-gradient-to-r from-rose-700 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-gradient-to-r from-emerald-700 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'}`} style={{ width: `${metrics.hstKpis.conformidadeFabril}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Segurança Diária Widget */}
                                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-3 shadow-inner relative overflow-hidden">
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-800">
                                        <div className={`absolute bottom-0 w-full transition-all duration-1000 ${metrics.hstKpis.segurancaDiaria < 95 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'}`} style={{ height: `${metrics.hstKpis.segurancaDiaria}%` }}></div>
                                    </div>

                                    <div className="flex justify-between items-end mb-2 pr-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-tight w-20">Segurança Diária</span>
                                        <span className={`text-4xl font-black leading-none drop-shadow-md ${metrics.hstKpis.segurancaDiaria < 95 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {metrics.hstKpis.segurancaDiaria}%
                                        </span>
                                    </div>
                                    <div className="pr-4">
                                        <div className="w-full bg-slate-900 rounded-full h-1.5 shadow-inner">
                                            <div className={`h-1.5 rounded-full transition-all duration-1000 ${metrics.hstKpis.segurancaDiaria < 95 ? 'bg-gradient-to-r from-amber-700 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-gradient-to-r from-emerald-700 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'}`} style={{ width: `${metrics.hstKpis.segurancaDiaria}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {opcoesLayout.showSafetyCross && (
                        <div className="col-span-1 bg-slate-900/80 border border-slate-700/50 rounded-3xl p-5 shadow-2xl relative flex flex-col justify-between items-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2 self-start w-full border-b border-slate-800 pb-3">
                                <HeartPulse size={16} /> Cruz Segurança
                            </h2>
                            {/* Cruz de Segurança Oficial 31-Dias */}
                            <div className="grid grid-cols-7 gap-1 w-full max-w-[280px]">
                                {[
                                    null, null, 1, 2, 3, null, null,
                                    null, null, 4, 5, 6, null, null,
                                    7, 8, 9, 10, 11, 12, 13,
                                    14, 15, 16, 17, 18, 19, 20,
                                    21, 22, 23, 24, 25, 26, 27,
                                    null, null, 28, 29, 30, null, null,
                                    null, null, 31, null, null, null, null
                                ].map((dayNum, i) => {
                                    if (dayNum === null) {
                                        return <div key={`empty-${i}`} className="w-full aspect-square"></div>;
                                    }

                                    // Base do M.E.S. se existir
                                    const dayInfo = metrics.safetyCrossDays?.find((d: any) => d.day === dayNum);
                                    if (!dayInfo) {
                                        return <div key={`hide-${dayNum}`} className="w-full aspect-square"></div>; // Mês não chegou a este dia
                                    }

                                    const isToday = dayInfo.day === new Date().getDate();

                                    // Cores Oficiais M.E.S. HST
                                    let bgClass = 'bg-slate-800/50 border border-slate-700 text-slate-600'; // Nível 4 (Futuro)
                                    let pulse = false;
                                    let shadow = '';

                                    if (dayInfo.level === 0) {
                                        // Dia OK (Verde)
                                        bgClass = 'bg-emerald-500/80 border border-emerald-400/50 text-emerald-900';
                                        if (isToday) {
                                            bgClass = 'bg-emerald-400 border-2 border-emerald-300 text-black';
                                            pulse = true;
                                            shadow = 'shadow-[0_0_15px_rgba(52,211,153,0.6)]';
                                        }
                                    } else if (dayInfo.level === 1) {
                                        // Incidente (Amarelo)
                                        bgClass = 'bg-yellow-400 text-black border-2 border-yellow-500';
                                        if (isToday) pulse = true;
                                    } else if (dayInfo.level === 2) {
                                        // Acidente Sem Baixa (Laranja)
                                        bgClass = 'bg-orange-500 text-black border-2 border-orange-600';
                                        if (isToday) pulse = true;
                                    } else if (dayInfo.level === 3) {
                                        // Acidente Com Baixa (Vermelho A piscar sempre!)
                                        bgClass = 'bg-red-600 text-white border-2 border-red-400';
                                        pulse = true; // Acidentes graves piscam sempre na TV
                                        shadow = 'shadow-[0_0_15px_rgba(220,38,38,0.8)]';
                                    }

                                    return (
                                        <div key={dayNum} className={`flex items-center justify-center rounded-sm font-black text-xs transition-all duration-1000 aspect-square ${bgClass} ${pulse ? 'animate-pulse' : ''} ${shadow}`}>
                                            {dayNum}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-center gap-3 mt-4 w-full pt-3 border-t border-slate-800">
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-500/80 border border-emerald-400 rounded-[2px]"></div><span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Seguro</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-yellow-400 rounded-[2px]"></div><span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Incidente</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-600 rounded-[2px] shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div><span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Acidente</span></div>
                            </div>
                        </div>
                    )}

                    {opcoesLayout.showOeeHh && metrics.eficienciaHh && (
                        <div className="col-span-1 bg-slate-900/80 border border-slate-700/50 rounded-3xl p-5 shadow-2xl relative flex flex-col justify-between items-center transition-all bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                            <h2 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-2 self-start w-full border-b border-slate-800 pb-2">
                                <Award size={16} /> Eficiência
                            </h2>
                            <div className="flex flex-col items-center justify-center my-2">
                                <span className={`text-4xl lg:text-5xl font-black ${(metrics.eficienciaHh.percentual || 0) >= 75 ? 'text-emerald-400' : (metrics.eficienciaHh.percentual || 0) >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                                    {(metrics.eficienciaHh.percentual || 0).toFixed(1)}%
                                </span>
                                <span className="text-slate-500 text-[10px] uppercase font-bold mt-1 tracking-widest">Objetivo 75%</span>
                            </div>
                            <div className="w-full flex justify-between items-end mt-2 pt-3 border-t border-slate-800">
                                <div>
                                    <p className="text-blue-400 font-black text-lg leading-tight">{(metrics.eficienciaHh.horasGanhas || 0).toFixed(1)}</p>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">H/H Ganhas</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-300 font-black text-lg leading-tight">{(metrics.eficienciaHh.horasTrabalhadas || 0).toFixed(1)}</p>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Efetivas</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {opcoesLayout.showBottlenecks && metrics.gargalos && metrics.gargalos.length > 0 && (
                        <div className="col-span-1 bg-slate-900/80 border border-slate-700/50 rounded-3xl p-5 shadow-2xl">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                <TrendingUp size={16} className="text-rose-500" /> Radar de Gargalos
                            </h2>
                            <div className="space-y-2 mt-2">
                                {metrics.gargalos.slice(0, 3).map((g: any, i: number) => (
                                    <div key={i} className="bg-slate-950 rounded-xl p-3 border border-rose-900/30 flex justify-between items-center">
                                        <span className="text-xs font-bold text-white uppercase truncate mr-2">{g.estacoes?.nome_estacao || 'Desconhecida'}</span>
                                        <span className="bg-rose-500/20 text-rose-400 px-2 flex-shrink-0 py-1 rounded-md text-[10px] font-black tracking-widest">
                                            {g.tipo_alerta}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* RIGHT COL: DEDICATED ANDON SIDEBAR (Takes 20%) */}
                <section className="w-[20%] flex flex-col h-full bg-slate-900 border-l border-slate-800 rounded-l-3xl overflow-hidden shadow-2xl relative">

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
                            {/* Compact Glowing Background Header for Sidebar */}
                            <div className="bg-red-600 p-3 shadow-[0_5px_30px_rgba(220,38,38,0.4)] relative z-10 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle size={32} className="text-white animate-bounce" />
                                    <div className="flex flex-col text-left">
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-0.5">ANDON ALARME</h2>
                                        <p className="text-red-200 font-bold text-[10px] tracking-widest uppercase leading-none">Ações Intervenção</p>
                                    </div>
                                </div>
                                <div className="bg-white/20 px-3 py-1 rounded-full text-white font-black text-lg shadow-inner">
                                    {alertas.length}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-red-950/20">
                                {alertas.map(al => {
                                    const minutesPassed = Math.max(0, Math.floor((time.getTime() - new Date(al.created_at).getTime()) / 60000));
                                    return (
                                    <div key={al.id} className="bg-black/60 border border-red-500/30 rounded-xl p-3 shadow-md relative overflow-hidden flex flex-col gap-1.5">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>

                                        <div className="flex justify-between items-start pl-2">
                                            <div className="flex flex-col w-full">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-white font-black text-sm uppercase leading-tight truncate">
                                                        {al.tipo_alerta}
                                                    </span>
                                                    <span className="bg-red-500/20 text-red-500 px-1.5 py-[2px] rounded text-[9px] font-black uppercase tracking-widest flex-shrink-0 border border-red-900/50">
                                                        CAUSADOR: {al.causadora?.nome_estacao || al.estacao_id}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-1 border-b border-red-900/30 pb-1">
                                                    <span className="text-slate-300 font-bold text-[10px] tracking-widest uppercase">
                                                        📍 LOCAL: <span className="text-white relative top-[0.5px]">{al.estacoes?.nome_estacao || "..."}</span>
                                                    </span>
                                                </div>
                                                {al.descricao_alerta && (
                                                    <span className="text-slate-400 text-xs line-clamp-1 leading-snug mt-1 italic">
                                                        "{al.descricao_alerta}"
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pl-2 pt-1.5 border-t border-red-900/50 flex justify-between items-center mt-0.5">
                                            <span className="text-slate-500 font-mono text-[10px] tracking-widest flex items-center gap-1.5">
                                                <UserX size={10} className="text-slate-600" /> ID: {al.operador_rfid}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] flex items-center gap-1 border border-slate-700">
                                                    <Clock size={10} className="text-slate-400" /> {minutesPassed}M
                                                </span>
                                                <span className="bg-red-500/80 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-sm flex items-center gap-1">
                                                    Aguardando
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}

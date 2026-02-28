'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { AlertTriangle, Clock, Factory, MonitorPlay } from 'lucide-react';
import { buscarDashboardsTV } from '../../actions';

// Supabase Anon Client for Websockets Listeners ONLY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CustomTVDashboardPage() {
    const params = useParams();
    const tvId = params.tv_id as string;

    const [nomeTv, setNomeTv] = useState('A CARREGAR HARDWARE...');
    const [alvoNome, setAlvoNome] = useState('...');

    const [barcosAtivos, setBarcosAtivos] = useState<any[]>([]);
    const [alertas, setAlertas] = useState<any[]>([]);

    // Realtime Re-fetch Trigger
    const [refreshTick, setRefreshTick] = useState(0);

    // Relógio e Data Gigantes
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Inicial e Refetch dependente desta TV única
    useEffect(() => {
        if (!tvId) return;

        async function fetchState() {
            const res = await buscarDashboardsTV(tvId);
            if (res.success && res.config) {
                setNomeTv(res.config.nome_tv);
                setAlvoNome(res.config.nome_alvo_resolvido);
                setBarcosAtivos(res.barcos || []);
                setAlertas(res.alertasGlobais || []);
            } else {
                setNomeTv("🔴 SINAL PERDIDO");
                setAlvoNome("Esta TV não foi configurada ou foi eliminada do painel M.E.S.");
            }
        }
        fetchState();
    }, [tvId, refreshTick]);

    // WebSocket Listeners
    useEffect(() => {
        if (!tvId) return;

        const channelAndon = supabase
            .channel(`tv-andon-${tvId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas_andon' }, (payload) => {
                console.log("TV RECEBEU EVENTO ANDON:", payload);
                setRefreshTick(t => t + 1); // Força refetch agnóstico aos filtros backend
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ordens_producao' }, (payload) => {
                console.log("TV RECEBEU EVENTO OP:", payload);
                setRefreshTick(t => t + 1); // Força refetch para os Barcos na passadeira
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes_tv', filter: `id=eq.${tvId}` }, (payload) => {
                // Se alguém alterar as definições DESTA tv no backoffice, reage imediatamente
                setRefreshTick(t => t + 1);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channelAndon);
        };
    }, [tvId]);

    // LÓGICA DE ALERTA ESTRÍITA
    const temAlertaCritico = alertas.length > 0;

    // View de Erro de Setup (Sem Alvo)
    if (nomeTv.includes("SINAL PERDIDO")) {
        return (
            <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center p-12 text-slate-500">
                <MonitorPlay size={120} className="mb-8 opacity-20" />
                <h1 className="text-6xl font-black mb-4 uppercase">{nomeTv}</h1>
                <p className="text-3xl font-mono">{alvoNome}</p>
            </div>
        );
    }

    // View Normal Fabril + Alertas Top Banner
    return (
        <div className="w-screen h-screen flex flex-col p-8 md:p-12 overflow-hidden selection:bg-rose-500/30 bg-slate-950">

            {/* McDonald's Style Andon Alerts Banner */}
            {temAlertaCritico && (
                <div className="w-full bg-red-600 rounded-[3rem] p-6 mb-8 flex gap-6 overflow-x-auto border-8 border-red-500/50 shadow-[0_0_50px_rgba(220,38,38,0.5)] animate-pulse-slow shrink-0">
                    <div className="flex items-center justify-center px-10 border-r-4 border-red-400/30 shrink-0">
                        <AlertTriangle size={100} className="text-white animate-bounce" />
                        <div className="ml-8">
                            <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-none mb-1">ANDON</h2>
                            <p className="text-red-200 font-bold tracking-widest uppercase">Pausa na Linha</p>
                        </div>
                    </div>
                    {alertas.map(al => (
                        <div key={al.id} className="bg-black/40 border-[6px] border-white/20 rounded-[2rem] p-8 min-w-[500px] flex flex-col justify-center">
                            <span className="text-red-200 font-bold uppercase tracking-widest text-2xl mb-2 truncate">
                                EST. {al.estacoes?.nome_estacao || "DESCONHECIDA"}
                            </span>
                            <span className="text-white font-black text-5xl uppercase truncate">
                                {al.tipo_alerta}
                            </span>
                            {al.descricao_alerta && (
                                <span className="text-white/90 italic text-2xl mt-4 line-clamp-2 leading-tight">
                                    "{al.descricao_alerta}"
                                </span>
                            )}
                            <div className="mt-auto pt-6 border-t border-white/10 flex justify-between items-center">
                                <span className="text-white/60 font-mono text-xl tracking-widest">FUNC: {al.operador_rfid}</span>
                                <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-black uppercase animate-pulse shadow-lg">
                                    Aguardar Assistência
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Header Gigante */}
            <header className="flex items-center justify-between border-b-[8px] border-slate-800 pb-8 mb-12">
                <div className="flex items-center gap-8">
                    <Factory size={80} className="text-blue-500" />
                    <div>
                        <h1 className="text-7xl font-black tracking-tighter uppercase text-slate-100 mb-2 truncate max-w-5xl">{alvoNome}</h1>
                        <p className="text-3xl text-slate-500 font-bold tracking-widest uppercase flex items-center gap-4">
                            <MonitorPlay size={28} className="text-slate-600" /> M.E.S. VIEW: {nomeTv}
                        </p>
                    </div>
                </div>

                <div className="flex items-center bg-slate-900 border-4 border-slate-800 rounded-3xl px-12 py-6 shadow-[inset_0_10px_20px_rgba(0,0,0,0.4)] shrink-0">
                    <Clock size={48} className="text-emerald-400 mr-6" />
                    <span className="text-6xl font-mono font-black tracking-widest text-emerald-400">
                        {time.toLocaleTimeString('pt-PT', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            </header>

            {/* Grid dos Barcos Correntes */}
            <main className="flex-1">
                {barcosAtivos.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-white">
                        <Factory size={160} className="mb-12 text-slate-600" />
                        <h2 className="text-5xl font-bold tracking-widest uppercase text-slate-500 text-center">
                            SEM PRODUÇÃO ATIVA<br />NESTE CLUSTER ({alvoNome})
                        </h2>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-8 md:gap-12 h-full pb-8">
                        {barcosAtivos.map((barco) => (
                            <div key={barco.id} className="bg-slate-900 border-[6px] border-slate-800 rounded-[3rem] p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                                {/* Decorator Line */}
                                <div className="absolute top-0 left-0 w-full h-4 bg-blue-500"></div>

                                <div>
                                    <h3 className="text-5xl text-slate-400 font-bold uppercase tracking-widest mb-4">HULL ID</h3>
                                    <p className="text-7xl font-black text-white truncate drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                                        {barco.hin_hull_id || barco.op_numero}
                                    </p>
                                </div>

                                <div className="mt-8">
                                    <p className="text-4xl text-slate-500 font-bold uppercase tracking-widest mb-2">MODELO & PLANO</p>
                                    <p className="text-5xl text-blue-300 font-black truncate uppercase mb-4">
                                        {barco.modelos?.nome_modelo} <span className="text-slate-600">|</span> SM {barco.semana_planeada}
                                    </p>
                                </div>

                                <div className="mt-auto bg-slate-950 p-6 rounded-2xl border-4 border-slate-800 flex justify-between items-center">
                                    <span className="text-3xl text-slate-500 font-bold uppercase">STATUS DA ORDEM:</span>
                                    <span className={`text-4xl font-black uppercase px-6 py-2 rounded-xl border ${barco.status === 'IN_PROGRESS' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' :
                                        barco.status === 'PAUSED' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' :
                                            'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                        }`}>
                                        {barco.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

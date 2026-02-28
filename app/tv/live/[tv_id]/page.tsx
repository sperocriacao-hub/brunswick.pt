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

    // View do Andon
    if (temAlertaCritico) {
        return (
            <div className="w-screen h-screen bg-red-600 flex flex-col items-center justify-center animate-pulse-slow p-12">
                <AlertTriangle size={240} className="text-white mb-10 drop-shadow-[0_0_80px_rgba(255,255,255,0.8)] animate-bounce" />
                <h1 className="text-9xl font-black text-white tracking-tighter text-center uppercase leading-none mb-8 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                    ALERTA ANDON
                </h1>

                <div className="bg-black/40 border-[16px] border-white/20 rounded-[4rem] p-16 flex flex-col items-center w-full max-w-7xl justify-center backdrop-blur-sm mt-8">
                    <h2 className="text-6xl text-red-100 font-bold uppercase tracking-widest opacity-90 mb-4 truncate text-center w-full">
                        {alertas[0]?.tipo_alerta || 'EMERGÊNCIA'} na EST. {alertas[0]?.estacoes?.nome_estacao || "DESCONHECIDA"}
                    </h2>

                    {alertas[0]?.descricao_alerta && (
                        <p className="text-5xl text-white font-medium text-center italic opacity-80 mt-4 leading-tight">
                            "{alertas[0]?.descricao_alerta}"
                        </p>
                    )}

                    <div className="mt-12 w-full flex justify-center">
                        <div className="bg-white/10 px-10 py-6 rounded-full border-4 border-white/30 text-center">
                            <p className="text-4xl text-white font-mono tracking-widest uppercase">
                                SOLICITADO POR: {alertas[0]?.operador_rfid}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-12 right-12 text-white/50 font-mono text-4xl text-right flex flex-col items-end">
                    <span className="font-bold text-white uppercase">{nomeTv}</span>
                    <span>VISÃO {alvoNome}</span>
                </div>
            </div>
        );
    }

    // View Normal Fabril (Nenhum Alarme)
    return (
        <div className="w-screen h-screen flex flex-col p-8 md:p-12 overflow-hidden selection:bg-rose-500/30 bg-slate-950">
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

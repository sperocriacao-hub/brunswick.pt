"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getGembaHubData } from './actions';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, ShieldCheck, UserX, Activity, Box, Clock, ShieldAlert } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

export default function MyGembaHub() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastCausadorCount, setLastCausadorCount] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const loadData = async () => {
        const res = await getGembaHubData();
        if (res.success && res.data) {
            setData(res.data);
            
            // Lógica do Alarme Sonoro
            const currentCausadorCount = res.data.andonsCausador?.length || 0;
            if (currentCausadorCount > lastCausadorCount) {
                // Toca alarme se houver novos Andons Causadores
                if (audioRef.current) {
                    audioRef.current.play().catch(e => console.log("Audio play blocked by browser interaction policy:", e));
                }
            }
            setLastCausadorCount(currentCausadorCount);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        // Inicializa o Audio
        audioRef.current = new Audio('/alarm.mp3'); // Fallback silently if not exist, will create simple beep below if needed
        
        loadData();
        
        const interval = setInterval(loadData, 15000); // Polling a cada 15 segundos
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Se o alarme MP3 falhar (ou não existir no /public), podemos usar a Web Audio API como Fallback
    const playBeep = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // volume
            oscillator.start();
            setTimeout(() => oscillator.stop(), 500);
        } catch(e) {}
    };

    useEffect(() => {
        if (data && data.andonsCausador?.length > lastCausadorCount && !audioRef.current?.src) {
            playBeep();
        }
    }, [data, lastCausadorCount]);

    if (isLoading && !data) {
        return <div className="p-10 text-center animate-pulse text-slate-500 font-mono">A calibrar o Radar Gemba...</div>;
    }

    if (!data) return <div className="p-10 text-center text-rose-500 font-bold">Erro ao carregar o Hub.</div>;

    const causadores = data.andonsCausador || [];
    const vitimas = data.andonsVitima || [];
    const ausentes = data.ausentes || [];

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-32 animate-in fade-in duration-500 bg-slate-50 min-h-screen">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <Activity className="text-blue-600" size={32} /> My Gemba Hub
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Inbox de Ações e Radar de Anomalias para {data.isGlobal ? "Fábrica Global" : data.userName || "a sua Equipa"}.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="bg-white px-3 py-1 text-xs border-slate-300">
                        {data.myOpsCount} Operadores
                    </Badge>
                    <Badge variant="outline" className="bg-white px-3 py-1 text-xs border-slate-300">
                        {data.myStationsCount} Estações
                    </Badge>
                </div>
            </header>

            {/* BLOCO A: TEMPO REAL (Head-up Display) */}
            <div className="mb-8">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock className="text-blue-500" size={16} /> O Pulso de Hoje (Tempo Real)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* ANDONS CAUSADORES (Vermelho Crítico) */}
                    <Card className={`border-t-4 ${causadores.length > 0 ? 'border-t-rose-500 bg-rose-50 shadow-rose-100' : 'border-t-slate-300 bg-white'}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className={`text-xs font-black uppercase tracking-widest flex justify-between ${causadores.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                Nós Causamos Paragem <AlertTriangle size={16} className={causadores.length > 0 ? 'animate-pulse text-rose-500' : ''}/>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-4xl font-black mb-3 ${causadores.length > 0 ? 'text-rose-700' : 'text-slate-300'}`}>
                                {causadores.length}
                            </div>
                            {causadores.length > 0 ? (
                                <div className="space-y-2">
                                    {causadores.map((a: any) => (
                                        <div key={a.id} className="bg-white p-2 rounded border border-rose-200 text-xs shadow-sm">
                                            <span className="font-bold text-rose-700">{a.causadoras?.nome_estacao || 'Desconhecida'}</span>
                                            <span className="text-slate-500 ml-1">parou a est. {a.estacoes?.nome_estacao}</span>
                                        </div>
                                    ))}
                                    <Link href="/admin/producao/andon" className="text-[10px] font-bold text-rose-600 hover:underline block mt-2">Ir para Andon &rarr;</Link>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 font-medium border-t border-slate-100 pt-2">Nenhuma paragem causada pela nossa área.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* ANDONS VÍTIMAS (Amarelo Alerta) */}
                    <Card className={`border-t-4 ${vitimas.length > 0 ? 'border-t-amber-500 bg-amber-50 shadow-amber-100' : 'border-t-slate-300 bg-white'}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className={`text-xs font-black uppercase tracking-widest flex justify-between ${vitimas.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                Fomos Parados (Vítimas) <ShieldAlert size={16} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-4xl font-black mb-3 ${vitimas.length > 0 ? 'text-amber-700' : 'text-slate-300'}`}>
                                {vitimas.length}
                            </div>
                            {vitimas.length > 0 ? (
                                <div className="space-y-2">
                                    {vitimas.map((a: any) => (
                                        <div key={a.id} className="bg-white p-2 rounded border border-amber-200 text-xs shadow-sm">
                                            <span className="font-bold text-amber-700">{a.estacoes?.nome_estacao || 'Nossa Estação'}</span>
                                            <span className="text-slate-500 ml-1">à espera de {a.causadoras?.nome_estacao}</span>
                                        </div>
                                    ))}
                                    <Link href="/admin/producao/andon" className="text-[10px] font-bold text-amber-600 hover:underline block mt-2">Ver detalhes &rarr;</Link>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 font-medium border-t border-slate-100 pt-2">Produção a fluir normalmente.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* ABSENTISMO (Azul Info) */}
                    <Card className={`border-t-4 ${ausentes.length > 0 && data.turnoIniciado ? 'border-t-blue-500 bg-blue-50 shadow-blue-100' : 'border-t-slate-300 bg-white'}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className={`text-xs font-black uppercase tracking-widest flex justify-between ${ausentes.length > 0 && data.turnoIniciado ? 'text-blue-600' : 'text-slate-400'}`}>
                                Faltas Hoje na Equipa <UserX size={16} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-4xl font-black mb-3 ${ausentes.length > 0 && data.turnoIniciado ? 'text-blue-700' : 'text-slate-300'}`}>
                                {!data.turnoIniciado ? '--' : ausentes.length}
                            </div>
                            {!data.turnoIniciado ? (
                                <p className="text-xs text-slate-400 font-medium border-t border-slate-100 pt-2">Turno ainda não iniciou (sem picagens).</p>
                            ) : ausentes.length > 0 ? (
                                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                                    {ausentes.map((op: any) => (
                                        <div key={op.id} className="bg-white p-1.5 px-2 rounded border border-blue-200 text-xs shadow-sm flex justify-between items-center">
                                            <span className="font-bold text-blue-800 truncate">{op.nome_operador}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 font-medium border-t border-slate-100 pt-2">Equipa 100% presente hoje.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* BLOCO B: INBOX DE AÇÕES (Placeholder Ativo) */}
            <div className="mb-8 opacity-90">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Box className="text-indigo-500" size={16} /> Inbox de Pendências (Em Breve)
                </h2>
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
                    <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-700">Inbox Zero!</h3>
                    <p className="text-slate-500 max-w-md mx-auto text-sm mt-2">
                        O módulo de cruzamento de Prazos (Auditorias 5S, Planos RNC e Formações da Academia) está em fase de alinhamento arquitetural.
                    </p>
                </div>
            </div>

        </div>
    );
}

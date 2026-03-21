"use client";

import React, { useState } from 'react';
import { Bot, Play, Bug, DatabaseZap, Loader2, CheckCircle2 } from 'lucide-react';

export default function QADashboard() {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const runQABot = async () => {
        setLoading(true);
        setLogs(["A Inicializar QA Bot Injector..."]);
        
        try {
            const res = await fetch('/api/qa-bot', { method: 'POST' });
            const data = await res.json();
            
            if (data.logs) setLogs(data.logs);
            
            if (!data.success) {
                setLogs(prev => [...prev, "❌ Erro Fatal Anotado: " + data.error]);
            }
        } catch (e: any) {
            setLogs(prev => [...prev, "❌ Erro de Ligação à API: " + e.message]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <Bot className="w-10 h-10 text-indigo-600" />
                    Laboratório Q.A. (Testes Autónomos)
                </h1>
                <p className="text-slate-500 font-medium text-lg mt-2">
                    Nesta área pode simular o comportamento de dezenas de operadores na fábrica injetando dados na API do Shopfloor utilizando métricas reais da base de dados.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Control Panel */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-4 border-b pb-2">
                        <DatabaseZap className="text-amber-500" /> Cockpit de Testes
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="p-4 border border-indigo-100 bg-indigo-50/50 rounded-xl">
                            <h3 className="font-bold text-indigo-900">Teste #1: O Ciclo de Vida do Barco</h3>
                            <p className="text-sm text-indigo-700/80 mt-1 mb-4">
                                Esta rotina localiza 1 Operador 'Ativo' e a próxima Ordem 'PLANNED'. 
                                O Bot enviará à API de IOT ordens sequenciais de: Entrada de Turno, Início de Roteiro, Fecho de Tarefa e Passagem de Estação.
                            </p>
                            <button 
                                onClick={runQABot}
                                disabled={loading}
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-lg flex items-center justify-center transition-all shadow-md active:scale-95"
                            >
                                {loading ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> A Simular Máquinas...</>
                                ) : (
                                    <><Play className="w-5 h-5 mr-2 fill-current" /> Injetar Teste de Ciclo Fabril</>
                                )}
                            </button>
                        </div>

                        <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl opacity-50 cursor-not-allowed">
                            <h3 className="font-bold text-slate-700">Teste #2: Stress Test (Soon)</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Dispara 10.000 requisições simultâneas para simular um pico de 500 operadores numa mudança de turno global.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Console Output */}
                <div className="bg-slate-900 rounded-2xl shadow-xl p-6 border border-slate-800 flex flex-col h-[500px]">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-mono">
                            <Bug className="text-emerald-400" /> Terminal HMI (Logs)
                        </h2>
                        {logs.length > 0 && <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs font-mono border border-emerald-500/30">ATIVO</span>}
                    </div>

                    <div className="flex-1 overflow-y-auto font-mono text-sm bg-black/50 p-4 rounded-xl border border-slate-800 shadow-inner">
                        {logs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                <Bot className="w-12 h-12 mb-4 opacity-20" />
                                <p>A aguardar injeção de rotinas...</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {logs.map((log, i) => (
                                    <div key={i} className={`${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-emerald-400' : 'text-slate-300'}`}>
                                        {log}
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex items-center gap-2 text-indigo-400 mt-4 animate-pulse">
                                        <Loader2 className="w-4 h-4 animate-spin" /> A mastigar dados...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

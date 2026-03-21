"use client";

import React, { useState } from 'react';
import { Bot, Play, Bug, DatabaseZap, Loader2, ServerCrash, Activity, ShieldCheck } from 'lucide-react';

export default function QADashboard() {
    const [activeTab, setActiveTab] = useState<'SEED' | 'MODULAR' | 'STRESS'>('SEED');
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const logToConsole = (msgs: string | string[]) => {
        if (Array.isArray(msgs)) setLogs(msgs);
        else setLogs(prev => [...prev, msgs]);
    };

    const runModularTest = async (phase: string) => {
        setLoading(true);
        logToConsole([`A Iniciar Modulo de Teste Clínico [${phase}]...`]);
        
        try {
            const res = await fetch(`/api/qa-bot?phase=${phase}`, { method: 'POST' });
            const data = await res.json();
            
            if (data.logs) logToConsole(data.logs);
            if (!data.success) logToConsole(`❌ Erro Fatal Anotado: ${data.error || 'Desconhecido'}`);
        } catch (e: any) {
            logToConsole(`❌ Erro de Ligação à API: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const runStressTest = async () => {
        setLoading(true);
        logToConsole([`🔥 INICIANDO SEQUÊNCIA NUCLEAR (Hyper Stress Test)...`, `A bombear dezenas de transações por segundo para a Cloud...`]);
        
        try {
            const res = await fetch('/api/qa-bot?phase=MASS_TEST', { method: 'POST' });
            const data = await res.json();
            
            if (data.logs) logToConsole(data.logs);
            if (!data.success) logToConsole(`❌ Erro Fatal de Carga: ${data.error || 'Server Timeout / DB Lock'}`);
        } catch (e: any) {
            logToConsole(`❌ Colapso de Conexão (Rate Limit?): ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const runSeedData = async () => {
        setLoading(true);
        logToConsole(["A Inicializar Construtor de Base de Dados (O Big Bang)..."]);
        
        try {
            const res = await fetch('/api/qa-seed', { method: 'POST' });
            const data = await res.json();
            
            if (data.logs) logToConsole(data.logs);
            if (!data.success) logToConsole(`❌ Erro Fatal Anotado: ${data.error || 'Desconhecido'}`);
        } catch (e: any) {
            logToConsole(`❌ Erro de Ligação à API (Seed): ${e.message}`);
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Control Panel tabs */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
                    
                    {/* Tabs Header */}
                    <div className="flex border-b border-slate-200 bg-slate-50">
                        <button onClick={() => setActiveTab('SEED')} className={`flex-1 py-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'SEED' ? 'border-emerald-500 text-emerald-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            1. DATA SEED
                        </button>
                        <button onClick={() => setActiveTab('MODULAR')} className={`flex-1 py-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'MODULAR' ? 'border-indigo-500 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            2. TESTES CLÍNICOS
                        </button>
                        <button onClick={() => setActiveTab('STRESS')} className={`flex-1 py-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'STRESS' ? 'border-red-500 text-red-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            3. STRESS TEST
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto space-y-4">
                        
                        {activeTab === 'SEED' && (
                            <div className="p-5 border border-emerald-200 bg-emerald-50/50 rounded-xl animate-in slide-in-from-left-4">
                                <h3 className="font-bold text-emerald-900 text-lg flex items-center gap-2"><DatabaseZap /> O "Big Bang" de Fabrico</h3>
                                <p className="text-sm text-emerald-700/80 mt-2 mb-6 leading-relaxed">
                                    Esta rotina limpa eventuais lixos e preenche a Base de Dados com "Massa Genética" crucial para a simulação:
                                    cria catálogos de Roteiros Fictícios, uma Equipa de 5 Auditores RFID (`QA-*`) e injeta um lote de 10 Barcos Falsos no Gantt. Indispensável correr isto antes dos testes.
                                </p>
                                <button onClick={runSeedData} disabled={loading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold rounded-lg flex items-center justify-center transition-all shadow-md active:scale-95">
                                    {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> A fabricar fundações...</> : <><DatabaseZap className="w-5 h-5 mr-2" /> Injetar Massa de Dados (Seed)</>}
                                </button>
                            </div>
                        )}

                        {activeTab === 'MODULAR' && (
                            <div className="space-y-4 animate-in slide-in-from-left-4">
                                <div className="p-4 border border-indigo-100 bg-white shadow-sm rounded-xl">
                                    <h3 className="font-bold text-indigo-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-500"/> M1: Anomalias e Ponto RH</h3>
                                    <p className="text-xs text-slate-500 mt-1 mb-3">Audita os algoritmos de verificação da Equipa, assiduidade e bloqueios em catracas.</p>
                                    <button onClick={() => runModularTest('M1')} disabled={loading} className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold transition-all">Testar M1 Modulo RH</button>
                                </div>
                                
                                <div className="p-4 border border-indigo-100 bg-white shadow-sm rounded-xl">
                                    <h3 className="font-bold text-indigo-900 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-500"/> M2: Motor Flow APS</h3>
                                    <p className="text-xs text-slate-500 mt-1 mb-3">Comprova a alteração de status temporal no Barco, desde 'Planeada' até 'Concluída'.</p>
                                    <button onClick={() => runModularTest('M2')} disabled={loading} className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold transition-all">Testar M2 Modulo APS</button>
                                </div>

                                <div className="p-4 border border-indigo-100 bg-white shadow-sm rounded-xl">
                                    <h3 className="font-bold text-indigo-900 flex items-center gap-2"><Bot className="w-5 h-5 text-indigo-500"/> M3: Auto-Logística e IoT</h3>
                                    <p className="text-xs text-slate-500 mt-1 mb-3">Fecha uma estação num milissegundo e verifica matematicamente se a Logística disparou pedidos para o posto M+1.</p>
                                    <button onClick={() => runModularTest('M3')} disabled={loading} className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold transition-all">Testar M3 Sub-Trigger Kitting</button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'STRESS' && (
                            <div className="p-5 border border-red-200 bg-red-50 rounded-xl animate-in slide-in-from-left-4 text-center">
                                <ServerCrash className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                <h3 className="font-black text-red-900 text-xl">Teste de Carga Total Nuclear</h3>
                                <p className="text-sm text-red-800 mt-2 mb-6">
                                    CUIDADO: Este botão não é para os fracos do coração. O bot vai comandar os 5 Trabalhadores QA para construírem os 10 Barcos QA simultaneamente do zero ao fim. São dezenas de transações assíncronas por segundo disparadas contra o servidor Supabase para validar a resistência de base de dados.
                                </p>
                                <button onClick={runStressTest} disabled={loading} className="w-full h-14 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-black uppercase tracking-wider rounded-lg flex items-center justify-center transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95">
                                    {loading ? <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> COLISÕES A OCORRER...</> : <><ServerCrash className="w-6 h-6 mr-3" /> LAUNCH MASS STRESS TEST</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Console Output (Fixed Height) */}
                <div className="bg-slate-900 rounded-2xl shadow-xl p-6 border border-slate-800 flex flex-col max-h-[600px]">
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

"use client";

import React, { useState } from 'react';
import { Wifi, ScanLine, Play, Square, AlertTriangle, MonitorSmartphone, Box } from 'lucide-react';

export default function OperadorTerminalPage() {
    // Estados do Simulador
    const [estacaoIP] = useState<string>('ESP32-ST-101');
    const [operadorRfid, setOperadorRfid] = useState<string>('');
    const [barcoRfid, setBarcoRfid] = useState<string>('');

    // Status UI
    const [statusMOCK, setStatusMOCK] = useState<'Aguardando' | 'Processando' | 'SessaoAtiva' | 'Erro'>('Aguardando');
    const [log, setLog] = useState<string[]>([
        'Terminal Inicializado. A aguardar leituras RFID...'
    ]);

    const addLog = (msg: string) => {
        setLog(prev => [msg, ...prev].slice(0, 5));
    }

    const handleSimulateScan = async (action: 'START' | 'STOP') => {
        if (!operadorRfid || !barcoRfid) {
            setStatusMOCK('Erro');
            addLog('ERRO: Faltam dados RFID do Operador ou do Barco.');
            return;
        }

        setStatusMOCK('Processando');
        addLog(`>> A comunicar com Servidor (${action})...`);

        // Simula request de rede
        setTimeout(() => {
            if (action === 'START') {
                setStatusMOCK('SessaoAtiva');
                addLog(`✅ SESSÃO INICIADA: Operador (${operadorRfid}) Barco (${barcoRfid}). O tempo começou a contar.`);
            } else {
                setStatusMOCK('Aguardando');
                addLog(`🛑 SESSÃO FECHADA: Operador (${operadorRfid}) fechou a tarefa do Barco (${barcoRfid}). Tempo registado no MES.`);
                // Reset após stop para a próxima leitura
                setOperadorRfid('');
                setBarcoRfid('');
            }
        }, 800);
    };

    return (
        <div className="container mt-8 animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>

            <div className="glass-panel p-8" style={{ border: statusMOCK === 'SessaoAtiva' ? '2px solid var(--primary)' : statusMOCK === 'Erro' ? '2px solid var(--danger)' : '1px solid var(--border)' }}>

                {/* STATUS BAR DO EQUIPAMENTO */}
                <div className="flex justify-between items-center mb-8 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="flex items-center gap-3">
                        <MonitorSmartphone size={24} color="var(--primary)" />
                        <div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Simulador Leitor ESP32</h2>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Terminal de Fabrico (HMI)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Rede Local:</span>
                        <div className="flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-400 rounded-full font-mono text-xs">
                            <Wifi size={12} /> {estacaoIP}
                        </div>
                    </div>
                </div>

                {/* FORMULÁRIO DE SIMULAÇÃO DE SCANS RFID */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="form-group">
                        <label>
                            <ScanLine size={16} />
                            Tag RFID do Operador (ID Crachá)
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Aproxime o cartão (Ex: 0049281A)"
                            value={operadorRfid}
                            onChange={(e) => setOperadorRfid(e.target.value)}
                            disabled={statusMOCK === 'SessaoAtiva'}
                            style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '2px' }}
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <Box size={16} />
                            Tag RFID da Peça/Molde (ID Barco)
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Aproxime a Tag do Molde (Ex: HULL-509)"
                            value={barcoRfid}
                            onChange={(e) => setBarcoRfid(e.target.value)}
                            disabled={statusMOCK === 'SessaoAtiva'}
                            style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '2px' }}
                        />
                    </div>
                </div>

                {/* PAINEL DE AÇÃO (BOTÕES GIGANTES PARA TOUCH) */}
                <div className="flex gap-4">
                    <button
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '1.5rem', fontSize: '1.2rem', background: statusMOCK === 'SessaoAtiva' ? 'rgba(255,255,255,0.1)' : 'var(--primary)', opacity: statusMOCK === 'SessaoAtiva' ? 0.5 : 1 }}
                        onClick={() => handleSimulateScan('START')}
                        disabled={statusMOCK === 'SessaoAtiva' || statusMOCK === 'Processando'}
                    >
                        <Play size={24} style={{ marginRight: '12px' }} />
                        Iniciar Sessão de Trabalho
                    </button>

                    <button
                        className="btn btn-danger"
                        style={{ flex: 1, padding: '1.5rem', fontSize: '1.2rem', background: statusMOCK !== 'SessaoAtiva' ? 'rgba(255,255,255,0.1)' : 'var(--danger)', opacity: statusMOCK !== 'SessaoAtiva' ? 0.5 : 1, color: 'white' }}
                        onClick={() => handleSimulateScan('STOP')}
                        disabled={statusMOCK !== 'SessaoAtiva'}
                    >
                        <Square size={24} fill="currentColor" style={{ marginRight: '12px' }} />
                        Terminar Sessão (Registar Produção)
                    </button>
                </div>

                {/* ALERTAS */}
                {statusMOCK === 'Erro' && (
                    <div className="mt-6 p-4 rounded-lg flex items-center gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
                        <AlertTriangle size={20} />
                        <span style={{ fontWeight: 500 }}>Erro de Leitura! Aproxime ambas as Tags para iniciar.</span>
                    </div>
                )}
            </div>

            {/* CONSOLA DE LOGS DO HARDWARE */}
            <div className="mt-6 glass-panel p-4">
                <h3 style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.5rem', fontFamily: 'monospace' }}>&gt;_ System Output Console</h3>
                <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#4ade80', lineHeight: 1.6 }}>
                    {log.map((entry, idx) => (
                        <div key={idx} style={{ opacity: 1 - (idx * 0.15) }}>
                            [{new Date().toLocaleTimeString()}] {entry}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

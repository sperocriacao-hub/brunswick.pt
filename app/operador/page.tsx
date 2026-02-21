"use client";

import React, { useState, useEffect } from 'react';
import { ScanLine, Play, Square, AlertTriangle, MonitorSmartphone, Box } from 'lucide-react';
import { buscarEstacoes, iniciarSessaoTrabalho, terminarSessaoTrabalho } from './actions';

export default function OperadorTerminalPage() {
    // Estados do Simulador
    const [estacoes, setEstacoes] = useState<{ id: string, nome_estacao: string }[]>([]);
    const [estacaoId, setEstacaoId] = useState<string>('');
    const [operadorRfid, setOperadorRfid] = useState<string>('');
    const [barcoRfid, setBarcoRfid] = useState<string>('');
    const [currentRegistoId, setCurrentRegistoId] = useState<string | null>(null);

    // Status UI
    const [statusMOCK, setStatusMOCK] = useState<'Aguardando' | 'Processando' | 'SessaoAtiva' | 'Erro'>('Aguardando');
    const [log, setLog] = useState<string[]>([
        'Terminal Inicializado. A conectar ao Supabase...'
    ]);
    const [errMsg, setErrMsg] = useState('');

    useEffect(() => {
        async function carregar() {
            const res = await buscarEstacoes();
            if (res.success && res.estacoes) {
                setEstacoes(res.estacoes);
                if (res.estacoes.length > 0) setEstacaoId(res.estacoes[0].id);
                addLog('✓ Estações Carregadas com Sucesso. A aguardar leituras RFID...');
            } else {
                addLog(`ERRO (Estações): ${res.error}`);
            }
        }
        carregar();
    }, []);

    const addLog = (msg: string) => {
        setLog(prev => [msg, ...prev].slice(0, 5));
    }

    const handleSimulateScan = async (action: 'START' | 'STOP') => {
        setErrMsg('');

        if (action === 'START') {
            if (!operadorRfid || !barcoRfid || !estacaoId) {
                setStatusMOCK('Erro');
                setErrMsg('Faltam dados RFID do Operador, Barco ou Estação.');
                return;
            }

            setStatusMOCK('Processando');
            addLog(`>> A validar credenciais de Ponto (RFID: ${operadorRfid}) e Barco (${barcoRfid})...`);

            const res = await iniciarSessaoTrabalho(operadorRfid, barcoRfid, estacaoId);

            if (res.success && res.registoId) {
                setCurrentRegistoId(res.registoId);
                setStatusMOCK('SessaoAtiva');
                addLog(`✅ ACESSO CONCEDIDO: Operador autenticado. OP #${res.opNumero} iniciada no M.E.S.`);
            } else {
                setStatusMOCK('Erro');
                setErrMsg(res.error || 'Falha Desconhecida');
                addLog(`❌ ACESSO BLOQUEADO: ${res.error}`);
            }
        } else {
            // STOP
            if (!currentRegistoId) return;
            setStatusMOCK('Processando');
            addLog(`>> A enviar timestamp final para Supabase...`);

            const res = await terminarSessaoTrabalho(currentRegistoId);

            if (res.success) {
                setStatusMOCK('Aguardando');
                addLog(`🛑 SESSÃO FECHADA: Tempo registado com sucesso.`);
                setOperadorRfid('');
                setBarcoRfid('');
                setCurrentRegistoId(null);
            } else {
                setStatusMOCK('Erro');
                setErrMsg(res.error || 'Falha ao encerrar picagem');
                addLog(`❌ ERRO AO PARAR: ${res.error}`);
            }
        }
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
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Virtualização do Contexto local:</span>
                        <select
                            className="bg-slate-800 text-white border border-slate-700 rounded-md px-2 py-1 text-xs"
                            value={estacaoId}
                            onChange={e => setEstacaoId(e.target.value)}
                            disabled={statusMOCK === 'SessaoAtiva'}
                        >
                            <option value="">(Selecione a Estação do Tablet)</option>
                            {estacoes.map(e => <option key={e.id} value={e.id}>{e.nome_estacao}</option>)}
                        </select>
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
                    <div className="mt-6 p-4 rounded-lg flex items-center gap-3 animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
                        <AlertTriangle size={20} className="shrink-0" />
                        <span style={{ fontWeight: 500 }}>{errMsg || 'Erro de Leitura! Verifique as conectividades e tags.'}</span>
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

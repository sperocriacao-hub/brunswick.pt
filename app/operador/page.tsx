"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MonitorSmartphone, AlertTriangle, Lightbulb, QrCode, FileText, UserCheck, UserX, CheckSquare, ListTodo, LogIn, HardHat, ChevronLeft, Wifi } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { getStationOperators, getStationChecklist, buscarEstacoes, dispararAlertaAndon } from './actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function InteractiveTabletPage() {
    const router = useRouter();

    // Context Factory State
    const [estacoes, setEstacoes] = useState<{ id: string, nome_estacao: string }[]>([]);
    const [selectedEstacaoId, setSelectedEstacaoId] = useState<string>('');

    // ESP32 Hardware State (Mirrored)
    type HmiMode = 'IDLE' | 'MENU_PAUSA' | 'MENU_FIM';
    const [mode, setMode] = useState<HmiMode>('IDLE');
    const [currentOpId, setCurrentOpId] = useState<string>('');
    const [isClockedIn, setIsClockedIn] = useState<boolean>(false);

    const [lcdLine1, setLcdLine1] = useState('BRUNSWICK MES v2.0');
    const [lcdLine2, setLcdLine2] = useState('Aguardando Rede...');
    const [rfidInput, setRfidInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Tablet Additions State
    const [operadores, setOperadores] = useState<any[]>([]);
    const [checklist, setChecklist] = useState<any[]>([]);
    const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

    // Pausa Options
    const pausaOptions = ['WC', 'Formacao', 'Clinica', 'Falta_Material'];
    const [pausaIndex, setPausaIndex] = useState(0);

    // Andon State
    const [isAndonModalOpen, setIsAndonModalOpen] = useState(false);
    const [andonType, setAndonType] = useState('Falta de peça');
    const [andonDesc, setAndonDesc] = useState('');
    const [causadoraEstacaoId, setCausadoraEstacaoId] = useState('');

    // --- BOOT SEQUENCE ---
    useEffect(() => {
        async function boot() {
            setLcdLine1('BOOTING SYSTEM...');
            setLcdLine2('A Ligar a Supabase...');
            const res = await buscarEstacoes();
            if (res.success && res.estacoes) {
                setEstacoes(res.estacoes);
                const savedEstacao = localStorage.getItem('shopfloor_tablet_estacao');
                if (savedEstacao && res.estacoes.find(e => e.id === savedEstacao)) {
                    setSelectedEstacaoId(savedEstacao);
                }
                setLcdLine1('PONTO ENTRADA');
                setLcdLine2('Pique o Cracha');
            } else {
                setLcdLine1('ERRO DE REDE');
                setLcdLine2('Contacte a T.I.');
            }
        }
        boot();

        // Auto-focus no input RFID oculto (ou não oculto)
        const focusInterval = setInterval(() => {
            if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                inputRef.current?.focus();
            }
        }, 3000);
        return () => clearInterval(focusInterval);
    }, []);

    // --- REFRESH DEPENDENCIES ---
    useEffect(() => {
        if (selectedEstacaoId) {
            localStorage.setItem('shopfloor_tablet_estacao', selectedEstacaoId);
            refreshStationData();

            if (isClockedIn) {
                setLcdLine1('SISTEMA ONLINE');
                setLcdLine2('A Ler Fila...');
                buscarTurnoAtualOP();
            }
        }
    }, [selectedEstacaoId, isClockedIn]);

    useEffect(() => {
        if (currentOpId && selectedEstacaoId) {
            fetchChecklist(currentOpId, selectedEstacaoId);
        } else {
            setChecklist([]);
        }
    }, [currentOpId, selectedEstacaoId]);

    // --- DATA FETCHING ---
    const refreshStationData = async () => {
        if (!selectedEstacaoId) return;
        const res = await getStationOperators(selectedEstacaoId);
        if (res.success && res.data) {
            setOperadores(res.data);
        }
    };

    const fetchChecklist = async (op_id: string, est_id: string) => {
        const res = await getStationChecklist(op_id, est_id);
        if (res.success && res.data) {
            setChecklist(res.data);
        }
    };

    const buscarTurnoAtualOP = async () => {
        if (!selectedEstacaoId) return;
        try {
            const res = await fetch('/api/mes/iot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device_id: "00:00:TABLET:HMI",
                    estacao_id: selectedEstacaoId,
                    action: 'GET_NEXT_OP'
                })
            });
            const data = await res.json();
            if (data.success && data.op_id) {
                setCurrentOpId(data.op_id);
                setLcdLine1(data.display?.substring(0, 16) || 'BARCO PRONTO');
                setLcdLine2(data.display_2?.substring(0, 16) || 'Pique o Cartao');
            } else if (data.success && !data.op_id) {
                setCurrentOpId('');
                setLcdLine1(data.display || 'FILA VAZIA');
                setLcdLine2(data.display_2 || 'AGUARDAR OP');
            }
        } catch (e) {
            console.error(e);
        }
    };

    // --- IoT RFID SUBMIT (MIMICS ESP32) ---
    const handleRfidSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const tag = rfidInput.trim().toUpperCase();
        if (!tag) return;

        if (!selectedEstacaoId) {
            setLcdLine1('ERRO LIGACAO');
            setLcdLine2('Fixe uma Estacao');
            setRfidInput('');
            setTimeout(() => {
                setLcdLine1('ATENCAO:');
                setLcdLine2('Selecione Estacao!');
            }, 3000);
            return;
        }

        setLcdLine1('A PROCESSAR...');
        setLcdLine2(`TAG: ${tag}`);
        setRfidInput('');

        // FASE 1: BATER PONTO SE AINDA NÃO CLOCKED IN
        if (!isClockedIn) {
            try {
                const res = await fetch('/api/mes/iot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        device_id: "00:00:TABLET:HMI",
                        action: 'PONTO',
                        operador_rfid: tag,
                        estacao_id: selectedEstacaoId || undefined
                    })
                });

                let data;
                try { data = JSON.parse(await res.text()); }
                catch (e) { data = { success: false, display: 'ERRO JSON' }; }

                if (res.ok && data.success) {
                    setIsClockedIn(true);
                    setLcdLine1(data.display?.substring(0, 16) || 'SUCESSO');
                    setLcdLine2(data.display_2?.substring(0, 16) || '');

                    // Force refresh HR data immediately to show them Green
                    refreshStationData();

                    setTimeout(() => {
                        buscarTurnoAtualOP();
                    }, 3000);
                } else {
                    setLcdLine1(data.display?.substring(0, 16) || '! ACESSO NEGADO');
                    setLcdLine2(data.display_2?.substring(0, 16) || data.error?.substring(0, 16) || '');
                    setTimeout(() => {
                        setLcdLine1('PONTO ENTRADA');
                        setLcdLine2('Pique o Cracha');
                    }, 3000);
                }
            } catch (error: any) {
                setLcdLine1('ERRO DE API');
                setLcdLine2(error.message?.substring(0, 16) || 'Timeout');
                setTimeout(() => {
                    setLcdLine1('PONTO ENTRADA');
                    setLcdLine2('Pique o Cracha');
                }, 3000);
            }
            return;
        }

        // FASE 2: ROTINAS DE PRODUÇÃO (TOGGLE OP, FATURAR, PAUSA)
        try {
            let actionName = 'TOGGLE_TAREFA';
            let pauseReason = undefined;

            if (mode === 'MENU_PAUSA') {
                actionName = 'REGISTAR_PAUSA';
                pauseReason = pausaOptions[pausaIndex];
            } else if (mode === 'MENU_FIM') {
                actionName = 'FECHAR_ESTACAO';
            } else if (mode === 'IDLE') {
                if (!currentOpId) {
                    setLcdLine1('! ERRO DE DADOS');
                    setLcdLine2('Falta OP na Fila');
                    setTimeout(() => {
                        setLcdLine1('FILA VAZIA');
                        setLcdLine2('AGUARDAR OP');
                    }, 3000);
                    return;
                }
                actionName = 'TOGGLE_TAREFA';
            }

            const res = await fetch('/api/mes/iot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device_id: "00:00:TABLET:HMI",
                    action: actionName,
                    operador_rfid: tag,
                    estacao_id: selectedEstacaoId,
                    op_id: currentOpId || undefined,
                    motivo_pausa: pauseReason
                })
            });

            let data;
            const rawText = await res.text();
            try { data = JSON.parse(rawText); }
            catch (e) { data = { success: false, display: 'ERRO JSON', display_2: rawText.substring(0, 12) }; }

            if (res.ok && data.success) {
                setLcdLine1(data.display?.substring(0, 16) || 'SUCESSO');
                setLcdLine2(data.display_2?.substring(0, 16) || '');
                if (actionName === 'FECHAR_ESTACAO') {
                    setTimeout(() => buscarTurnoAtualOP(), 3000);
                }
                // Refresh HR states
                refreshStationData();
            } else {
                setLcdLine1(data.display?.substring(0, 16) || '! ACESSO NEGADO');
                setLcdLine2(data.display_2?.substring(0, 16) || data.error?.substring(0, 16) || '');
            }

        } catch (error: any) {
            setLcdLine1('ERRO DE API');
            setLcdLine2(error.message?.substring(0, 16) || 'Timeout');
        }

        setTimeout(() => {
            if (currentOpId && mode === 'IDLE') return;
            setMode('IDLE');
            if (currentOpId) buscarTurnoAtualOP();
            else {
                setLcdLine1('SISTEMA ONLINE');
                setLcdLine2('AGUARDAR OP');
            }
        }, 4000);
    };

    // --- HARDWARE BUTTON EMULATON ---
    const handleHardwareButton = (btnLabel: string) => {
        if (!selectedEstacaoId || !isClockedIn) return;

        if (btnLabel === 'DOWN') {
            if (mode !== 'MENU_PAUSA') {
                setMode('MENU_PAUSA');
                setPausaIndex(0);
                setLcdLine1('-> MODO PAUSA <-');
                setLcdLine2(`[${pausaOptions[0]}]`);
            } else {
                const nextIdx = (pausaIndex + 1) % pausaOptions.length;
                setPausaIndex(nextIdx);
                setLcdLine2(`[${pausaOptions[nextIdx]}]`);
            }
        } else if (btnLabel === 'UP') {
            setMode('MENU_FIM');
            setLcdLine1('-> ENCERRAR <-');
            setLcdLine2('FECHAR ESTACAO?');
        } else if (btnLabel === 'CANCEL') {
            setMode('IDLE');
            setLcdLine1('SISTEMA ONLINE');
            setLcdLine2(currentOpId ? 'BARCO PRONTO' : 'AGUARDAR OP');
        }
    };

    const handleAndonTrigger = async () => {
        if (!selectedEstacaoId) {
            alert("⚠️ Selecione a sua Estação primeiro no canto superior direito!");
            return;
        }

        setCausadoraEstacaoId(selectedEstacaoId); // Default to current station
        setIsAndonModalOpen(true);
    };

    const confirmAndonFire = async () => {
        setIsAndonModalOpen(false);
        // Usa o input atual ou uma marcação anónima de emergência
        const opRfid = rfidInput || 'EMERGENCIA_MANUAL';
        const targetStation = causadoraEstacaoId || selectedEstacaoId;
        const res = await dispararAlertaAndon(targetStation, opRfid, undefined, andonType, andonDesc);

        if (res.success) {
            setLcdLine1('🚨 ANDON ATIVO 🚨');
            setLcdLine2('Ajuda a caminho!');
            // Return to Idle after 6 seconds
            setTimeout(() => {
                setLcdLine1('SISTEMA ONLINE');
                setLcdLine2(currentOpId ? 'BARCO PRONTO' : 'AGUARDAR OP');
            }, 6000);
        } else {
            alert(res.error || "Erro ao comunicar com a Base de Dados Central.");
            setLcdLine1('FALHA ANDON!');
            setLcdLine2('Contacte Lider!');
            setTimeout(() => {
                setLcdLine1('SISTEMA ONLINE');
                setLcdLine2(currentOpId ? 'BARCO PRONTO' : 'AGUARDAR OP');
            }, 4000);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-slate-200 flex flex-col font-sans">
            {/* 1. GLOBAL HEADER BAR */}
            <header className="bg-slate-900 border-b border-slate-800 p-4 flex flex-col gap-4 shadow-xl z-20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => router.push('/')}>
                            <ChevronLeft className="w-6 h-6 mr-2" />
                            Sair
                        </Button>
                        <div className="bg-blue-600/20 text-blue-400 p-2 rounded-lg">
                            <MonitorSmartphone className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">SHOPFLOOR HMI <span className="text-blue-400 font-light border border-blue-500/30 px-2 py-0.5 rounded text-sm ml-2">Tablet Mode</span></h1>
                            <p className="text-slate-400 text-sm flex items-center gap-2">
                                <Wifi className="w-3 h-3 text-green-500" /> API Conectada
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="destructive"
                            onClick={handleAndonTrigger}
                            className="h-12 bg-red-600 hover:bg-red-700 text-white font-black tracking-widest gap-2 shadow-lg shadow-red-500/20 animate-pulse hidden md:flex"
                        >
                            <AlertTriangle size={24} />
                            Andon Help
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => router.push('/operador/ideias')}
                            className="h-12 bg-amber-900/80 hover:bg-amber-800 text-amber-100 border border-amber-700/50 font-bold gap-2 hidden md:flex"
                        >
                            <Lightbulb size={20} className="text-amber-400" />
                            Andon Kaizen
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => router.push('/operador/rastreabilidade')}
                            className="h-12 bg-indigo-900 hover:bg-indigo-800 text-indigo-100 border border-indigo-700 font-bold gap-2 hidden md:flex"
                        >
                            <QrCode size={20} className="text-indigo-400" />
                            Scanner B.O.M.
                        </Button>

                        <div className={`w-64 transition-opacity`}>
                            <SearchableSelect
                                options={estacoes.map(est => ({ value: est.id, label: est.nome_estacao }))}
                                value={selectedEstacaoId}
                                onChange={setSelectedEstacaoId}
                                placeholder="Vincular Posto (Tablet)..."
                                className="h-10 text-sm font-bold border border-slate-700 bg-slate-800 text-slate-200"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. THREE-PANE LAYOUT */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">

                {/* PANE LEFT: TEAM ROSTER */}
                <aside className="w-full lg:w-1/4 bg-slate-900/50 border-r border-slate-800 flex flex-col p-4 gap-4 overflow-y-auto hidden lg:flex">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <HardHat className="w-5 h-5 text-amber-500" /> A Equipa (Neste Posto)
                        </h2>
                    </div>
                    {operadores.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 flex flex-col items-center">
                            <UserX className="w-12 h-12 mb-4 opacity-50" />
                            <p>Sem Operadores Alocados.</p>
                            <p className="text-sm">Contacte o RH.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {operadores.map((op) => (
                                <div key={op.id} className={`p-4 rounded-xl border flex items-center gap-4 transition-colors ${op.isClockedIn ? 'bg-green-950/30 border-green-800/50' : 'bg-slate-800/30 border-slate-800'}`}>
                                    <div className={`p-2 rounded-full ${op.isClockedIn ? 'bg-green-600/20 text-green-400' : 'bg-slate-700/50 text-slate-500'}`}>
                                        {op.isClockedIn ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className={`font-bold ${op.isClockedIn ? 'text-green-400' : 'text-slate-400'}`}>{op.nome}</p>
                                        <p className="text-xs text-slate-500 font-mono">TAG: {op.rfid}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </aside>

                {/* PANE CENTER: PRODUCTION TERMINAL (The Simulator Embedded) */}
                <section className="w-full lg:w-2/5 p-6 lg:p-12 flex flex-col items-center justify-center bg-slate-950 relative border-r border-slate-800 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">

                    <div className="w-full max-w-md bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl relative">
                        {/* Terminal Header */}
                        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="font-bold text-slate-300">DASHBOARD M.E.S.</span>
                            </div>
                            <Wifi className={`w-5 h-5 ${selectedEstacaoId ? 'text-green-500' : 'text-slate-600'}`} />
                        </div>

                        {/* LCD Display 16x2 Emulation   */}
                        <div className="bg-[#1b2b1b] border-8 border-slate-700 rounded-xl w-full p-4 mb-10 shadow-[inset_0_5px_15px_rgba(0,0,0,0.8)] flex flex-col gap-2 relative overflow-hidden min-h-[220px] justify-center">
                            {/* Bezel branding */}
                            <div className="absolute top-1 left-2 text-[#4ade80] opacity-20 text-[0.6rem] font-bold">1602A LCD MODULE</div>

                            {/* Glass overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

                            <div className="mt-2 font-mono text-base md:text-xl font-medium text-[#4ade80] drop-shadow-[0_0_8px_rgba(74,222,128,0.6)] tracking-[0.25em] whitespace-pre truncate uppercase">
                                {lcdLine1.padEnd(16, ' ')}
                            </div>
                            <div className="font-mono text-base md:text-xl font-medium text-[#4ade80] drop-shadow-[0_0_8px_rgba(74,222,128,0.6)] tracking-[0.25em] whitespace-pre truncate uppercase mt-1">
                                {lcdLine2.padEnd(16, ' ')}
                            </div>
                        </div>

                        {/* Physical/Logical Buttons */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <button onClick={() => handleHardwareButton('UP')} className="h-16 rounded-xl bg-slate-700 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 text-slate-300 font-bold hover:bg-slate-600 transition-all flex flex-col items-center justify-center">
                                <span className="text-xs text-slate-400 mb-1">↑</span>FIM
                            </button>
                            <button onClick={() => handleHardwareButton('DOWN')} className="h-16 rounded-xl bg-slate-700 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 text-slate-300 font-bold hover:bg-slate-600 transition-all flex flex-col items-center justify-center">
                                <span className="text-xs text-slate-400 mb-1">↓</span>PAUSA
                            </button>
                            <button onClick={() => handleHardwareButton('CANCEL')} className="h-16 rounded-xl bg-red-900/80 border-b-4 border-red-950 active:border-b-0 active:translate-y-1 text-red-100 font-bold hover:bg-red-800 transition-all">
                                CANCEL
                            </button>
                        </div>

                        {/* RFID Scanner Emulation */}
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full transition-transform group-active:scale-110"></div>
                            <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner border border-slate-700">
                                <Wifi className="w-8 h-8 text-blue-500/50" />
                            </div>
                            <p className="text-sm font-medium text-slate-400 mb-4 tracking-wider uppercase">Passe o Cartão (ou Digite)</p>

                            <form onSubmit={handleRfidSubmit} className="relative z-10 w-full max-w-[200px] mx-auto">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={rfidInput}
                                    onChange={(e) => setRfidInput(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-center text-blue-400 font-mono tracking-widest focus:outline-none focus:border-blue-500 shadow-inner"
                                    placeholder="HEX_TAG"
                                    autoComplete="off"
                                />
                                <button type="submit" className="hidden">Simular API</button>
                            </form>
                        </div>

                    </div>
                </section>

                {/* PANE RIGHT: CHECKLIST E OPs */}
                <aside className="w-full lg:w-1/3 bg-slate-900/30 p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                            <CheckSquare className="w-6 h-6 text-blue-400" />
                            Checklist de Estação
                        </h2>
                        {currentOpId ? (
                            <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">
                                EM EXECUÇÃO
                            </span>
                        ) : (
                            <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs font-bold border border-slate-700">
                                EM ESPERA
                            </span>
                        )}
                    </div>

                    {!currentOpId ? (
                        <div className="h-64 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                            <ListTodo className="w-16 h-16 mb-4 opacity-50" />
                            <p className="font-bold text-lg mb-2">Aguardando Início de Tarefa</p>
                            <p className="text-sm">Por favor, passe o cartão na Área Central para reclamar ou iniciar um barco e as suas instruções aparecerão aqui.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {checklist.length === 0 ? (
                                <p className="text-slate-500 text-sm">Sem roteiro definido para este modelo/estação.</p>
                            ) : (
                                checklist.map((task, idx) => (
                                    <div key={task.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col gap-3 shadow-sm hover:border-slate-600 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold text-sm">
                                                    {task.sequencia}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-200">{task.descricao_tarefa || `Operação ${task.sequencia}`}</h3>
                                                    <p className="text-xs text-slate-400">Tempo Alvo: {task.tempo_ciclo}m</p>
                                                </div>
                                            </div>
                                        </div>

                                        {task.imagem_instrucao_url && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full mt-2 bg-slate-900 border-slate-700 hover:bg-slate-800 text-blue-400 hover:text-blue-300"
                                                onClick={() => setSelectedPdf(task.imagem_instrucao_url)}
                                            >
                                                <FileText className="w-4 h-4 mr-2" />
                                                Abrir Instrução PDF (SOP)
                                            </Button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </aside>
            </main>

            {/* ANDON MODAL */}
            <Dialog open={isAndonModalOpen} onOpenChange={setIsAndonModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-red-500 uppercase tracking-widest flex items-center gap-4">
                            <AlertTriangle size={32} />
                            Disparo Andon
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-lg">
                            Esta ação irá bloquear a passagem na TV da Área e notificar os Supervisores. Qual é a causa da paragem?
                            <div className="mt-4 p-3 bg-red-950/40 border border-red-900/50 rounded-md">
                                <span className="text-red-400 font-bold uppercase tracking-widest text-xs block mb-1">Local da Ocorrência</span>
                                <span className="text-white font-medium">{estacoes.find(e => e.id === selectedEstacaoId)?.nome_estacao || 'Estação Desconhecida'}</span>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-slate-300 font-bold uppercase tracking-widest mb-2 block">Estação Causadora (TV Alvo)</Label>
                            <select
                                value={causadoraEstacaoId}
                                onChange={(e) => setCausadoraEstacaoId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-white text-lg font-medium focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="" disabled>Selecione a Estação / Área Causadora...</option>
                                {estacoes.map(est => (
                                    <option key={est.id} value={est.id}>{est.nome_estacao}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300 font-bold uppercase tracking-widest mb-2 block">Tipo de Incidência</Label>
                            <select
                                value={andonType}
                                onChange={(e) => setAndonType(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-white text-lg font-medium focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="Falta de peça">⚠️ Falta de Peça</option>
                                <option value="Avaria de equipamento">🔧 Avaria de Equipamento</option>
                                <option value="Ajuste técnico">⚙️ Ajuste Técnico/Qualidade</option>
                                <option value="Scrap">🗑️ Defeito / Scrap</option>
                                <option value="Outros">❓ Outros</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300 font-bold uppercase tracking-widest block">Observação (Opcional)</Label>
                            <Textarea
                                value={andonDesc}
                                onChange={(e) => setAndonDesc(e.target.value)}
                                placeholder="Qual peça falta? Qual a máquina partida?"
                                className="bg-slate-950 border-slate-700 text-white focus-visible:ring-red-500 min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsAndonModalOpen(false)}
                            className="text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            CANCELAR
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmAndonFire}
                            className="bg-red-600 hover:bg-red-700 text-white font-black tracking-widest px-8"
                        >
                            DISPARAR ALARME
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* PDF MODAL */}
            <Dialog open={!!selectedPdf} onOpenChange={() => setSelectedPdf(null)}>
                <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-4xl h-[80vh] flex flex-col p-0">
                    <DialogHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between">
                        <DialogTitle className="text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-400" />
                            SOP / Standard Work Instruction
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden bg-slate-950 flex items-center justify-center p-4">
                        {/* Placeholder visual se fosse um PDF real (embed) - para demonstração usamos um placeholder ou o embed direto se a url for válida */}
                        {selectedPdf ? (
                            <iframe
                                src={selectedPdf}
                                className="w-full h-full border-none rounded bg-white shadow-inner"
                                title="Instruções em PDF"
                            />
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

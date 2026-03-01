'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MonitorSmartphone, ChevronLeft, Wifi, QrCode, AlertTriangle, Lightbulb } from 'lucide-react';
import { buscarEstacoes, dispararAlertaAndon } from './actions';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TabletDashboardPage() {
    const router = useRouter();

    // Context Factory State
    const [estacoes, setEstacoes] = useState<{ id: string, nome_estacao: string }[]>([]);
    const [selectedEstacaoId, setSelectedEstacaoId] = useState<string>('');

    // ESP32 Hardware State
    type HmiMode = 'IDLE' | 'MENU_PAUSA' | 'MENU_FIM';
    const [mode, setMode] = useState<HmiMode>('IDLE');

    // Pausa Options
    const pausaOptions = ['WC', 'Formacao', 'Clinica', 'Falta_Material'];
    const [pausaIndex, setPausaIndex] = useState(0);

    const [lcdLine1, setLcdLine1] = useState('BRUNSWICK MES v2.0');
    const [lcdLine2, setLcdLine2] = useState('Aguardando Rede...');
    const [rfidInput, setRfidInput] = useState('');
    // Ref a um input fantasma para garantir que pistoladas (barcode/rfid scanner)
    // caiem sempre lá quando a app está em idle.
    const inputRef = useRef<HTMLInputElement>(null);

    // Estado do Modal de Andon
    const [isAndonModalOpen, setIsAndonModalOpen] = useState(false);
    const [andonType, setAndonType] = useState('Falta de peça');
    const [andonDesc, setAndonDesc] = useState('');
    const [causadoraEstacaoId, setCausadoraEstacaoId] = useState('');

    // Boot Sequence
    useEffect(() => {
        async function bootSequence() {
            setLcdLine1('BOOTING SYSTEM...');
            setLcdLine2('A Ligar a Supabase...');
            const res = await buscarEstacoes();
            if (res.success && res.estacoes) {
                setEstacoes(res.estacoes);
                const savedEstacao = localStorage.getItem('tablet_last_estacao');
                if (savedEstacao && res.estacoes.find(e => e.id === savedEstacao)) {
                    setSelectedEstacaoId(savedEstacao);
                    setLcdLine1('SISTEMA ONLINE');
                    setLcdLine2('Ler Cracha / Barco');
                } else {
                    setLcdLine1('ATENCAO:');
                    setLcdLine2('Selecione Estacao!');
                }
            } else {
                setLcdLine1('ERRO DE REDE');
                setLcdLine2('Contacte a T.I.');
            }
        }
        bootSequence();
    }, []);

    useEffect(() => {
        if (selectedEstacaoId) {
            localStorage.setItem('tablet_last_estacao', selectedEstacaoId);
            setLcdLine1('SISTEMA ONLINE');
            setLcdLine2('Ler Cracha / Barco');
        }
    }, [selectedEstacaoId]);

    // Focus Lock for RFID Keyboard
    useEffect(() => {
        const interval = setInterval(() => {
            if (inputRef.current && document.activeElement !== inputRef.current) {
                inputRef.current.focus();
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

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

        try {
            // Prepare Custom Variables for Emulation payload
            let emitType = 'RFID_SCAN';
            let pauseReason = null;
            let endStation = null;

            if (mode === 'MENU_PAUSA') {
                emitType = 'BUTTON_DOWN_PAUSE';
                pauseReason = pausaOptions[pausaIndex];
            } else if (mode === 'MENU_FIM') {
                emitType = 'BUTTON_UP_FINISH';
                endStation = 'TRUE';
            }

            // Emulate ESP32 HTTP POST logic here
            const res = await fetch('/api/mes/iot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    station_id: selectedEstacaoId,
                    rfid_tag: tag,
                    device_mac: "00:00:TABLET:HMI",
                    firmware_ver: "v2.0_TABLET_EMU",
                    // Emulated Hardware states
                    action_override: emitType,
                    pause_reason: pauseReason,
                    finish_station: endStation
                })
            });

            const rawText = await res.text();

            // Simulação de Beep de Sucesso (Visual)
            if (res.ok) {
                setLcdLine1('>>> SUCESSO <<<');
                setLcdLine2(rawText.substring(0, 16));
            } else {
                setLcdLine1('! ACESSO NEGADO');
                setLcdLine2(rawText.substring(0, 16));
            }

        } catch (error: any) {
            setLcdLine1('ERRO DE API');
            setLcdLine2(error.message?.substring(0, 16) || 'Timeout');
        }

        // Return to Idle after 4 seconds
        setTimeout(() => {
            setLcdLine1('SISTEMA ONLINE');
            setLcdLine2('Ler Cracha / Barco');
        }, 4000);
    };

    const handleHardwareButton = (btnLabel: string) => {
        if (!selectedEstacaoId) return;

        if (btnLabel === 'DOWN') {
            if (mode !== 'MENU_PAUSA') {
                setMode('MENU_PAUSA');
                setPausaIndex(0);
                setLcdLine1('> MOTIVO PAUSA <');
                setLcdLine2(pausaOptions[0].padEnd(16, ' '));
            } else {
                // Cycle through pauses
                const nextIdx = (pausaIndex + 1) % pausaOptions.length;
                setPausaIndex(nextIdx);
                setLcdLine2(pausaOptions[nextIdx].padEnd(16, ' '));
            }
        }
        else if (btnLabel === 'UP') {
            setMode('MENU_FIM');
            setLcdLine1('> CONCLUIR OP? <');
            setLcdLine2('Ler Barco/RFID  ');
        }
        else if (btnLabel === 'SELECT') {
            // Cancelar e voltar ao IDLE
            setMode('IDLE');
            setLcdLine1('SISTEMA ONLINE');
            setLcdLine2('Ler Cracha / Barco');
        }

        inputRef.current?.focus();
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
                setLcdLine2('Ler Cracha / Barco');
            }, 6000);
        } else {
            alert(res.error || "Erro ao comunicar com a Base de Dados Central.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-mono text-slate-300">
            {/* ADMIN TOP BAR */}
            <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 flex flex-col md:flex-row gap-4 items-center justify-between shadow-2xl">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 hover:bg-slate-800 rounded-full h-12 w-12 text-slate-400">
                        <ChevronLeft size={28} />
                    </Button>
                    <div className="w-12 h-12 bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center shadow-inner">
                        <MonitorSmartphone className="text-emerald-500" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-100 tracking-tight">SUPER EMULATOR HMI</h1>
                        <p className="text-sm text-emerald-500 font-bold tracking-widest">ESP32 DIGITAL TWIN</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
                    <Button
                        variant="destructive"
                        onClick={handleAndonTrigger}
                        className="h-12 bg-red-600 hover:bg-red-700 text-white font-black tracking-widest gap-2 shadow-lg shadow-red-500/20 animate-pulse"
                    >
                        <AlertTriangle size={24} />
                        <span className="hidden xl:inline">ANDON / SUPORTE URGENTE</span>
                        <span className="inline xl:hidden">ANDON</span>
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => router.push('/operador/ideias')}
                        className="h-12 bg-amber-900/80 hover:bg-amber-800 text-amber-100 border border-amber-700/50 font-bold gap-2"
                    >
                        <Lightbulb size={20} className="text-amber-400" />
                        <span className="hidden md:inline">Mural Kaizen</span>
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => router.push('/operador/rastreabilidade')}
                        className="h-12 bg-indigo-900 hover:bg-indigo-800 text-indigo-100 border border-indigo-700 font-bold gap-2"
                    >
                        <QrCode size={20} className="text-indigo-400" />
                        <span className="hidden md:inline">Scanner B.O.M.</span>
                    </Button>

                    <div className="flex-1 md:w-80">
                        <SearchableSelect
                            options={estacoes.map(est => ({ value: est.id, label: est.nome_estacao }))}
                            value={selectedEstacaoId}
                            onChange={setSelectedEstacaoId}
                            placeholder="Vincular a Terminal Fisico..."
                            className="h-12 text-sm font-bold border border-slate-700 bg-slate-800 text-slate-200"
                        />
                    </div>
                </div>
            </header>

            {/* HARDWARE TWIN AREA */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-[url('/img/carbon-fiber.png')] bg-repeat">

                {/* The Box */}
                <div className="bg-gradient-to-br from-slate-200 to-slate-400 border-[12px] border-slate-500 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_4px_10px_rgba(255,255,255,0.8)] w-full max-w-4xl flex flex-col md:flex-row overflow-hidden relative">

                    {/* Fake Screws */}
                    <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"></div>
                    <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"></div>
                    <div className="absolute bottom-4 left-4 w-4 h-4 rounded-full bg-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"></div>
                    <div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"></div>

                    {/* LEFT PANEL: SCANNER & INPUT */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center border-b-8 md:border-b-0 md:border-r-8 border-slate-400/30">
                        <div className="mb-8 w-48 h-48 rounded-full border-[16px] border-blue-500/20 flex flex-col items-center justify-center bg-blue-100 shadow-[inset_0_10px_20px_rgba(0,0,0,0.1)] relative">
                            <Wifi size={64} className="text-blue-500 animate-pulse mb-2" />
                            <span className="text-blue-800 font-extrabold tracking-widest text-sm">RFID SENSOR</span>
                            {/* Blinking LEDs */}
                            <div className="absolute top-4 right-8 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                        </div>

                        <form onSubmit={handleRfidSubmit} className="w-full">
                            <label className="text-xs font-bold text-slate-500 tracking-widest block mb-2 text-center uppercase">Teclado Manual (Substitui Cartão Fisico)</label>
                            <input
                                ref={inputRef}
                                type="text"
                                value={rfidInput}
                                onChange={(e) => setRfidInput(e.target.value)}
                                placeholder="Pique o Cartão aqui..."
                                className="w-full h-16 text-center text-2xl font-black tracking-widest uppercase bg-white border-4 border-slate-300 rounded-xl text-slate-800 shadow-inner focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 transition-all placeholder:text-slate-300"
                                autoFocus
                            />
                            <button type="submit" className="hidden">Send</button>
                        </form>
                    </div>

                    {/* RIGHT PANEL: LCD & BUTTONS */}
                    <div className="w-full md:w-1/2 p-8 flex flex-col items-center bg-slate-800/5 relative">

                        {/* LCD Display 16x2 Emulation */}
                        <div className="bg-[#1b2b1b] border-8 border-slate-700 rounded-xl w-full p-4 mb-10 shadow-[inset_0_5px_15px_rgba(0,0,0,0.8)] flex flex-col gap-1 relative overflow-hidden">
                            {/* Bezel branding */}
                            <div className="absolute top-1 left-2 text-[#4ade80] opacity-20 text-[0.6rem] font-bold">1602A LCD MODULE</div>

                            {/* Glass overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

                            <div className="mt-4 font-mono text-3xl font-black text-[#4ade80] drop-shadow-[0_0_5px_rgba(74,222,128,0.5)] tracking-[0.2em] whitespace-pre truncate">
                                {lcdLine1.padEnd(16, ' ')}
                            </div>
                            <div className="font-mono text-3xl font-black text-[#4ade80] drop-shadow-[0_0_5px_rgba(74,222,128,0.5)] tracking-[0.2em] whitespace-pre truncate">
                                {lcdLine2.padEnd(16, ' ')}
                            </div>
                        </div>

                        {/* Physical Buttons */}
                        <div className="flex gap-6 w-full justify-center mt-auto">
                            <button
                                type="button"
                                onClick={() => handleHardwareButton('UP')}
                                className="w-24 h-24 rounded-full bg-rose-500 hover:bg-rose-400 active:bg-rose-600 border-b-8 border-rose-700 active:border-b-0 active:translate-y-2 transition-all shadow-xl flex flex-col items-center justify-center hover:shadow-[0_0_20px_#f43f5e]"
                            >
                                <span className="text-white text-3xl font-black mb-1">▲</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleHardwareButton('SELECT')}
                                className="w-24 h-24 rounded-full bg-blue-500 hover:bg-blue-400 active:bg-blue-600 border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all shadow-xl flex flex-col items-center justify-center hover:shadow-[0_0_20px_#3b82f6]"
                            >
                                <span className="text-white text-lg font-black tracking-widest">SEL</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleHardwareButton('DOWN')}
                                className="w-24 h-24 rounded-full bg-rose-500 hover:bg-rose-400 active:bg-rose-600 border-b-8 border-rose-700 active:border-b-0 active:translate-y-2 transition-all shadow-xl flex flex-col items-center justify-center hover:shadow-[0_0_20px_#f43f5e]"
                            >
                                <span className="text-white text-3xl font-black mt-1">▼</span>
                            </button>
                        </div>

                        <div className="flex w-full justify-center gap-[4.5rem] mt-4 text-slate-500 font-bold uppercase tracking-widest text-xs">
                            <span>UP/FIM</span>
                            <span>SELECT</span>
                            <span>PAUSAS</span>
                        </div>

                    </div>
                </div>

                {/* Hardware Speaker Holes */}
                <div className="absolute bottom-8 right-12 flex gap-2 opacity-50">
                    <div className="w-4 h-4 bg-slate-700 rounded-full"></div>
                    <div className="w-4 h-4 bg-slate-700 rounded-full"></div>
                    <div className="w-4 h-4 bg-slate-700 rounded-full"></div>
                    <div className="w-4 h-4 bg-slate-700 rounded-full"></div>
                </div>

            </main>

            {/* Modal Contextual de Disparo Andon */}
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
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { Cpu, ChevronUp, ChevronDown, CheckCircle2, Send, RefreshCw } from 'lucide-react';
import { registerHeartbeat, submitRfidScanSimulator } from '../actions';

export function Esp32Simulator() {
    // Menu States
    const [lcdLine1, setLcdLine1] = useState('BRUNSWICK M.E.S');
    const [lcdLine2, setLcdLine2] = useState('> Pressione Select');
    const [menuIndex, setMenuIndex] = useState(-1);

    // Test States
    const [rfidInput, setRfidInput] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);

    const menuOptions = [
        '1. Status Wi-Fi',
        '2. Teste RFID',
        '3. Sel. Estacao',
        '4. Send Heartbeat'
    ];

    const MAC_SIMULADO = 'AA:BB:CC:DD:EE:00';

    const handleUp = () => {
        if (menuIndex > 0) {
            setMenuIndex(menuIndex - 1);
            setLcdLine1('Menu Principal:');
            setLcdLine2(`> ${menuOptions[menuIndex - 1]}`);
        }
    };

    const handleDown = () => {
        if (menuIndex < menuOptions.length - 1) {
            setMenuIndex(menuIndex + 1);
            setLcdLine1('Menu Principal:');
            setLcdLine2(`> ${menuOptions[menuIndex + 1]}`);
        } else if (menuIndex === -1) {
            setMenuIndex(0);
            setLcdLine1('Menu Principal:');
            setLcdLine2(`> ${menuOptions[0]}`);
        }
    };

    const handleSelect = async () => {
        if (menuIndex === -1) {
            setMenuIndex(0);
            setLcdLine1('Menu Principal:');
            setLcdLine2(`> ${menuOptions[0]}`);
            return;
        }

        const selected = menuOptions[menuIndex];

        setLcdLine1(`[ ${selected} ]`);

        if (selected.includes('Wi-Fi')) {
            setLcdLine2('SSID: BRUNSWICK_IOT\nIP: 192.168.1.55');
            setTimeout(() => { setMenuIndex(-1); setLcdLine1('BRUNSWICK M.E.S'); setLcdLine2('> Pressione Select'); }, 4000);
        } else if (selected.includes('Heartbeat')) {
            setLcdLine2('Enviando...');
            const res = await registerHeartbeat(MAC_SIMULADO, '192.168.1.55', 'v1.0.0-SIM');
            if (res.success) setLcdLine2('OK! BD Atualizada');
            else setLcdLine2('ERRO de Rede');
            setTimeout(() => { setMenuIndex(-1); setLcdLine1('BRUNSWICK M.E.S'); setLcdLine2('> Pressione Select'); }, 3000);
        } else if (selected.includes('Estacao')) {
            setLcdLine2('Estacao Lock: 0002');
            setTimeout(() => { setMenuIndex(-1); setLcdLine1('BRUNSWICK M.E.S'); setLcdLine2('> Pressione Select'); }, 3000);
        } else if (selected.includes('RFID')) {
            setLcdLine2('Esperando Cartao...');
        }
    };

    const handleSimulateRfid = async () => {
        if (!rfidInput.trim()) return;
        setIsSimulating(true);
        setLcdLine1('Lendo Tag...');
        setLcdLine2(`ID: ${rfidInput.slice(0, 8)}...`);

        const res = await submitRfidScanSimulator(MAC_SIMULADO, rfidInput, undefined);

        setIsSimulating(false);
        if (res.success) {
            setLcdLine1('ACESSO AUTORIZADO');
            setLcdLine2('Operacao Registada');
        } else {
            setLcdLine1('ACESSO NEGADO');
            setLcdLine2('Erro M.E.S');
        }

        setRfidInput('');
        setTimeout(() => { setMenuIndex(-1); setLcdLine1('BRUNSWICK M.E.S'); setLcdLine2('> Pressione Select'); }, 4000);
    };

    return (
        <section className="glass-panel p-6 flex flex-col h-full bg-slate-900 border border-slate-700">
            <h2 className="flex items-center gap-2 mb-6" style={{ fontSize: '1.2rem', color: '#c0caf5' }}>
                <Cpu size={20} /> Simulador HMI (Gêmeo Digital)
            </h2>

            <div className="flex-1 flex flex-col items-center justify-center">
                {/* Carcaça do ESP32/Box Industrial */}
                <div className="bg-slate-800 p-6 rounded-xl border-4 border-slate-700 shadow-2xl relative w-full max-w-sm">
                    {/* Parafusos de hardware (Puro Flair Visual) */}
                    <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-slate-600 shadow-inner"></div>
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-slate-600 shadow-inner"></div>
                    <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-slate-600 shadow-inner"></div>
                    <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-slate-600 shadow-inner"></div>

                    {/* Ecrã LCD */}
                    <div className="bg-[#1e1e1ede] p-4 rounded border-4 border-slate-900 mb-8 min-h-[100px] flex flex-col justify-center shadow-inner relative overflow-hidden">
                        {/* Scanlines / Retro Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 pointer-events-none opacity-50"></div>
                        <div className="font-mono text-[1.1rem] leading-tight z-20 text-[#0f0] drop-shadow-[0_0_8px_rgba(0,255,0,0.8)] whitespace-pre-wrap">
                            <div>{lcdLine1}</div>
                            <div className="mt-2">{lcdLine2}</div>
                        </div>
                    </div>

                    {/* Botões Físicos */}
                    <div className="flex justify-between px-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest bg-slate-900 border border-slate-700 rounded-lg py-1">Navegação</span>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleUp}
                                    className="w-14 h-14 rounded-full bg-slate-700 border-b-4 border-slate-900 hover:bg-slate-600 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg"
                                >
                                    <ChevronUp size={24} className="text-white" />
                                </button>
                                <button
                                    onClick={handleDown}
                                    className="w-14 h-14 rounded-full bg-slate-700 border-b-4 border-slate-900 hover:bg-slate-600 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg"
                                >
                                    <ChevronDown size={24} className="text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 items-center">
                            <span className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest w-full bg-slate-900 border border-slate-700 rounded-lg py-1">Confirma</span>
                            <button
                                onClick={handleSelect}
                                className="w-14 h-14 rounded-full bg-red-600 border-b-4 border-red-900 hover:bg-red-500 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                            >
                                <CheckCircle2 size={24} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Input de Teste RFID (Manual Push) */}
                <div className="mt-8 w-full max-w-sm bg-black/30 p-4 border border-white/10 rounded-xl relative">
                    <div className="absolute -top-3 left-4 bg-[#1a1c29] px-2 text-xs font-bold text-accent tracking-widest">TESTE API RFID</div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="form-control flex-1 text-sm font-mono tracking-widest placeholder-white/30"
                            placeholder="Inserir Hexadecimal (Ex: A1B2C3D4)"
                            value={rfidInput}
                            onChange={(e) => setRfidInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleSimulateRfid()}
                        />
                        <button
                            className="btn btn-primary px-3 rounded-lg"
                            onClick={handleSimulateRfid}
                            disabled={!rfidInput.trim() || isSimulating || menuIndex !== 1}
                            title={menuIndex !== 1 ? "Ative o 'Teste RFID' no LCD Primeiro" : ""}
                        >
                            {isSimulating ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </div>
                    {menuIndex !== 1 && (
                        <p className="text-[10px] text-red-400 opacity-80 mt-2 text-center">Navegue até &quot;Teste RFID&quot; no simulador físico em cima para destrancar este input de Scanner HMI.</p>
                    )}
                </div>
            </div>
        </section>
    );
}

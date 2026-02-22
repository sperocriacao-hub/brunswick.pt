'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, ChevronUp, ChevronDown, CheckCircle2, Send, RefreshCw } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type LcdState = 'BOOT' | 'IDLE' | 'MENU_MODE' | 'PULL_MODE' | 'FECHAR_MODE' | 'RESPONSE';

export function Esp32Simulator() {
    const supabase = createClient();

    // Hardware State
    const [lcd, setLcd] = useState<string[]>(['M.E.S Booting...', 'A conectar Wi-Fi...', '', '']);
    const [state, setState] = useState<LcdState>('BOOT');
    const [rfidInput, setRfidInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Contexto Ativo do ESP32 (Estação e a Ordem que ele tem puxada no ecrã)
    const [estacao, setEstacao] = useState<{ id: string, nome: string } | null>(null);
    const [activeOpId, setActiveOpId] = useState<string | null>(null);

    // Menus Circulares
    const EXTRA_MENU = [
        { label: 'Ponto Diário', action: 'PONTO' },
        { label: 'Pausa: WC', action: 'REGISTAR_PAUSA', reqMotivo: 'WC' },
        { label: 'Formação RH', action: 'REGISTAR_PAUSA', reqMotivo: 'FORMACAO' },
        { label: 'Apoio Médico', action: 'REGISTAR_PAUSA', reqMotivo: 'MEDICO' },
        { label: 'Falta Material', action: 'REGISTAR_PAUSA', reqMotivo: 'FALTA_MATERIAL' }
    ];
    const [menuIdx, setMenuIdx] = useState(0);

    // Boot Sequence
    useEffect(() => {
        async function bootDevice() {
            // Find a random physical station to bind this device to
            const { data } = await supabase.from('estacoes').select('id, nome_estacao').limit(1).single();
            if (data) {
                setEstacao({ id: data.id, nome: data.nome_estacao });
                setTimeout(() => goIdle(data.nome_estacao), 1500);
            } else {
                setLcd(['ERRO DE BOOT:', 'Nenhuma Estacao', 'criada na BD!', '']);
            }
        }
        bootDevice();
    }, []);

    // Helper: Desenhar Ecrã
    const draw = (l1: string, l2: string, l3: string, l4: string) => setLcd([l1, l2, l3, l4]);

    // Voltar ao Ecrã Inicial
    const goIdle = (nomeEst?: string) => {
        setState('IDLE');
        setActiveOpId(null);
        setMenuIdx(0);
        const est = nomeEst || estacao?.nome || 'Desconhecida';
        draw(
            `Est: ${est.substring(0, 15)}`,
            'DWN: Pausas / RH',
            'SEL: Puxar Barco',
            'UP : Fechar Estacao'
        );
    };

    // Apresentar Mensagem Temporária e voltar ao IDLE
    const showResponse = (ms: number, ...lines: string[]) => {
        setState('RESPONSE');
        setLcd([lines[0] || '', lines[1] || '', lines[2] || '', lines[3] || '']);
        setTimeout(() => goIdle(), ms);
    };

    // Disparar Rest Request para a Nossa Arquitetura NASA API
    const fireApi = async (action: string, payload: any = {}) => {
        setIsLoading(true);
        draw('A comunicar...', 'Cloud Supabase', '...', '');
        try {
            const res = await fetch('/api/mes/iot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device_id: 'SIMULATOR-01',
                    estacao_id: estacao?.id,
                    action,
                    ...payload
                })
            });
            const data = await res.json();
            setIsLoading(false);
            return data;
        } catch (err) {
            setIsLoading(false);
            return { success: false, display: 'ERRO HTTPS' };
        }
    };

    // --- BUTTON HANDLERS ---
    const handleUp = () => {
        if (state === 'IDLE' || state === 'PULL_MODE') {
            setState('FECHAR_MODE');
            draw('CONCLUIR ESTACAO?', 'Confirma saida', 'do barco atual?', 'SEL=Sim  DWN=Nao');
        } else if (state === 'FECHAR_MODE') {
            goIdle();
        } else if (state === 'MENU_MODE') {
            // Ciclar Menu para Cima
            if (menuIdx === 0) goIdle();
            else {
                const next = menuIdx - 1;
                setMenuIdx(next);
                draw('MENU RH / NVA:', `> ${EXTRA_MENU[next].label}`, 'Passe o Cracha...', 'UP/DWN navega');
            }
        }
    };

    const handleDown = () => {
        if (state === 'IDLE') {
            setState('MENU_MODE');
            setMenuIdx(0);
            draw('MENU RH / NVA:', `> ${EXTRA_MENU[0].label}`, 'Passe o Cracha...', 'UP/DWN navega');
        } else if (state === 'FECHAR_MODE') {
            goIdle(); // Cancela o fecho
        } else if (state === 'MENU_MODE') {
            // Ciclar Menu para Baixo
            const next = menuIdx < EXTRA_MENU.length - 1 ? menuIdx + 1 : EXTRA_MENU.length - 1;
            setMenuIdx(next);
            draw('MENU RH / NVA:', `> ${EXTRA_MENU[next].label}`, 'Passe o Cracha...', 'UP/DWN navega');
        }
    };

    const handleSelect = async () => {
        if (state === 'IDLE' || state === 'MENU_MODE') {
            // Lógica PULL (Apresentar a Próxima OP e fixar no ecrã para iniciar tarefa)
            const res = await fireApi('GET_NEXT_OP');
            if (res.success && res.op_id) {
                setState('PULL_MODE');
                setActiveOpId(res.op_id);
                draw(res.display, res.display_2, 'Aprox. Cracha', 'Iniciar Tarefa!');
            } else {
                showResponse(3000, res.display || 'SEM ORDEN', res.display_2 || '', 'Nao ha trabalho');
            }
        } else if (state === 'FECHAR_MODE') {
            if (!activeOpId) {
                showResponse(3000, 'ERRO', 'Puxe a Ordem primeiro', '(SEL) no Menu');
                return;
            }
            const res = await fireApi('FECHAR_ESTACAO', { op_id: activeOpId, operador_rfid: 'DISPOSITIVO_MESTRE' });
            showResponse(4000, 'AVANCO', res.display || '', res.display_2 || '', 'Estacao Livre!');
        }
    };

    // --- RFID BEEP HANDLER ---
    const handleSimulateRfid = async () => {
        if (!rfidInput.trim()) return;

        if (state === 'MENU_MODE') {
            const opt = EXTRA_MENU[menuIdx];
            if (opt.action === 'PONTO') {
                const res = await fireApi('PONTO', { operador_rfid: rfidInput.toUpperCase() });
                showResponse(4000, 'PONTO REGISTADO', res.display || '', res.display_2 || '');
            } else if (opt.action === 'REGISTAR_PAUSA') {
                const res = await fireApi('REGISTAR_PAUSA', { operador_rfid: rfidInput.toUpperCase(), motivo_pausa: opt.reqMotivo });
                showResponse(4000, 'AUSENCIA MARCADA', res.display || '', res.display_2 || '');
            }
        }
        else if (state === 'PULL_MODE' && activeOpId) {
            const res = await fireApi('TOGGLE_TAREFA', { op_id: activeOpId, operador_rfid: rfidInput.toUpperCase() });
            showResponse(4000, 'TEMPO DE TAREFA', res.display || '', res.display_2 || '');
        }
        else {
            showResponse(3000, 'LEITURA IGNORADA', 'Va a "Menu DWN"', 'Ou Puxe OP (SEL)');
        }

        setRfidInput('');
    };

    return (
        <section className="glass-panel p-6 flex flex-col h-full bg-slate-900 border border-slate-700">
            <h2 className="flex items-center gap-2 mb-6" style={{ fontSize: '1.2rem', color: '#c0caf5' }}>
                <Cpu size={20} /> Gêmeo Digital Hardware (ESP32)
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
                    <div className="bg-[#1e1e1ede] p-4 rounded border-4 border-slate-900 mb-8 min-h-[140px] flex flex-col shadow-inner relative overflow-hidden">
                        {/* Scanlines / Retro Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 pointer-events-none opacity-50"></div>
                        <div className="font-mono text-xs leading-5 z-20 text-[#0f0] drop-shadow-[0_0_8px_rgba(0,255,0,0.8)] whitespace-pre-wrap flex flex-col uppercase">
                            <div className="h-5">{lcd[0]}</div>
                            <div className="h-5">{lcd[1]}</div>
                            <div className="h-5">{lcd[2]}</div>
                            <div className="h-5">{lcd[3]}</div>
                        </div>
                    </div>

                    {/* Botões Físicos */}
                    <div className="flex justify-between px-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest bg-slate-900 border border-slate-700 rounded-lg py-1">Navegação</span>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleUp}
                                    disabled={state === 'BOOT' || isLoading}
                                    className="w-14 h-14 rounded-full bg-slate-700 border-b-4 border-slate-900 hover:bg-slate-600 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg disabled:opacity-50"
                                >
                                    <ChevronUp size={24} className="text-white" />
                                </button>
                                <button
                                    onClick={handleDown}
                                    disabled={state === 'BOOT' || isLoading}
                                    className="w-14 h-14 rounded-full bg-slate-700 border-b-4 border-slate-900 hover:bg-slate-600 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg disabled:opacity-50"
                                >
                                    <ChevronDown size={24} className="text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 items-center">
                            <span className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest w-full bg-slate-900 border border-slate-700 rounded-lg py-1">Confirma</span>
                            <button
                                onClick={handleSelect}
                                disabled={state === 'BOOT' || isLoading}
                                className="w-14 h-14 rounded-full bg-red-600 border-b-4 border-red-900 hover:bg-red-500 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)] disabled:opacity-50"
                            >
                                {isLoading ? <RefreshCw size={24} className="text-white animate-spin" /> : <CheckCircle2 size={24} className="text-white" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Input de Teste RFID (Manual Push) */}
                <div className="mt-8 w-full max-w-sm bg-black/30 p-4 border border-white/10 rounded-xl relative">
                    <div className="absolute -top-3 left-4 bg-[#1a1c29] px-2 text-xs font-bold text-emerald-400 tracking-widest flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> SENSOR RFID MFRC522
                    </div>
                    <div className="flex gap-2 mt-2">
                        <input
                            type="text"
                            className="form-control flex-1 text-sm font-mono tracking-widest placeholder-white/30"
                            placeholder="Tag Colaborador (Ex: TAG-RH-101)"
                            value={rfidInput}
                            onChange={(e) => setRfidInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSimulateRfid()}
                            disabled={isLoading}
                        />
                        <button
                            className="btn btn-primary px-3 rounded-lg flex items-center gap-2"
                            onClick={handleSimulateRfid}
                            disabled={!rfidInput.trim() || isLoading}
                        >
                            <Send size={16} /> BEEP
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 opacity-80 mt-3 border-t border-white/5 pt-2">
                        No mundo real este input é invisível. A passagem física do cartão emite exatamente este texto Hexadecimal.
                    </p>
                </div>
            </div>
        </section>
    );
}

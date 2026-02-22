'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, ChevronUp, ChevronDown, CheckCircle2, Send, RefreshCw, Wifi } from 'lucide-react';
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
        <section className="glass-panel p-6 flex flex-col h-full bg-slate-50 border border-slate-200">
            <h2 className="flex items-center gap-2 mb-8 text-xl font-bold text-slate-800">
                <Cpu size={22} className="text-blue-600" /> Gêmeo Digital Hardware (ESP32)
            </h2>

            <div className="flex-1 flex flex-col items-center justify-start lg:justify-center pt-8">
                {/* 
                  14x7cm Proporção Realista 
                  Usando flex-row: Painel MFRC522 à Esquerda | Painel ESP32+LCD à Direita
                */}
                <div className="bg-slate-800 p-2 sm:p-4 rounded-xl border-4 border-slate-700 shadow-2xl relative w-full max-w-2xl flex flex-col sm:flex-row gap-4 items-center">

                    {/* Parafusos de hardware */}
                    <div className="hidden sm:block absolute top-2 left-2 w-2 h-2 rounded-full bg-slate-600 shadow-inner"></div>
                    <div className="hidden sm:block absolute top-2 right-2 w-2 h-2 rounded-full bg-slate-600 shadow-inner"></div>
                    <div className="hidden sm:block absolute bottom-2 left-2 w-2 h-2 rounded-full bg-slate-600 shadow-inner"></div>
                    <div className="hidden sm:block absolute bottom-2 right-2 w-2 h-2 rounded-full bg-slate-600 shadow-inner"></div>

                    {/* --- ESQUERDA: SENSOR RFID RC522 --- */}
                    <div className="w-full sm:w-2/5 min-h-[220px] bg-blue-900/40 border-2 border-blue-500/30 rounded-lg p-4 flex flex-col relative justify-center items-center shadow-inner group overflow-hidden">
                        <div className="absolute top-2 left-2 text-[8px] font-bold text-blue-300/50">MFRC522 MODULE</div>

                        {/* Chip Graphic */}
                        <div className="w-16 h-16 border-2 border-blue-400/50 rounded flex items-center justify-center mb-6 relative z-10 bg-slate-900">
                            <Wifi className="text-blue-400" size={32} />
                        </div>
                        <div className="w-full h-1 bg-blue-500/20 absolute top-1/2 -mt-4"></div>

                        {/* Input RFID Manual (Para o Utilizador Simular a Tag) */}
                        <div className="w-full mt-4 z-10">
                            <p className="text-[10px] text-center text-blue-200 mb-2 font-semibold">APROXIME O CRACHÁ</p>
                            <input
                                type="text"
                                className="w-full bg-slate-950/80 border border-blue-500/30 rounded p-2 text-xs font-mono text-center text-emerald-400 focus:outline-none focus:border-blue-400 placeholder-slate-600 transition-colors"
                                placeholder="HEX TAG (Ex: EA7B)"
                                value={rfidInput}
                                onChange={(e) => setRfidInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSimulateRfid()}
                                disabled={isLoading}
                            />
                            <button
                                className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-colors"
                                onClick={handleSimulateRfid}
                                disabled={!rfidInput.trim() || isLoading}
                            >
                                <Send size={14} /> SIMULAR BEEP
                            </button>
                        </div>

                    </div>

                    {/* --- DIREITA: NÚCLEO ESP32 (LCD + BOTÕES) --- */}
                    <div className="w-full sm:w-3/5 bg-slate-900 border-2 border-slate-600 rounded-lg p-4 flex flex-col shadow-inner">

                        {/* Ecrã LCD 20x4 Simulado */}
                        <div className="bg-[#1e1e1ede] p-4 rounded border-4 border-slate-950 mb-6 min-h-[140px] flex flex-col shadow-inner relative overflow-hidden">
                            {/* Scanlines / Retro Effect removidos para look mais limpo legível, deixamos o verde terminal */}
                            <div className="font-mono text-sm leading-6 z-20 text-[#0f0] drop-shadow-[0_0_2px_rgba(0,255,0,0.8)] whitespace-pre-wrap flex flex-col">
                                <div className="h-6 whitespace-nowrap overflow-hidden">{(lcd[0] || '').padEnd(20, ' ')}</div>
                                <div className="h-6 whitespace-nowrap overflow-hidden">{lcd[1]}</div>
                                <div className="h-6 whitespace-nowrap overflow-hidden">{lcd[2]}</div>
                                <div className="h-6 whitespace-nowrap overflow-hidden">{lcd[3]}</div>
                            </div>
                        </div>

                        {/* Botões Direcionais Físicos */}
                        <div className="flex justify-between items-end px-2 sm:px-4">

                            {/* Bloco UP/DOWN */}
                            <div className="flex flex-col items-center gap-1.5">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Menu</span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleUp}
                                        disabled={state === 'BOOT' || isLoading}
                                        className="w-12 h-12 rounded-full bg-slate-700 border-b-4 border-slate-950 hover:bg-slate-600 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg disabled:opacity-50"
                                    >
                                        <ChevronUp size={22} className="text-white" />
                                    </button>
                                    <button
                                        onClick={handleDown}
                                        disabled={state === 'BOOT' || isLoading}
                                        className="w-12 h-12 rounded-full bg-slate-700 border-b-4 border-slate-950 hover:bg-slate-600 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg disabled:opacity-50"
                                    >
                                        <ChevronDown size={22} className="text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Bloco SELECT (Action / Confirm) */}
                            <div className="flex flex-col items-center gap-1.5">
                                <span className="text-[9px] font-bold text-rose-500/80 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-rose-900/30">Action</span>
                                <button
                                    onClick={handleSelect}
                                    disabled={state === 'BOOT' || isLoading}
                                    className="w-14 h-14 rounded-full bg-rose-600 border-b-4 border-rose-900 hover:bg-rose-500 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-[0_0_15px_rgba(225,29,72,0.4)] disabled:opacity-50"
                                >
                                    {isLoading ? <RefreshCw size={22} className="text-white animate-spin" /> : <CheckCircle2 size={24} className="text-white" />}
                                </button>
                            </div>

                        </div>
                    </div>

                </div>

                {/* Dica Didática Abaixo */}
                <p className="mt-8 text-sm text-slate-500 max-w-2xl text-center bg-white p-4 rounded-lg shadow-sm border border-slate-100 italic">
                    Isto simula a carcaça real 14x7cm. O lado Esquerdo corresponde à placa leitora RFID RC-522 colada no interior da caixa. O lado Direito mapeia a placa microcontroladora ESP32, as ligações LCD I2C e os botões Pull-Up físicos.
                </p>
            </div>
        </section>
    );
}

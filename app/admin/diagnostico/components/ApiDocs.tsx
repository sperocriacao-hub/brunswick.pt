'use client';

import React, { useState } from 'react';
import { BookOpen, Copy, Code2, ServerCog, Wifi, KeyRound } from 'lucide-react';

export function ApiDocs({ envUrl, envAnonKey }: { envUrl: string, envAnonKey: string }) {
    const [openSection, setOpenSection] = useState<string | null>('install');

    const toggle = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado para a área de transferência!');
    };

    return (
        <section className="glass-panel p-6 w-full">
            <h2 className="flex items-center gap-2 mb-6" style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>
                <BookOpen size={20} /> Manual de Configuração & API
            </h2>

            <div className="flex flex-col gap-4">
                {/* Guia de Instalação (Acordeão) */}
                <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
                    <button
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                        onClick={() => toggle('install')}
                    >
                        <span className="font-bold flex items-center gap-2 text-blue-300">
                            <Wifi size={18} /> 1. Guia de Instalação de Hardware
                        </span>
                        <ChevronIcon isOpen={openSection === 'install'} />
                    </button>
                    {openSection === 'install' && (
                        <div className="p-4 border-t border-white/10 text-sm opacity-80 leading-relaxed bg-black/40">
                            <p className="mb-2"><strong>Passo 1:</strong> Conecte o ESP32 a uma fonte 5V/2A.</p>
                            <p className="mb-2"><strong>Passo 2:</strong> Pressione &apos;Select&apos; no painel LCD por 3 segundos para ativar o modo AP (Access Point) do M.E.S.</p>
                            <p className="mb-2"><strong>Passo 3:</strong> Ligue-se ao WiFi <code>BRUNSWICK_IOT_SETUP</code> com o seu telemóvel e digite as credenciais da rede da fábrica no portal de captura.</p>
                            <p><strong>Passo 4:</strong> Inira as chaves de API Supabase (abaixo) no formulário do portal para emparelhar com a Cloud T.</p>
                        </div>
                    )}
                </div>

                {/* Chaves de API e Endpoints PostgREST */}
                <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
                    <button
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                        onClick={() => toggle('api')}
                    >
                        <span className="font-bold flex items-center gap-2 text-emerald-300">
                            <KeyRound size={18} /> 2. Chaves de Acesso Cloud (Supabase)
                        </span>
                        <ChevronIcon isOpen={openSection === 'api'} />
                    </button>
                    {openSection === 'api' && (
                        <div className="p-4 border-t border-white/10 text-sm bg-black/40 font-mono">
                            <div className="mb-4">
                                <p className="opacity-60 text-xs mb-1 uppercase tracking-widest font-sans font-bold">Base URL (PostgREST)</p>
                                <div className="flex bg-black/50 p-2 rounded border border-white/10 break-all text-blue-300">
                                    <span className="flex-1">{envUrl || 'Não Configurado'}</span>
                                    <button onClick={() => copyToClipboard(envUrl)} className="ml-2 hover:text-white"><Copy size={16} /></button>
                                </div>
                            </div>
                            <div>
                                <p className="opacity-60 text-xs mb-1 uppercase tracking-widest font-sans font-bold">Anon Key (Autorização JWT)</p>
                                <div className="flex bg-black/50 p-2 rounded border border-emerald-900/50 break-all text-emerald-300 text-xs">
                                    <span className="flex-1 leading-relaxed">{envAnonKey || 'Não Configurado'}</span>
                                    <button onClick={() => copyToClipboard(envAnonKey)} className="ml-2 hover:text-white"><Copy size={16} /></button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Spec de Payloads JSON */}
                <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
                    <button
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                        onClick={() => toggle('json')}
                    >
                        <span className="font-bold flex items-center gap-2 text-amber-300">
                            <Code2 size={18} /> 3. Formatos JSON Esperados
                        </span>
                        <ChevronIcon isOpen={openSection === 'json'} />
                    </button>
                    {openSection === 'json' && (
                        <div className="p-4 border-t border-white/10 bg-black/40 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs uppercase opacity-70 mb-2 font-bold font-sans">Payload: Heartbeat (A cada 5m)</p>
                                <pre className="bg-[#1e1e1e] text-amber-200 p-3 rounded text-xs border border-white/10 overflow-x-auto">
                                    {`POST /rest/v1/equipamentos_iot
{
  "mac_address": "AA:BB:CC...",
  "nome_dispositivo": "Box_01",
  "ip_local": "192.168.X.X",
  "versao_firmware": "v1.5.0"
}`}
                                </pre>
                            </div>
                            <div>
                                <p className="text-xs uppercase opacity-70 mb-2 font-bold font-sans">Payload: Scan RFID (Tempo Real)</p>
                                <pre className="bg-[#1e1e1e] text-blue-200 p-3 rounded text-xs border border-white/10 overflow-x-auto">
                                    {`POST /rest/v1/registos_rfid_realtime
{
  "barco_rfid": "TAGID-HEX-123",
  "estacao_id": "UUID-da-Estacao"
  // (Nota: Operador é validado via API)
}`}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Repositório SQL de Troubleshoot */}
                <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
                    <button
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                        onClick={() => toggle('sql')}
                    >
                        <span className="font-bold flex items-center gap-2 text-purple-300">
                            <ServerCog size={18} /> 4. Snippets SQL de Troubleshoot
                        </span>
                        <ChevronIcon isOpen={openSection === 'sql'} />
                    </button>
                    {openSection === 'sql' && (
                        <div className="p-4 border-t border-white/10 text-sm bg-black/40">
                            <p className="mb-2 text-xs opacity-70 font-sans">Queries rápidas para rodar no Supabase SQL Editor em caso de emergência ou hard reset de dispositivos de fábrica.</p>

                            <div className="bg-[#1e1e1e] p-3 rounded border border-white/10 font-mono text-purple-200 text-xs mb-3 relative">
                                <div className="opacity-50 mb-1">-- Resetar Heartbeat Falso de uma Máquina Presa</div>
                                <div>UPDATE equipamentos_iot SET ultimo_heartbeat = NOW() WHERE mac_address = &apos;BA:AD:FO:OD:00&apos;;</div>
                                <button onClick={() => copyToClipboard("UPDATE equipamentos_iot SET ultimo_heartbeat = NOW() WHERE mac_address = 'BA:AD:FO:OD:00';")} className="absolute top-2 right-2 hover:text-white"><Copy size={16} /></button>
                            </div>

                            <div className="bg-[#1e1e1e] p-3 rounded border border-white/10 font-mono text-purple-200 text-xs relative">
                                <div className="opacity-50 mb-1">-- Limpar Consola de Logs com mais de 7 dias</div>
                                <div>DELETE FROM logs_comunicacao_iot WHERE created_at &lt; NOW() - INTERVAL &apos;7 days&apos;;</div>
                                <button onClick={() => copyToClipboard("DELETE FROM logs_comunicacao_iot WHERE created_at < NOW() - INTERVAL '7 days';")} className="absolute top-2 right-2 hover:text-white"><Copy size={16} /></button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </section>
    );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
    return (
        <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-200 opacity-50 ${isOpen ? 'rotate-180' : ''}`}
        >
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    );
}

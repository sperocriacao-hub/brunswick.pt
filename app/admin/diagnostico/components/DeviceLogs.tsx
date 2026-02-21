'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Copy, Check, Filter } from 'lucide-react';
import { fetchIoTLogs } from '../actions';

type IoTLog = {
    id: string;
    mac_address: string;
    tipo_evento: string;
    payload_recebido: Record<string, unknown>;
    mensagem_resposta: string;
    status_codigo: number;
    created_at: string;
};

export function DeviceLogs() {
    const [logs, setLogs] = useState<IoTLog[]>([]);
    const [macFilter, setMacFilter] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const loadLogs = async () => {
        const res = await fetchIoTLogs(macFilter || undefined);
        if (res.success && res.logs) {
            setLogs(res.logs.reverse()); // Bottom to top
            if (!macFilter) setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    useEffect(() => {
        loadLogs();
        const interval = setInterval(loadLogs, 15000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [macFilter]);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <section className="glass-panel p-6 flex flex-col h-full bg-black border-2 border-[#333] relative overflow-hidden group">
            <h2 className="flex items-center gap-2 mb-4 text-[#ff9e64] text-lg font-mono font-bold tracking-widest border-b border-[#333] pb-4">
                <Terminal size={20} /> Consola de Logs (Live Debug)
            </h2>

            <div className="flex gap-4 mb-4 items-center">
                <Filter size={16} className="text-[#a9b1d6]" />
                <input
                    type="text"
                    placeholder="Filtrar por MAC Address (Ex: AA:BB:CC)"
                    value={macFilter}
                    onChange={(e) => setMacFilter(e.target.value)}
                    className="bg-[#1a1b26] border border-[#ff9e64]/30 text-[#a9b1d6] font-mono text-sm px-3 py-1 w-64 focus:outline-none focus:border-[#ff9e64] rounded"
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-sm leading-relaxed p-4 bg-[#1a1b26] rounded shadow-inner">
                {logs.length === 0 ? (
                    <div className="text-[#565f89] text-center mt-10">Agardando Pings dos ESP32...</div>
                ) : (
                    logs.map((log) => {
                        const isError = log.status_codigo >= 400;
                        return (
                            <div key={log.id} className="mb-4 border-b border-[#24283b] pb-4 last:border-0 hover:bg-[#24283b]/50 p-2 rounded -mx-2 transition-colors relative">
                                <span className="text-[#565f89] mr-3">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                                <span className="text-[#bb9af7] font-bold mr-3">{log.mac_address}</span>
                                <span className={`font-bold mr-4 ${log.tipo_evento === 'HEARTBEAT' ? 'text-[#7dcfff]' : 'text-[#f7768e]'}`}>
                                    {log.tipo_evento}
                                </span>
                                <span className={`${isError ? 'text-[#f7768e]' : 'text-[#9ece6a]'} font-bold`}>
                                    Status {log.status_codigo}
                                </span>

                                <div className="mt-2 text-[#a9b1d6] pl-20 break-all bg-[#0f0f14] p-2 rounded border border-[#292e42] relative">
                                    <pre className="text-xs overflow-x-auto custom-scrollbar">
                                        {'-> '} {JSON.stringify(log.payload_recebido)}
                                    </pre>
                                    <div className={`mt-1 text-xs font-bold ${isError ? 'text-[#f7768e]' : 'text-[#9ece6a]'}`}>
                                        {'<- '} {log.mensagem_resposta}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(JSON.stringify(log.payload_recebido, null, 2), log.id)}
                                        className="absolute top-2 right-2 text-[#565f89] hover:text-[#ff9e64] transition-colors"
                                        title="Copiar JSON Payload"
                                    >
                                        {copiedId === log.id ? <Check size={14} className="text-[#9ece6a]" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={logsEndRef} />
            </div>
            {/* Scanline Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-[0.15]"></div>
        </section>
    );
}

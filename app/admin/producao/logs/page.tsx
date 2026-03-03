"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Search, DatabaseZap, Clock, WifiOff, FileTerminal } from 'lucide-react';

type RawLog = {
    id: string;
    rfid_operador: string;
    id_estacao: string | null;
    id_ordem_producao: string | null;
    tipo_evento: string;
    payload_original: any;
    data_hora_evento: string;
    foi_processado: boolean;
    erro_processamento: string | null;
};

export default function TelemetryLogsPage() {
    const supabase = createClient();
    const [logs, setLogs] = useState<RawLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
    const [searchFilter, setSearchFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, SUCCESS, ERROR

    const carregarLogs = async () => {
        setIsLoading(true);
        const startDate = `${dateFilter}T00:00:00Z`;
        const endDate = `${dateFilter}T23:59:59Z`;

        let query = supabase
            .from('registos_rfid_realtime')
            .select('*')
            .gte('data_hora_evento', startDate)
            .lte('data_hora_evento', endDate)
            .order('data_hora_evento', { ascending: false })
            .limit(1000); // safety cap

        if (statusFilter === 'SUCCESS') query = query.eq('foi_processado', true);
        if (statusFilter === 'ERROR') query = query.eq('foi_processado', false);

        const { data, error } = await query;
        if (data) setLogs(data);
        setIsLoading(false);
    };

    useEffect(() => {
        carregarLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateFilter, statusFilter]);

    const logsFiltrados = logs.filter(l => {
        const term = searchFilter.toLowerCase();
        const rfid = l.rfid_operador?.toLowerCase() || '';
        const tipo = l.tipo_evento?.toLowerCase() || '';
        const op = l.id_ordem_producao?.toLowerCase() || '';
        const est = l.id_estacao?.toLowerCase() || '';
        const erro = l.erro_processamento?.toLowerCase() || '';

        return rfid.includes(term) || tipo.includes(term) || op.includes(term) || est.includes(term) || erro.includes(term);
    });

    return (
        <div className="p-8 max-w-[95rem] mx-auto animate-in fade-in duration-500 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <DatabaseZap className="text-blue-600" size={32} /> Auditoria Telemetria M.E.S.
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Log Bruto de todas as picagens (Edge / IoT / Tablets) e resultados do motor de OEE/Routing.
                    </p>
                </div>
            </header>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FileTerminal size={20} className="text-slate-500" />
                        <span className="font-bold text-slate-700">Painel de Eventos RAW</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-md text-sm font-bold text-slate-700 bg-white"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-md text-sm font-bold text-slate-700 bg-white"
                        >
                            <option value="ALL">Todos os Eventos</option>
                            <option value="SUCCESS">Sucesso (Tratados)</option>
                            <option value="ERROR">Falhas (Rejeitados/Erros)</option>
                        </select>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Busca Universal (RFID, OP, Estação, Erro)..."
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                className="pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm w-72 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center p-12 text-slate-400"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold">
                                <tr>
                                    <th className="px-6 py-4">Data/Hora TS</th>
                                    <th className="px-6 py-4">Status Motor</th>
                                    <th className="px-6 py-4">Evento Requisitado</th>
                                    <th className="px-6 py-4">Identidade (RFID)</th>
                                    <th className="px-6 py-4">Contexto (Estação / OP)</th>
                                    <th className="px-6 py-4">Payload (Admin)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logsFiltrados.length === 0 && (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium text-base">Nenhuma transmissão listada face aos filtros.</td></tr>
                                )}
                                {logsFiltrados.map((log) => {
                                    const d = new Date(log.data_hora_evento);
                                    const timeStr = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + d.getMilliseconds().toString().padStart(3, '0');

                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-slate-600 font-bold">{timeStr}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-1" title={log.id}>ID: {log.id.split('-')[0]}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.foi_processado ? (
                                                    <span className="inline-flex px-2 py-1 rounded bg-green-50 border border-green-200 text-green-700 text-[10px] font-black tracking-widest uppercase">
                                                        200 OK
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className="inline-flex px-2 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black tracking-widest uppercase">
                                                            REJEITADO
                                                        </span>
                                                        <span className="text-[10px] text-rose-600 font-medium max-w-[200px] truncate" title={log.erro_processamento || 'Desconhecido'}>
                                                            {log.erro_processamento}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 border border-slate-200 rounded text-xs">{log.tipo_evento}</span>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-blue-600">
                                                {log.rfid_operador}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-400 uppercase text-[10px] font-bold w-6">EST:</span>
                                                        <span className="font-medium text-slate-700">{log.id_estacao || '-- N/A --'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-400 uppercase text-[10px] font-bold w-6">OP:</span>
                                                        <span className="font-mono text-slate-700">{log.id_ordem_producao || '-- N/A --'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <details className="cursor-pointer">
                                                    <summary className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800">Ver JSON</summary>
                                                    <pre className="mt-2 p-3 bg-slate-900 text-green-400 text-[10px] font-mono rounded overflow-x-auto max-w-xs shadow-inner">
                                                        {JSON.stringify(log.payload_original, null, 2)}
                                                    </pre>
                                                </details>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

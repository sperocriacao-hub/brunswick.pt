"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Plus, Edit2, Trash2, Search, Clock, ShieldAlert, ArrowRight, X, User } from 'lucide-react';

type LogInfo = {
    id: string;
    operador_rfid: string;
    estacao_id: string | null;
    tipo_registo: string;
    timestamp: string;
    // joined
    operadores?: { nome_operador: string, numero_operador: string } | null;
    estacoes?: { nome_estacao: string } | null;
};

export default function AssiduidadeLogViewer() {
    const supabase = createClient();
    const [logs, setLogs] = useState<LogInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
    const [searchFilter, setSearchFilter] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editLogId, setEditLogId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        operador_rfid: '', // can be RFID or ID depending on how we handle lookup, we'll use raw RFID for direct DB insert
        tipo_registo: 'ENTRADA_TURNO',
        timestamp: new Date().toISOString().slice(0, 16) // "YYYY-MM-DDThh:mm"
    });

    const [allOperators, setAllOperators] = useState<{ tag_rfid_operador: string, nome_operador: string }[]>([]);

    const carregarLogs = async () => {
        setIsLoading(true);
        const startDate = `${dateFilter}T00:00:00Z`;
        const endDate = `${dateFilter}T23:59:59Z`;

        const [{ data, error }, { data: opsData }] = await Promise.all([
            supabase
                .from('log_ponto_diario')
                .select(`
                    id, operador_rfid, estacao_id, tipo_registo, timestamp,
                    operadores:operador_rfid (nome_operador, numero_operador),
                    estacoes (nome_estacao)
                `)
                .gte('timestamp', startDate)
                .lte('timestamp', endDate)
                .order('timestamp', { ascending: false }),
            supabase.from('operadores').select('tag_rfid_operador, nome_operador').eq('status', 'Ativo').order('nome_operador')
        ]);

        if (data) setLogs(data as any);
        if (opsData) setAllOperators(opsData);
        setIsLoading(false);
    };

    useEffect(() => {
        carregarLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateFilter]);

    const apagarLog = async (id: string) => {
        if (!confirm('Deseja mesmo apagar este registo de ponto? Pode afetar o OEE.')) return;

        setIsLoading(true);
        await supabase.from('log_ponto_diario').delete().eq('id', id);
        carregarLogs();
    };

    const handleSaveManualLog = async () => {
        if (!formData.operador_rfid) return alert('Selecione um Operador.');

        setIsSaving(true);
        // Ensure accurate UTC timestamp matching the local visual input
        const localDate = new Date(formData.timestamp);
        const utcIso = localDate.toISOString();

        const { error } = editLogId
            ? await supabase.from('log_ponto_diario').update({
                operador_rfid: formData.operador_rfid,
                tipo_registo: formData.tipo_registo,
                timestamp: utcIso
            }).eq('id', editLogId)
            : await supabase.from('log_ponto_diario').insert([{
                operador_rfid: formData.operador_rfid,
                tipo_registo: formData.tipo_registo,
                timestamp: utcIso,
                estacao_id: null
            }]);

        setIsSaving(false);
        if (error) {
            alert('Erro a guardar:' + error.message);
        } else {
            setIsModalOpen(false);
            carregarLogs();
        }
    };

    const logsFiltrados = logs.filter(l => {
        const term = searchFilter.toLowerCase();
        const nome = l.operadores?.nome_operador?.toLowerCase() || '';
        const num = l.operadores?.numero_operador?.toLowerCase() || '';
        const rfid = l.operador_rfid?.toLowerCase() || '';
        return nome.includes(term) || num.includes(term) || rfid.includes(term);
    });

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm mt-8 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                        <Clock className="text-blue-500" size={20} /> Histórico de Pontos / Picagens
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Controlo M.E.S Administrativo de Correção de Ponto e Pausas.</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-md text-sm font-bold text-slate-700 bg-white"
                    />
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Buscar Operador..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            className="pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md font-bold text-sm flex items-center gap-2 transition-colors ml-2"
                        onClick={() => {
                            setFormData({
                                operador_rfid: '',
                                tipo_registo: 'ENTRADA_TURNO',
                                timestamp: new Date().toLocaleTimeString('sv-SE').substring(0, 16).replace(' ', 'T') || new Date().toISOString().slice(0, 16)
                            });
                            setIsModalOpen(true);
                        }}
                    >
                        <Plus size={16} /> Lançamento Manual
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center p-12 text-slate-400"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                            <tr>
                                <th className="px-6 py-4">Data/Hora</th>
                                <th className="px-6 py-4">Operador</th>
                                <th className="px-6 py-4">Tipo de Movimento</th>
                                <th className="px-6 py-4">Origem / Posto</th>
                                <th className="px-6 py-4 text-right">Ações Analista</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logsFiltrados.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">Nenhum registo encontrado nesta data.</td></tr>
                            )}
                            {logsFiltrados.map((log) => {
                                const d = new Date(log.timestamp);
                                const timeStr = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                                const isEntrada = log.tipo_registo.includes('ENTRADA');
                                const isSaida = log.tipo_registo.includes('SAÍDA') || log.tipo_registo.includes('SAIDA');
                                const badgeColor = isEntrada ? 'bg-green-100 text-green-700 border-green-200' : isSaida ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-700 border-slate-200';

                                return (
                                    <tr key={log.id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-6 py-3 font-mono text-slate-600 font-bold">{timeStr}</td>
                                        <td className="px-6 py-3">
                                            <div className="font-bold text-slate-800">{log.operadores?.nome_operador || 'Desconhecido'}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">RFID: {log.operador_rfid}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-extrabold tracking-wider border uppercase shadow-sm ${badgeColor}`}>
                                                {log.tipo_registo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-slate-600 font-medium">
                                            {log.estacoes?.nome_estacao || '---'}
                                        </td>
                                        <td className="px-6 py-3 text-right flex justify-end gap-2">
                                            <button
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                title="Editar Registo"
                                                onClick={() => {
                                                    const logLocalTime = new Date(log.timestamp).toLocaleTimeString('sv-SE').substring(0, 16).replace(' ', 'T') || log.timestamp.substring(0, 16);
                                                    setEditLogId(log.id);
                                                    setFormData({
                                                        operador_rfid: log.operador_rfid,
                                                        tipo_registo: log.tipo_registo,
                                                        timestamp: logLocalTime
                                                    });
                                                    setIsModalOpen(true);
                                                }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                title="Apagar Registo (Admin Override)"
                                                onClick={() => apagarLog(log.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL LANÇAMENTO MANUAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Clock size={18} className="text-blue-500" />
                                {editLogId ? 'Editar Registo de Ponto' : 'Adicionar Ponto Manualmente'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50/50 border-l-4 border-blue-400 p-3 rounded-r flex gap-3 text-sm text-blue-800 mb-4">
                                <ShieldAlert size={20} className="text-blue-500 shrink-0" />
                                <p>
                                    {editLogId
                                        ? 'A alterar um registo já consolidado. O sistema assumirá este novo timestamp para efeitos de produtividade (OEE).'
                                        : 'Este registo será injetado no sistema M.E.S e pode alterar retroativamente as métricas de OEE se for um "Fim de Turno".'
                                    }
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Operador</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium"
                                    value={formData.operador_rfid}
                                    onChange={(e) => setFormData({ ...formData, operador_rfid: e.target.value })}
                                >
                                    <option value="" disabled>Selecione um colaborador...</option>
                                    {allOperators.map(op => (
                                        <option key={op.tag_rfid_operador} value={op.tag_rfid_operador}>
                                            {op.nome_operador} (RFID: {op.tag_rfid_operador})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Movimento</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-bold"
                                        value={formData.tipo_registo}
                                        onChange={(e) => setFormData({ ...formData, tipo_registo: e.target.value })}
                                    >
                                        <option value="ENTRADA_TURNO">ENTRADA (Turno)</option>
                                        <option value="SAIDA_TURNO">SAÍDA (Fim Turno)</option>
                                        <option value="ENTRADA_PAUSA">IDA P/ PAUSA</option>
                                        <option value="SAIDA_PAUSA">REGRESSO PAUSA</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data e Hora Efetiva</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-mono text-sm"
                                        value={formData.timestamp}
                                        onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancelar</button>
                            <button onClick={handleSaveManualLog} disabled={isSaving || !formData.operador_rfid} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-md shadow-sm transition-colors flex items-center gap-2">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : (editLogId ? <Edit2 size={16} /> : <Plus size={16} />)}
                                {editLogId ? 'Guardar Alterações' : 'Injetar Registo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

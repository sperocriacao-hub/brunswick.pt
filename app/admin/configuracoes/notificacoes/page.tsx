'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Plus, Edit2, Trash2, CheckCircle2, XCircle, Mail, MessageSquare, Globe, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import {
    fetchRegrasNotificacao,
    fetchLogsNotificacao,
    saveRegraNotificacao,
    deleteRegraNotificacao,
    NotificacaoRegra,
    LogNotificacao
} from './actions';

export default function NotificacoesPage() {
    const [regras, setRegras] = useState<NotificacaoRegra[]>([]);
    const [logs, setLogs] = useState<LogNotificacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'REGRAS' | 'HISTORICO'>('REGRAS');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRegra, setEditingRegra] = useState<Partial<NotificacaoRegra> | null>(null);

    // Form inputs
    const [destinatarioInput, setDestinatarioInput] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [regrasRes, logsRes] = await Promise.all([
            fetchRegrasNotificacao(),
            fetchLogsNotificacao()
        ]);

        if (regrasRes.success && regrasRes.regras) setRegras(regrasRes.regras);
        if (logsRes.success && logsRes.logs) setLogs(logsRes.logs);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRegra) return;

        const res = await saveRegraNotificacao(editingRegra);
        if (res.success) {
            alert('Regra Guardada!');
            setIsModalOpen(false);
            setEditingRegra(null);
            loadData();
        } else {
            alert('Erro: ' + res.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminar esta regra definitivamente?')) return;
        const res = await deleteRegraNotificacao(id);
        if (res.success) loadData();
        else alert('Erro: ' + res.error);
    };

    const openModal = (regra?: NotificacaoRegra) => {
        if (regra) {
            setEditingRegra({ ...regra });
        } else {
            setEditingRegra({
                nome_regra: '',
                tipo_canal: 'EMAIL',
                evento_gatilho: 'OP_COMPLETED',
                template_mensagem: '',
                destinatarios_array: [],
                ativo: true
            });
        }
        setDestinatarioInput('');
        setIsModalOpen(true);
    };

    const handleAddDestinatario = () => {
        if (!destinatarioInput.trim() || !editingRegra) return;
        const currentArr = editingRegra.destinatarios_array || [];
        setEditingRegra({ ...editingRegra, destinatarios_array: [...currentArr, destinatarioInput.trim()] });
        setDestinatarioInput('');
    };

    const handleRemoveDestinatario = (index: number) => {
        if (!editingRegra) return;
        const currentArr = editingRegra.destinatarios_array || [];
        const newArr = [...currentArr];
        newArr.splice(index, 1);
        setEditingRegra({ ...editingRegra, destinatarios_array: newArr });
    };

    const getCanalIcon = (tipo: string) => {
        switch (tipo) {
            case 'EMAIL': return <Mail size={16} className="text-blue-400" />;
            case 'SMS': return <MessageSquare size={16} className="text-emerald-400" />;
            case 'WEBHOOK': return <Globe size={16} className="text-purple-400" />;
            default: return <Bell size={16} />;
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-6xl animate-fade-in relative z-20 dashboard-layout">

            <Link href="/admin/configuracoes" className="text-blue-500 hover:text-blue-400 font-medium mb-6 inline-flex items-center gap-2">
                <ArrowLeft size={16} /> Voltar a Definições
            </Link>

            <div className="flex flex-col items-start mb-8 text-left border-b border-white/10 pb-6">
                <h1 className="brand-title flex items-center gap-3" style={{ fontSize: '2rem', margin: 0 }}>
                    <Bell size={32} color="var(--primary)" /> Motor de Notificações
                </h1>
                <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>E-mails Automáticos, SMS e Alertas Webhooks ativados por Eventos do Chão de Fábrica.</p>
            </div>

            <div className="flex gap-4 border-b border-white/10 mb-6">
                <button
                    onClick={() => setActiveTab('REGRAS')}
                    className={`pb-3 px-4 font-bold border-b-2 transition-colors ${activeTab === 'REGRAS' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                >
                    Regras & Gatilhos Ativos
                </button>
                <button
                    onClick={() => setActiveTab('HISTORICO')}
                    className={`pb-3 px-4 font-bold border-b-2 transition-colors ${activeTab === 'HISTORICO' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                >
                    Auditoria Diária (Logs)
                </button>
            </div>

            {loading ? (
                <div className="text-center p-12 text-slate-500">A carregar motor...</div>
            ) : activeTab === 'REGRAS' ? (
                <section className="animate-fade-in">
                    <div className="flex justify-end mb-4">
                        <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
                            <Plus size={18} /> Nova Regra
                        </button>
                    </div>

                    <div className="glass-panel overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5">
                                    <th className="p-4 border-b border-white/10 text-sm font-semibold opacity-70">Nome da Regra</th>
                                    <th className="p-4 border-b border-white/10 text-sm font-semibold opacity-70">Gatilho Ocorrência</th>
                                    <th className="p-4 border-b border-white/10 text-sm font-semibold opacity-70">Canal</th>
                                    <th className="p-4 border-b border-white/10 text-sm font-semibold opacity-70">Destinatários</th>
                                    <th className="p-4 border-b border-white/10 text-sm font-semibold opacity-70">Estado</th>
                                    <th className="p-4 border-b border-white/10 text-sm font-semibold opacity-70 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {regras.map(regra => (
                                    <tr key={regra.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-bold text-sm text-blue-100">{regra.nome_regra}</td>
                                        <td className="p-4">
                                            <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs border border-slate-700 font-mono">
                                                {regra.evento_gatilho}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-semibold flex items-center gap-2 mt-1">
                                            {getCanalIcon(regra.tipo_canal)} {regra.tipo_canal}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {regra.destinatarios_array.map((d, i) => (
                                                    <span key={i} className="text-xs bg-blue-900/40 text-blue-200 border border-blue-800/50 px-2 py-1 rounded-full truncate max-w-[120px]" title={d}>
                                                        {d}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {regra.ativo ? (
                                                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1"><CheckCircle2 size={14} /> ONLINE</span>
                                            ) : (
                                                <span className="text-slate-500 font-bold text-xs flex items-center gap-1"><XCircle size={14} /> PAUSADO</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => openModal(regra)} className="text-blue-400 hover:text-blue-300 p-2"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(regra.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {regras.length === 0 && (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">Sem regras criadas.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : (
                <section className="animate-fade-in animate-delay-1">
                    <div className="glass-panel overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5">
                                    <th className="p-4 border-b border-white/10 text-sm font-semibold opacity-70">Carimbo de Tempo</th>
                                    <th className="p-4 border-b border-white/10 text-sm font-semibold opacity-70">Regra Associada</th>
                                    <th className="p-4 border-b border-white/10 text-sm font-semibold opacity-70">Destino (Target)</th>
                                    <th className="p-4 border-b border-white/10 text-sm font-semibold opacity-70">Sucesso</th>
                                    <th className="p-4 border-b border-white/10 text-sm font-semibold opacity-70 max-w-[300px]">Logs Adicionais</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-xs font-mono text-slate-400">{new Date(log.data_envio).toLocaleString()}</td>
                                        <td className="p-4 text-sm text-blue-200">
                                            {log.regra?.nome_regra || <span className="text-slate-500 italic">Regra Eliminada</span>}
                                            <div className="text-[10px] text-slate-500 mt-1">{log.canal_usado}</div>
                                        </td>
                                        <td className="p-4 text-sm font-mono text-slate-300">{log.destinatario}</td>
                                        <td className="p-4">
                                            {log.status_envio === 'SUCCESS' ? (
                                                <span className="text-emerald-400 font-bold text-xs bg-emerald-900/40 px-2 py-1 rounded">ENTREGUE</span>
                                            ) : (
                                                <span className="text-red-400 font-bold text-xs bg-red-900/40 px-2 py-1 rounded">FALHA</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-red-300 max-w-[300px] truncate" title={log.erro_detalhe || ''}>
                                            {log.erro_detalhe || '-'}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhum alerta engatilhado até o momento.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* MODAL EDIÇÃO */}
            {isModalOpen && editingRegra && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" style={{ backdropFilter: 'blur(5px)' }}>
                    <div className="glass-panel max-w-2xl w-full p-8 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white p-2">✕</button>

                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                            {editingRegra.id ? <Edit2 size={24} className="text-blue-400" /> : <Plus size={24} className="text-blue-400" />}
                            {editingRegra.id ? 'Editar Regra Existente' : 'Criador de Template de Alerta'}
                        </h2>

                        <form onSubmit={handleSave} className="flex flex-col gap-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold opacity-70 mb-2 uppercase tracking-widest text-[#a9b1d6]">Identificador / Descrição</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        value={editingRegra.nome_regra || ''}
                                        onChange={e => setEditingRegra({ ...editingRegra, nome_regra: e.target.value })}
                                        placeholder="Ex: Falha Diária ESP32"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold opacity-70 mb-2 uppercase tracking-widest text-[#a9b1d6]">Gatilho Sistémico</label>
                                        <select
                                            className="form-control font-mono text-sm uppercase"
                                            required
                                            value={editingRegra.evento_gatilho || ''}
                                            onChange={e => setEditingRegra({ ...editingRegra, evento_gatilho: e.target.value })}
                                        >
                                            <option value="HEARTBEAT_LOSS">Corte Coneção IoT (Heartbeat Loss)</option>
                                            <option value="OP_COMPLETED">Fim da Ordem Produção (Saída)</option>
                                            <option value="NEW_EVALUATION">Nova Avaliação RH Abaixo Média</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold opacity-70 mb-2 uppercase tracking-widest text-[#a9b1d6]">Estado</label>
                                        <label className="flex items-center gap-2 mt-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editingRegra.ativo ?? true}
                                                onChange={e => setEditingRegra({ ...editingRegra, ativo: e.target.checked })}
                                                className="w-5 h-5 accent-emerald-500"
                                            />
                                            <span className="font-bold">Regra Online</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-white/10 my-2" />

                            <div>
                                <label className="block text-sm font-bold opacity-70 mb-2 uppercase tracking-widest text-[#a9b1d6]">Canal de Entrega</label>
                                <div className="flex gap-4">
                                    {['EMAIL', 'SMS', 'WEBHOOK'].map((tipo) => (
                                        <button
                                            key={tipo}
                                            type="button"
                                            onClick={() => setEditingRegra({ ...editingRegra, tipo_canal: tipo as 'EMAIL' | 'SMS' | 'WEBHOOK' })}
                                            className={`flex-1 py-3 px-4 border rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${editingRegra.tipo_canal === tipo
                                                ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                                : 'bg-black/30 border-white/10 text-slate-400 hover:bg-black/50'
                                                }`}
                                        >
                                            {getCanalIcon(tipo)} {tipo}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold opacity-70 mb-2 uppercase tracking-widest text-[#a9b1d6] flex justify-between">
                                    Destinatários
                                    <span className="text-[10px] lowercase normal-case opacity-50 font-normal">Pressione &apos;Enter&apos; para inserir</span>
                                </label>
                                <div className="bg-black/30 p-2 border border-white/10 rounded-xl min-h-[50px] flex gap-2 flex-wrap items-center focus-within:border-blue-500/50">
                                    {(editingRegra.destinatarios_array || []).map((dest, i) => (
                                        <span key={i} className="bg-blue-900/50 text-blue-200 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-blue-800/50">
                                            {dest}
                                            <button type="button" onClick={() => handleRemoveDestinatario(i)} className="hover:text-amber-400 font-bold">×</button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        className="bg-transparent border-none outline-none text-sm text-white flex-1 min-w-[150px] px-2 py-1 placeholder-white/20"
                                        placeholder={editingRegra.tipo_canal === 'EMAIL' ? 'Ex: dir@fabrica.pt' : (editingRegra.tipo_canal === 'SMS' ? 'Ex: +351910000000' : 'https://api.slack/webhook')}
                                        value={destinatarioInput}
                                        onChange={e => setDestinatarioInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddDestinatario(); } }}
                                        onBlur={handleAddDestinatario}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold opacity-70 mb-2 uppercase tracking-widest text-[#a9b1d6]">
                                    Mensagem Bruta / Body Payload
                                </label>
                                <p className="text-xs text-amber-500/80 mb-2 bg-amber-900/20 p-2 rounded border border-amber-900/30">
                                    <strong>Suporta Interpolação:</strong> Escreva <code>{`{{nome_dispositivo}}`}</code> para ser substituido automaticamente pelo motor dinâmico aquando do alerta.
                                </p>
                                <textarea
                                    className="form-control"
                                    rows={4}
                                    required
                                    placeholder="Ex: A Máquina {{nome_dispositivo}} encontra-se offline..."
                                    value={editingRegra.template_mensagem || ''}
                                    onChange={e => setEditingRegra({ ...editingRegra, template_mensagem: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancelar</button>
                                <button type="submit" className="btn btn-primary flex items-center gap-2">
                                    <Send size={18} /> Salvar Automação
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

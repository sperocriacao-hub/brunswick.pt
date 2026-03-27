'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Plus, Edit2, Trash2, CheckCircle2, XCircle, Mail, MessageSquare, Globe, ArrowLeft, Send, Lightbulb } from 'lucide-react';
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
            alert('Regra Guardada com sucesso!');
            setIsModalOpen(false);
            setEditingRegra(null);
            loadData();
        } else {
            alert('Erro: ' + res.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem a certeza que deseja eliminar esta regra definitivamente?')) return;
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
            case 'EMAIL': return <Mail size={16} className="text-blue-600" />;
            case 'SMS': return <MessageSquare size={16} className="text-emerald-600" />;
            case 'WEBHOOK': return <Globe size={16} className="text-purple-600" />;
            default: return <Bell size={16} />;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">

            <div className="mb-4">
                <Link href="/admin/configuracoes" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-2">
                    <ArrowLeft size={16} /> Voltar a Definições Globais
                </Link>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <Bell className="text-blue-600" size={32} />
                        Motor de Notificações
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Configure e-mails automáticos, SMS e Webhooks ativados por eventos do chão de fábrica.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200 bg-slate-50/50">
                    <button
                        onClick={() => setActiveTab('REGRAS')}
                        className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'REGRAS' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                    >
                        Regras & Gatilhos Ativos
                    </button>
                    <button
                        onClick={() => setActiveTab('HISTORICO')}
                        className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'HISTORICO' ? 'border-amber-500 text-amber-700 bg-amber-50/50' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                    >
                        Auditoria Diária (Logs)
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="text-slate-500 text-sm font-medium flex items-center gap-2">
                                <span className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></span>
                                A carregar motor...
                            </div>
                        </div>
                    ) : activeTab === 'REGRAS' ? (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => openModal()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors shadow-sm"
                                >
                                    <Plus size={18} /> Nova Regra
                                </button>
                            </div>

                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Nome da Regra</th>
                                            <th className="px-4 py-3 font-semibold">Gatilho (Ocorrência)</th>
                                            <th className="px-4 py-3 font-semibold">Canal</th>
                                            <th className="px-4 py-3 font-semibold">Destinatários</th>
                                            <th className="px-4 py-3 font-semibold">Estado</th>
                                            <th className="px-4 py-3 font-semibold text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {regras.map(regra => (
                                            <tr key={regra.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-slate-900">{regra.nome_regra}</td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                                        {regra.evento_gatilho}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-700 flex items-center gap-2 mt-0.5">
                                                    {getCanalIcon(regra.tipo_canal)}
                                                    {regra.tipo_canal}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {regra.destinatarios_array.map((d, i) => (
                                                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-[150px]" title={d}>
                                                                {d}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {regra.ativo ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs">
                                                            <CheckCircle2 size={14} /> Ativo
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-xs">
                                                            <XCircle size={14} /> Pausado
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right space-x-2">
                                                    <button onClick={() => openModal(regra)} className="text-slate-400 hover:text-blue-600 transition-colors p-1">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(regra.id)} className="text-slate-400 hover:text-red-600 transition-colors p-1">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {regras.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center text-slate-500 bg-slate-50/50">
                                                    Nenhuma regra de notificação configurada.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Data/Hora Envio</th>
                                            <th className="px-4 py-3 font-semibold">Regra Disparada</th>
                                            <th className="px-4 py-3 font-semibold">Destino (Target)</th>
                                            <th className="px-4 py-3 font-semibold">Estado Envio</th>
                                            <th className="px-4 py-3 font-semibold">Detalhes/Erro</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {logs.map(log => (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                                                    {new Date(log.data_envio).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-slate-900 font-medium">
                                                    {log.regra?.nome_regra || <span className="text-slate-400 italic">Regra Eliminada</span>}
                                                    <div className="text-[10px] text-slate-500 mt-0.5 bg-slate-100 inline-block px-1.5 rounded border border-slate-200">
                                                        {log.canal_usado}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 font-mono">
                                                    {log.destinatario}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {log.status_envio === 'SUCCESS' ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Entregue
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                            Falha
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-500 max-w-[250px] truncate" title={log.erro_detalhe || ''}>
                                                    {log.erro_detalhe ? (
                                                        <span className="text-red-500">{log.erro_detalhe}</span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {logs.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-12 text-center text-slate-500 bg-slate-50/50">
                                                    Nenhum alerta engatilhado até o momento.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL EDIÇÃO */}
            {isModalOpen && editingRegra && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                {editingRegra.id ? <Edit2 className="text-blue-600" size={20} /> : <Plus className="text-blue-600" size={20} />}
                                {editingRegra.id ? 'Editar Regra de Automação' : 'Nova Automação de Alerta'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto NASA-scrollbar">
                            <form id="regra-form" onSubmit={handleSave} className="space-y-6">

                                {/* Header Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Nome identificativo</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900"
                                            required
                                            value={editingRegra.nome_regra || ''}
                                            onChange={e => setEditingRegra({ ...editingRegra, nome_regra: e.target.value })}
                                            placeholder="Ex: Alerta Global de Andon"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Evento de Disparo (Gatilho)</label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900 bg-white"
                                            required
                                            value={editingRegra.evento_gatilho || ''}
                                            onChange={e => setEditingRegra({ ...editingRegra, evento_gatilho: e.target.value })}
                                        >
                                            <option value="HEARTBEAT_LOSS">Corte Conexão IoT (Heartbeat Loss)</option>
                                            <option value="OP_COMPLETED">Fim da Ordem Produção (Saída)</option>
                                            <option value="NEW_EVALUATION">Nova Avaliação RH Abaixo Média</option>
                                            <option value="ANDON_TRIGGER">Paragem de Linha Andon (Tablet)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={editingRegra.ativo ?? true}
                                                onChange={e => setEditingRegra({ ...editingRegra, ativo: e.target.checked })}
                                                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">Ativação da Regra</span>
                                            <span className="text-xs text-slate-500">Se desmarcado, o motor irá ignorar este gatilho.</span>
                                        </div>
                                    </label>
                                </div>

                                {/* Canal Type Options */}
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-700">Canal de Comunicação (Alvo)</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {(['EMAIL', 'SMS', 'WEBHOOK'] as const).map((tipo) => (
                                            <label
                                                key={tipo}
                                                className={`relative flex cursor-pointer p-4 border rounded-lg shadow-sm focus:outline-none ${editingRegra.tipo_canal === tipo
                                                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                                    : 'bg-white border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="canal_notificacao"
                                                    value={tipo}
                                                    checked={editingRegra.tipo_canal === tipo}
                                                    onChange={() => setEditingRegra({ ...editingRegra, tipo_canal: tipo })}
                                                    className="sr-only"
                                                />
                                                <span className="flex flex-1 items-center gap-3">
                                                    <span className="flex flex-col">
                                                        <span className="block text-sm font-medium text-slate-900 flex items-center gap-2">
                                                            {getCanalIcon(tipo)} {tipo === 'WEBHOOK' ? 'HTTP Webhook' : tipo}
                                                        </span>
                                                    </span>
                                                </span>
                                                {editingRegra.tipo_canal === tipo && (
                                                    <CheckCircle2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Destinos */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex justify-between">
                                        <span>Lista de Contactos / Destinos</span>
                                        <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                            Escreve e pressiona a tecla Enter
                                        </span>
                                    </label>
                                    <div className="flex flex-wrap items-center gap-2 p-2 border border-slate-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 min-h-[50px]">
                                        {(editingRegra.destinatarios_array || []).map((dest, i) => (
                                            <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-800 text-sm border border-slate-200">
                                                {dest}
                                                <button type="button" onClick={() => handleRemoveDestinatario(i)} className="text-slate-400 hover:text-red-500 focus:outline-none">
                                                    <XCircle size={14} />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm p-1 min-w-[150px] text-slate-900 placeholder:text-slate-400"
                                            placeholder={
                                                editingRegra.tipo_canal === 'EMAIL' ? 'Ex: abc@brunswick.pt' :
                                                    (editingRegra.tipo_canal === 'SMS' ? 'Ex: +351910000000' :
                                                        'https://hook.url/endpoint')
                                            }
                                            value={destinatarioInput}
                                            onChange={e => setDestinatarioInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddDestinatario(); } }}
                                            onBlur={handleAddDestinatario}
                                        />
                                    </div>
                                </div>

                                {/* Body Payload */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Corpo da Mensagem (Payload)</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900 font-mono"
                                        rows={4}
                                        required
                                        placeholder="Ex: A Máquina {{nome_dispositivo}} encontra-se offline..."
                                        value={editingRegra.template_mensagem || ''}
                                        onChange={e => setEditingRegra({ ...editingRegra, template_mensagem: e.target.value })}
                                    ></textarea>
                                </div>

                                {/* Helper Box */}
                                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 shadow-sm mt-4">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-2">
                                        <Lightbulb size={18} className="text-amber-500" /> Dicas de Configuração (Manual)
                                    </h4>
                                    <p className="text-xs text-amber-700 mb-3 leading-relaxed">
                                        Tu podes injetar <strong>Variáveis Dinâmicas</strong> dentro da mensagem pondo chaves duplas: <code>{'{'}{'{'} variavel {'}'}{'}'}</code>.<br />
                                        Se pretendes criar uma Regra de Andon, copia rigorosamente a mensagem abaixo:
                                    </p>

                                    <div className="bg-amber-100/50 p-3 rounded-md border border-amber-200 font-mono text-xs text-amber-900 whitespace-pre-wrap select-all mb-3 relative group">
                                        [{'Brunswick MES OEE'}] ALERTA DE ANDON{'\n'}
                                        OP: {'{'}{'{'}op_numero{'}'}{'}'}{'\n'}
                                        Estação: {'{'}{'{'}op_estacao{'}'}{'}'}{'\n'}
                                        Causa Raiz/Alvo: {'{'}{'{'}op_estacao_causadora{'}'}{'}'}{'\n'}
                                        Motivo: {'{'}{'{'}tipo_alerta{'}'}{'}'} - {'{'}{'{'}descricao_alerta{'}'}{'}'}
                                    </div>

                                    <ul className="text-[11px] text-amber-700/80 space-y-1 list-disc pl-4">
                                        <li><strong>Resend API Grátis:</strong> Só consegues enviar e-mail se o destinatário for o teu próprio E-mail (o e-mail que usaste para criar conta na Resend).</li>
                                        <li><strong>Twilio Grátis:</strong> Tens de registar ("verificar") o número de telefone de destino no painel da Twilio, para evitares medidas Anti-Spam (Verified Caller IDs).</li>
                                        <li>Tens isso detalhado lá trás no teu manual `Configuracao_SMS_EMAIL.md`. Verificaste os `.env` no teu painel Vercel? Faz um Redeploy!</li>
                                    </ul>
                                </div>

                            </form>
                        </div>

                        {/* Footer Action */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="regra-form"
                                className="px-5 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Send size={18} /> Salvar Regra
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

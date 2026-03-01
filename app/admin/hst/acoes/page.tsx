'use client';

import React, { useEffect, useState } from 'react';
import { getHstAcoes, updateHstAcaoStatus, deleteHstAcao, criarHstAcao } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ListTodo, CheckCircle2, Clock, AlertTriangle, MessageSquarePlus, MapPin, Loader2, Search, History, LayoutDashboard, Plus, Trash2, Calendar, Target, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function HstActionsKanbanPage() {
    const [acoes, setAcoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter Controls
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'kanban' | 'historico'>('kanban');

    // Drag State
    const [draggedItem, setDraggedItem] = useState<string | null>(null);

    useEffect(() => {
        carregarAcoes();
    }, []);

    async function carregarAcoes() {
        setLoading(true);
        const res = await getHstAcoes();
        if (res.success) {
            setAcoes(res.data || []);
        }
        setLoading(false);
    }

    const moveCard = async (id: string, status: string) => {
        const originalStatus = acoes.find(a => a.id === id)?.status;
        if (originalStatus === status) return;

        // Optimistic UI update
        setAcoes(prev => prev.map(a => a.id === id ? { ...a, status } : a));

        const res = await updateHstAcaoStatus(id, status);
        if (!res.success) {
            // Revert optimitic UI
            carregarAcoes();
            alert("Erro a mover a tarefa: " + res.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Remover esta ação do quadro?")) return;
        const res = await deleteHstAcao(id);
        if (res.success) {
            carregarAcoes();
        } else {
            alert("Erro ao remover: " + res.error);
        }
    };

    const StatusColumns = ["To Do", "In Progress", "Blocked", "Done"];

    const getOriginIcon = (tipo: string) => {
        if (!tipo) return <ShieldAlert className="w-3 h-3 text-slate-500" />;
        if (tipo === 'Acidente com Baixa') return <AlertTriangle className="w-3 h-3 text-red-600" />;
        if (tipo === 'Acidente sem Baixa') return <AlertTriangle className="w-3 h-3 text-orange-500" />;
        if (tipo === 'Incidente/Quase-Acidente') return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
        return <MessageSquarePlus className="w-3 h-3 text-slate-500" />;
    };

    const getPrioridadeColor = (pri: string) => {
        switch (pri) {
            case 'Critica': return 'bg-red-500 text-white';
            case 'Alta': return 'bg-orange-500 text-white';
            case 'Media': return 'bg-blue-500 text-white';
            default: return 'bg-slate-300 text-slate-700';
        }
    };

    const filteredAcoes = acoes.filter(acao => {
        const searchU = searchTerm.toUpperCase();
        const mTerm = !searchTerm ||
            (acao.descricao_acao || '').toUpperCase().includes(searchU) ||
            (acao.operadores?.nome_operador || '').toUpperCase().includes(searchU) ||
            (acao.hst_ocorrencias?.tipo_ocorrencia || '').toUpperCase().includes(searchU);

        const mTab = activeTab === 'kanban' ? acao.status !== 'Done' : acao.status === 'Done';

        return mTerm && mTab;
    });

    return (
        <div className="p-8 space-y-8 pb-32 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500 bg-slate-50/50 min-h-screen">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-6 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <ListTodo className="text-rose-600" size={36} /> Painel de Ações HST
                    </h1>
                    <p className="text-lg text-slate-500 mt-1">Gestão Ágil de Tarefas de Correção (Mitigação de Acidentes e Relatórios 8D).</p>
                </div>

                <div className="flex bg-slate-200/50 p-1 rounded-xl w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('kanban')}
                        className={`flex-1 md:px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all \${activeTab === 'kanban' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <LayoutDashboard size={16} />
                        Kanban (Ativas)
                    </button>
                    <button
                        onClick={() => setActiveTab('historico')}
                        className={`flex-1 md:px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all \${activeTab === 'historico' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <History size={16} />
                        Arquivo (Concluídas)
                    </button>
                </div>
            </header>

            <div className="flex flex-col xl:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por Tarefa, Responsável ou Origem..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-slate-700 font-medium"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>
            ) : activeTab === 'kanban' ? (
                // BOARD KANBAN
                <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
                    {StatusColumns.filter(c => c !== 'Done').map(column => {
                        const columnTasks = filteredAcoes.filter(a => a.status === column);

                        let colColor = "bg-slate-100 border-slate-200";
                        let headColor = "bg-slate-200 text-slate-700";
                        if (column === 'In Progress') { colColor = "bg-rose-50 border-rose-100"; headColor = "bg-rose-100 text-rose-800"; }
                        if (column === 'Blocked') { colColor = "bg-orange-50 border-orange-100"; headColor = "bg-orange-100 text-orange-800"; }

                        return (
                            <div
                                key={column}
                                className={`flex-none w-[350px] rounded-xl border \${colColor} flex flex-col h-[calc(100vh-300px)] snap-center transition-colors`}
                                onDragOver={e => {
                                    e.preventDefault();
                                    e.currentTarget.classList.add('ring-2', 'ring-rose-400', 'ring-offset-2');
                                }}
                                onDragLeave={e => {
                                    e.currentTarget.classList.remove('ring-2', 'ring-rose-400', 'ring-offset-2');
                                }}
                                onDrop={e => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('ring-2', 'ring-rose-400', 'ring-offset-2');
                                    if (draggedItem) moveCard(draggedItem, column);
                                }}
                            >
                                <div className={`px-4 py-3 \${headColor} rounded-t-xl font-black uppercase tracking-widest text-sm flex justify-between items-center shrink-0`}>
                                    {column}
                                    <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">{columnTasks.length}</span>
                                </div>
                                <div className="p-3 gap-3 flex flex-col overflow-y-auto flex-1 custom-scrollbar">
                                    {columnTasks.map(task => (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={() => setDraggedItem(task.id)}
                                            onDragEnd={() => setDraggedItem(null)}
                                            className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-rose-300 hover:shadow-md transition-all group relative animate-in zoom-in-95"
                                        >
                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 truncate max-w-[200px]" title={task.hst_ocorrencias?.tipo_ocorrencia}>
                                                    {getOriginIcon(task.hst_ocorrencias?.tipo_ocorrencia)}
                                                    {task.hst_ocorrencias ? `Origem: \${task.hst_ocorrencias.tipo_ocorrencia.substring(0,15)}... (\${task.hst_ocorrencias.areas_fabrica?.nome_area || 'N/A'})` : 'Ação Avulsa'}
                                                </div>
                                                <div className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 \${getPrioridadeColor(task.prioridade)}`}>
                                                    {task.prioridade}
                                                </div>
                                            </div>

                                            <h4 className="text-sm font-bold text-slate-800 leading-snug mb-3">
                                                {task.descricao_acao}
                                            </h4>

                                            <div className="flex justify-between items-end">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                                                        <Target size={12} className="text-slate-400" />
                                                        Resp: {task.operadores?.nome_operador || <span className="text-rose-500 italic">Por atribuir</span>}
                                                    </div>
                                                    {task.data_prevista && (
                                                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                                            <Calendar size={10} /> Meta: {format(new Date(task.data_prevista), 'dd/MM/yyyy')}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => moveCard(task.id, 'Done')} title="Marcar Concluída">
                                                        <CheckCircle2 size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(task.id)} title="Eliminar">
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {columnTasks.length === 0 && (
                                        <div className="h-full flex items-center justify-center text-sm font-medium text-slate-400/50 border-2 border-dashed border-slate-200/50 rounded-lg">
                                            Arraste cards para aqui
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // LISTA DE ARQUIVO
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500">
                                <th className="px-6 py-4 font-bold">Ação Mitigadora</th>
                                <th className="px-6 py-4 font-bold">Origem</th>
                                <th className="px-6 py-4 font-bold">Responsável</th>
                                <th className="px-6 py-4 font-bold text-center">Conclusão</th>
                                <th className="px-6 py-4 font-bold text-right">Devolver</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAcoes.map(task => (
                                <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800 text-sm max-w-sm truncate" title={task.descricao_acao}>{task.descricao_acao}</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1.5 uppercase">
                                            <Clock size={10} /> Criado: {format(new Date(task.created_at), 'dd/MM/yyyy')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                                            {getOriginIcon(task.hst_ocorrencias?.tipo_ocorrencia)}
                                            {task.hst_ocorrencias?.tipo_ocorrencia || 'Manual'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                                        {task.operadores?.nome_operador || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {task.data_conclusao ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
                                                <CheckCircle2 size={12} /> {format(new Date(task.data_conclusao), 'dd/MM/yy')}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button size="sm" variant="outline" onClick={() => moveCard(task.id, 'In Progress')} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200">
                                            Reabrir
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredAcoes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">Não há ações concluídas no Histórico.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

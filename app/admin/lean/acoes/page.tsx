"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListTodo, CheckCircle2, Clock, AlertTriangle, MessageSquarePlus, Lightbulb, MapPin, Loader2, GripVertical, Check, Search, History, LayoutDashboard } from 'lucide-react';
import { getLeanAcoes, updateActionStatus } from './actions';

export default function GlobalLeanActionsPage() {
    const [acoes, setAcoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter Controls
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'kanban' | 'historico'>('kanban');

    useEffect(() => {
        carregarAcoes();
    }, []);

    async function carregarAcoes() {
        setLoading(true);
        const res = await getLeanAcoes();
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

        const res = await updateActionStatus(id, status);
        if (!res.success) {
            // Revert optimitic UI
            carregarAcoes();
            alert("Erro a mover a tarefa: " + res.error);
        }
    };

    const StatusColumns = ["To Do", "In Progress", "Blocked", "Done"];

    const getOriginIcon = (tipo: string) => {
        if (tipo === 'Kaizen') return <Lightbulb className="w-3 h-3 text-amber-500" />;
        if (tipo?.includes('RNC')) return <AlertTriangle className="w-3 h-3 text-rose-500" />;
        if (tipo === 'Gemba Walk') return <MapPin className="w-3 h-3 text-blue-500" />;
        return <MessageSquarePlus className="w-3 h-3 text-slate-500" />;
    };

    return (
        <div className="p-8 space-y-8 pb-32 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500 bg-slate-50/50 min-h-screen">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-6 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <ListTodo className="text-emerald-600" size={36} /> Painel de Ações Contínuas
                    </h1>
                    <p className="text-lg text-slate-500 mt-1">Trâmite de Tarefas de Resolução RNC, Gembas e Kaizens (Agile/Scrum Board).</p>
                </div>

                <div className="flex bg-slate-200/50 p-1 rounded-xl w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('kanban')}
                        className={`flex-1 md:px-6 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all \${activeTab === 'kanban' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <LayoutDashboard size={16} />
                        Kanban Ativo
                    </button>
                    <button
                        onClick={() => setActiveTab('historico')}
                        className={`flex-1 md:px-6 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all \${activeTab === 'historico' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <History size={16} />
                        Arquivo (Done)
                    </button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por Tarefa, Descrição, Origem ou Área..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 font-medium"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6 w-full items-start">

                    {StatusColumns.map(columnId => {
                        // Esconder colunas não pertencentes à tab
                        if (activeTab === 'kanban' && columnId === 'Done') return null;
                        if (activeTab === 'historico' && columnId !== 'Done') return null;

                        const colItems = acoes.filter(a => {
                            if (a.status !== columnId) return false;

                            if (searchTerm === '') return true;
                            const term = searchTerm.toLowerCase();
                            return (
                                a.titulo?.toLowerCase().includes(term) ||
                                a.descricao?.toLowerCase().includes(term) ||
                                a.origem_tipo?.toLowerCase().includes(term) ||
                                a.areas_fabrica?.nome_area?.toLowerCase().includes(term)
                            );
                        });

                        // Theme definitions
                        let headerTheme = "bg-slate-100 text-slate-700 border-slate-200";
                        if (columnId === 'In Progress') headerTheme = "bg-indigo-100 text-indigo-800 border-indigo-200";
                        if (columnId === 'Blocked') headerTheme = "bg-rose-100 text-rose-800 border-rose-200";
                        if (columnId === 'Done') headerTheme = "bg-emerald-100 text-emerald-800 border-emerald-200";

                        return (
                            <div key={columnId} className="flex-1 w-full flex flex-col gap-4">
                                <div className={`px-4 py-3 rounded-xl border flex justify-between items-center font-black uppercase tracking-widest \${headerTheme}`}>
                                    <div className="flex items-center gap-2">
                                        {columnId === 'To Do' && <Clock size={16} />}
                                        {columnId === 'In Progress' && <Loader2 size={16} className="animate-spin" />}
                                        {columnId === 'Blocked' && <AlertTriangle size={16} />}
                                        {columnId === 'Done' && <CheckCircle2 size={16} />}
                                        {columnId}
                                    </div>
                                    <span className="bg-white/50 text-black/60 px-2 py-0.5 rounded text-xs leading-none">
                                        {colItems.length}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-3 min-h-[500px] border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-100/30">
                                    {colItems.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold uppercase tracking-widest p-8 text-center italic">
                                            Vazio
                                        </div>
                                    ) : (
                                        colItems.map(task => (
                                            <Card key={task.id} className="cursor-pointer border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all active:scale-95 group relative bg-white overflow-hidden">
                                                {/* Sidebar accent color */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 \${
                                                    task.origem_tipo === 'Kaizen' ? 'bg-amber-400' :
                                                    task.origem_tipo?.includes('RNC') ? 'bg-rose-500' : 'bg-blue-400'
                                                }`}></div>

                                                <CardContent className="p-4 pl-5">
                                                    <div className="flex justify-between items-start mb-2 gap-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded inline-flex items-center gap-1">
                                                            {getOriginIcon(task.origem_tipo)} {task.origem_tipo}
                                                        </span>
                                                        <div className="text-[10px] font-mono text-slate-400">
                                                            {new Date(task.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>

                                                    <h3 className="font-bold text-slate-800 leading-tight mb-2 text-sm">{task.titulo}</h3>

                                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                                                        {task.descricao || 'Sem descrição.'}
                                                    </p>

                                                    <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                                                        <div className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                            {task.areas_fabrica?.nome_area || 'Global'}
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {columnId !== 'To Do' && (
                                                                <button onClick={() => moveCard(task.id, 'To Do')} className="w-6 h-6 rounded bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200" title="Mover para To Do">«</button>
                                                            )}
                                                            {columnId !== 'In Progress' && (
                                                                <button onClick={() => moveCard(task.id, 'In Progress')} className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200" title="Mover para In Progress"><Loader2 className="w-3 h-3" /></button>
                                                            )}
                                                            {columnId !== 'Blocked' && (
                                                                <button onClick={() => moveCard(task.id, 'Blocked')} className="w-6 h-6 rounded bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-200" title="Marcar como Bloqueado"><AlertTriangle className="w-3 h-3" /></button>
                                                            )}
                                                            {columnId !== 'Done' && (
                                                                <button onClick={() => moveCard(task.id, 'Done')} className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200" title="Concluir!"><Check className="w-3 h-3" /></button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}

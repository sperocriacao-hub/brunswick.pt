"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListTodo, CheckCircle2, Clock, AlertTriangle, MessageSquarePlus, Lightbulb, MapPin, Loader2, GripVertical, Check, Search, History, LayoutDashboard, Save, Plus, Trash2, FileText, Target, Crosshair, Printer, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getLeanAcoes, updateActionStatus, updateA3Report } from './actions';

export default function GlobalLeanActionsPage() {
    const [acoes, setAcoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter Controls
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'kanban' | 'historico' | 'lista'>('kanban');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    // A3 Modal State
    const [selectedAction, setSelectedAction] = useState<any | null>(null);
    const [isA3Open, setIsA3Open] = useState(false);
    const [isSavingA3, setIsSavingA3] = useState(false);

    // Form Temporary State mimicking A3 fields
    const [equipa, setEquipa] = useState("");
    const [indicadores, setIndicadores] = useState("");
    const [validacao, setValidacao] = useState("Pendente");
    const [whys, setWhys] = useState<string[]>(['', '', '', '', '']);
    const [tasks5w, setTasks5w] = useState<any[]>([]);

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

    const openA3Modal = (action: any) => {
        setSelectedAction(action);
        setEquipa(action.equipa_trabalho || "");
        setIndicadores(action.indicadores_sucesso || "");
        setValidacao(action.validacao_eficacia || "Pendente");

        const loadedWhys = Array.isArray(action.causa_raiz_5w) && action.causa_raiz_5w.length > 0
            ? action.causa_raiz_5w
            : ['', '', '', '', ''];
        setWhys(loadedWhys);

        const loadedTasks = Array.isArray(action.plano_acao_5w2h) ? action.plano_acao_5w2h : [];
        setTasks5w(loadedTasks);

        setIsA3Open(true);
    };

    const handleSalvarA3 = async () => {
        if (!selectedAction) return;
        setIsSavingA3(true);

        const payload = {
            equipa_trabalho: equipa,
            causa_raiz_5w: whys,
            plano_acao_5w2h: tasks5w,
            indicadores_sucesso: indicadores,
            validacao_eficacia: validacao
        };

        const res = await updateA3Report(selectedAction.id, payload);
        if (res.success) {
            setIsA3Open(false);
            carregarAcoes(); // Recarregar para ter os dados frescos no cartão
        } else {
            alert("Erro ao gravar Relatório A3: " + res.error);
        }
        setIsSavingA3(false);
    };

    const handleAddTask5w = () => {
        setTasks5w([...tasks5w, { o_que: '', quem: '', quando: '', status: 'Pendente' }]);
    };

    const updateTask5w = (index: number, field: string, value: string) => {
        const nf = [...tasks5w];
        nf[index][field] = value;
        setTasks5w(nf);
    };

    const removeTask5w = (index: number) => {
        setTasks5w(tasks5w.filter((_, i) => i !== index));
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
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-6 border-slate-200 print:hidden">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <ListTodo className="text-emerald-600" size={36} /> Painel de Ações Contínuas
                    </h1>
                    <p className="text-lg text-slate-500 mt-1">Trâmite de Tarefas de Resolução RNC, Gembas e Kaizens (Agile/Scrum Board).</p>
                </div>

                <div className="flex bg-slate-200/50 p-1 rounded-xl w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('kanban')}
                        className={`flex-1 md:px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all \${activeTab === 'kanban' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <LayoutDashboard size={16} />
                        Kanban
                    </button>
                    <button
                        onClick={() => setActiveTab('historico')}
                        className={`flex-1 md:px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all \${activeTab === 'historico' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <History size={16} />
                        Arquivo
                    </button>
                    <button
                        onClick={() => setActiveTab('lista')}
                        className={`flex-1 md:px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all \${activeTab === 'lista' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText size={16} />
                        Relatórios
                    </button>
                </div>
            </header>

            <div className="flex flex-col xl:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por Tarefa, Resp., Origem ou Causa..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 font-medium"
                    />
                </div>
                {activeTab === 'lista' && (
                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <Calendar className="text-slate-400 ml-2" size={16} />
                            <input
                                type="date"
                                value={dataInicio}
                                onChange={e => setDataInicio(e.target.value)}
                                className="bg-transparent text-sm text-slate-600 focus:outline-none px-1"
                                title="Data Inicial"
                            />
                            <span className="text-slate-400 text-sm font-medium">até</span>
                            <input
                                type="date"
                                value={dataFim}
                                onChange={e => setDataFim(e.target.value)}
                                className="bg-transparent text-sm text-slate-600 focus:outline-none px-1"
                                title="Data Final"
                            />
                        </div>
                        <Button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white shadow-sm w-full sm:w-auto">
                            <Printer size={16} className="mr-2" /> Imprimir
                        </Button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
            ) : activeTab === 'lista' ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto print:overflow-visible print:border-none print:shadow-none print:-mt-8">
                    <div className="hidden print:block mb-6">
                        <h2 className="text-2xl font-black text-slate-900 border-b border-slate-200 pb-2">Relatório Consolidado de Ações (A3/PDCA)</h2>
                        <p className="text-slate-500 mt-2 font-mono text-sm">Data de Emissão: {new Date().toLocaleDateString()}</p>
                    </div>
                    <table className="w-full text-left border-collapse min-w-[1000px] print:min-w-0">
                        <thead>
                            <tr className="bg-slate-50 print:bg-transparent border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500">
                                <th className="p-4 font-bold">Data</th>
                                <th className="p-4 font-bold">Origem</th>
                                <th className="p-4 font-bold">Ação / Problema</th>
                                <th className="p-4 font-bold">Responsável</th>
                                <th className="p-4 font-bold w-1/4">Causa Raiz Aferida</th>
                                <th className="p-4 font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 print:divide-slate-200 text-sm text-slate-700">
                            {acoes.filter(a => {
                                // Search
                                if (searchTerm) {
                                    const term = searchTerm.toLowerCase();
                                    const whyStr = Array.isArray(a.causa_raiz_5w) ? a.causa_raiz_5w.join(" ") : "";
                                    if (!(
                                        a.titulo?.toLowerCase().includes(term) ||
                                        a.descricao?.toLowerCase().includes(term) ||
                                        a.origem_tipo?.toLowerCase().includes(term) ||
                                        a.equipa_trabalho?.toLowerCase().includes(term) ||
                                        whyStr.toLowerCase().includes(term)
                                    )) return false;
                                }
                                // Date Filters
                                if (dataInicio && new Date(a.created_at) < new Date(dataInicio)) return false;
                                if (dataFim) {
                                    const end = new Date(dataFim);
                                    end.setHours(23, 59, 59, 999);
                                    if (new Date(a.created_at) > end) return false;
                                }
                                return true;
                            }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map(task => {
                                    // Find best "Why" (last filled one or first)
                                    const ws = Array.isArray(task.causa_raiz_5w) ? task.causa_raiz_5w.filter((w: string) => w.trim() !== '') : [];
                                    const mainCause = ws.length > 0 ? ws[ws.length - 1] : "Não definida";

                                    return (
                                        <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer print:hover:bg-transparent" onClick={() => openA3Modal(task)}>
                                            <td className="p-4 font-mono text-slate-500 whitespace-nowrap text-xs">{new Date(task.created_at).toLocaleDateString()}</td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 print:bg-transparent print:border print:border-slate-300 px-2 py-1 rounded inline-flex items-center gap-1">
                                                    {getOriginIcon(task.origem_tipo)} {task.origem_tipo}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-slate-900 group-hover:text-indigo-600 print:group-hover:text-slate-900 transition-colors">
                                                {task.titulo}
                                            </td>
                                            <td className="p-4 text-slate-600 font-medium">
                                                {task.equipa_trabalho || '-'}
                                            </td>
                                            <td className="p-4 text-slate-500 italic text-xs leading-relaxed max-w-[250px] truncate print:whitespace-normal print:break-words">
                                                {mainCause}
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest print:bg-transparent print:border \${
                                                task.status === 'Done' ? 'bg-emerald-100 text-emerald-600 print:border-emerald-600' :
                                                task.status === 'In Progress' ? 'bg-indigo-100 text-indigo-600 print:border-indigo-600' :
                                                task.status === 'Blocked' ? 'bg-rose-100 text-rose-600 print:border-rose-600' :
                                                'bg-slate-100 text-slate-600 print:border-slate-600'
                                            }`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6 w-full items-start print:hidden">

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
                                            <Card
                                                key={task.id}
                                                onClick={(e) => {
                                                    // Only open modal if we didn't click an action button
                                                    if ((e.target as HTMLElement).closest('button')) return;
                                                    openA3Modal(task);
                                                }}
                                                className="cursor-pointer border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all active:scale-95 group relative bg-white overflow-hidden"
                                            >
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

            {/* Modal A3 (PDCA Problem Solving) */}
            <Dialog open={isA3Open} onOpenChange={setIsA3Open}>
                <DialogContent className="max-w-[1000px] h-[90vh] flex flex-col p-0 border-slate-200 bg-slate-50 overflow-hidden">
                    <DialogHeader className="bg-white px-8 py-6 border-b border-slate-200 shrink-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                    <FileText className="text-indigo-600" /> Relatório de Resolução A3
                                    <span className="text-xs bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full border border-slate-200 uppercase tracking-widest">{selectedAction?.status}</span>
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium mt-1 text-base">
                                    {selectedAction?.titulo}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto w-full p-8 pb-32">
                        <Tabs defaultValue="definicao" className="w-full">
                            <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-slate-200/50 p-1 mb-8">
                                <TabsTrigger value="definicao" className="font-bold text-xs uppercase data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">1. Definição</TabsTrigger>
                                <TabsTrigger value="root_cause" className="font-bold text-xs uppercase data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">2. Origem (5 Porquês)</TabsTrigger>
                                <TabsTrigger value="plano" className="font-bold text-xs uppercase data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">3. Plano 5W2H</TabsTrigger>
                                <TabsTrigger value="verificacao" className="font-bold text-xs uppercase data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">4. Verificação</TabsTrigger>
                            </TabsList>

                            {/* TAB 1: DEFINIÇÃO */}
                            <TabsContent value="definicao" className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h3 className="font-black text-lg text-slate-800 mb-4 flex items-center gap-2"><Target size={18} className="text-indigo-500" /> Definição do Problema</h3>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 leading-relaxed min-h-[100px] whitespace-pre-wrap text-sm">
                                        {selectedAction?.descricao}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-600 text-sm">Equipa de Trabalho</Label>
                                    <Input
                                        placeholder="Ex: Pedro (Engenharia), Maria (Qualidade), João (Produção)"
                                        value={equipa} onChange={e => setEquipa(e.target.value)}
                                        className="bg-slate-50"
                                    />
                                    <p className="text-xs text-slate-400">Quem está envolvido na resolução desta anomalia.</p>
                                </div>
                            </TabsContent>

                            {/* TAB 2: ROOT CAUSE (5 WHYS) */}
                            <TabsContent value="root_cause" className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h3 className="font-black text-lg text-slate-800 mb-1 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /> Causa Raiz (5 Porquês)</h3>
                                    <p className="text-sm text-slate-500 mb-6 font-medium">Questione o sintoma repetidamente até chegar à verdadeira causa organizativa.</p>
                                </div>

                                <div className="space-y-3 pl-4 border-l-2 border-amber-200">
                                    {whys.map((why, idx) => (
                                        <div key={idx} className="relative">
                                            <div className="absolute -left-[30px] top-2 bg-amber-100 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center font-black text-xs border border-amber-300 shadow-sm">
                                                {idx + 1}
                                            </div>
                                            <Input
                                                placeholder={`Porquê..?`}
                                                value={why}
                                                onChange={e => {
                                                    const w = [...whys];
                                                    w[idx] = e.target.value;
                                                    setWhys(w);
                                                }}
                                                className="bg-slate-50 border-slate-200 focus-visible:ring-amber-500 font-medium"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* TAB 3: PLANO DE AÇÃO 5W2H */}
                            <TabsContent value="plano" className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <h3 className="font-black text-lg text-slate-800 mb-1 flex items-center gap-2"><ListTodo size={18} className="text-blue-500" /> Plano de Ação (Subtarefas)</h3>
                                        <p className="text-sm text-slate-500 font-medium">Contramedidas para atacar a causa raiz que acabou de ser identificada.</p>
                                    </div>
                                    <Button onClick={handleAddTask5w} size="sm" className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold border border-blue-200">
                                        <Plus size={16} className="mr-1" /> Adicionar Ação
                                    </Button>
                                </div>

                                {tasks5w.length === 0 ? (
                                    <div className="text-center py-10 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-slate-500 font-medium text-sm">
                                        Nenhuma ação corretiva definida.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {tasks5w.map((t, idx) => (
                                            <div key={idx} className="flex flex-col md:flex-row gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 items-start md:items-center">
                                                <div className="flex-1 space-y-1 w-full">
                                                    <Input
                                                        placeholder="O Que Fazer (What)? Ex: Mudar sensor"
                                                        value={t.o_que} onChange={e => updateTask5w(idx, 'o_que', e.target.value)}
                                                        className="h-8 text-sm font-bold bg-white"
                                                    />
                                                </div>
                                                <div className="w-full md:w-[150px]">
                                                    <Input
                                                        placeholder="Quem (Who)?"
                                                        value={t.quem} onChange={e => updateTask5w(idx, 'quem', e.target.value)}
                                                        className="h-8 text-sm bg-white"
                                                    />
                                                </div>
                                                <div className="w-full md:w-[150px]">
                                                    <Input
                                                        type="date"
                                                        value={t.quando} onChange={e => updateTask5w(idx, 'quando', e.target.value)}
                                                        className="h-8 text-sm bg-white text-slate-600"
                                                    />
                                                </div>
                                                <div className="w-full md:w-[130px]">
                                                    <select
                                                        className="w-full h-8 text-sm rounded-md border border-slate-200 bg-white px-2 pr-6 font-semibold truncate"
                                                        value={t.status} onChange={e => updateTask5w(idx, 'status', e.target.value)}
                                                    >
                                                        <option value="Pendente">Pendente</option>
                                                        <option value="Feito">Feito</option>
                                                    </select>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => removeTask5w(idx)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 rounded-full shrink-0">
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* TAB 4: VERIFICAÇÃO */}
                            <TabsContent value="verificacao" className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h3 className="font-black text-lg text-slate-800 mb-1 flex items-center gap-2"><Crosshair size={18} className="text-emerald-500" /> Padronização e Verificação (Act)</h3>
                                    <p className="text-sm text-slate-500 font-medium">Após as ações serem fechadas, volte ao terreno para aferir se o problema desapareceu.</p>
                                </div>

                                <div className="space-y-6 pt-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-600 text-sm">Indicadores de Controlo (Como Medimos o Sucesso?)</Label>
                                        <Textarea
                                            placeholder="Ex: Acompanhar o OEE da máquina durante 15 dias. O defeito não pode voltar a aparecer."
                                            value={indicadores} onChange={e => setIndicadores(e.target.value)}
                                            className="bg-slate-50 min-h-[80px]"
                                        />
                                    </div>

                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                                        <Label className="font-black text-slate-800 text-sm block">Veredicto Final do Comitê</Label>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setValidacao('Pendente')}
                                                className={`flex-1 py-3 rounded-lg border-2 font-bold text-sm transition-all \${validacao === 'Pendente' ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-sm' : 'border-transparent bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                            >
                                                Em Análise / Observação
                                            </button>
                                            <button
                                                onClick={() => setValidacao('Eficaz')}
                                                className={`flex-1 py-3 rounded-lg border-2 font-bold text-sm transition-all \${validacao === 'Eficaz' ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm' : 'border-transparent bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                            >
                                                Padrão Eficaz (Fechado)
                                            </button>
                                            <button
                                                onClick={() => setValidacao('Ineficaz')}
                                                className={`flex-1 py-3 rounded-lg border-2 font-bold text-sm transition-all \${validacao === 'Ineficaz' ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-sm' : 'border-transparent bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                            >
                                                Falhou (Reabrir Análise)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <DialogFooter className="bg-white border-t border-slate-200 px-8 py-4 sm:justify-between absolute bottom-0 left-0 right-0 z-10 w-full shrink-0 items-center">
                        <div className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <span>Estado da Ação Kanban:</span>
                            <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-600 font-black uppercase text-xs">{selectedAction?.status}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsA3Open(false)} className="font-bold border-slate-200">Cancelar</Button>
                            <Button
                                disabled={isSavingA3}
                                onClick={handleSalvarA3}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold w-[180px]"
                            >
                                {isSavingA3 ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Guardar Relatório A3
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

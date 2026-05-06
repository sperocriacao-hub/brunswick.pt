'use client';

import React, { useEffect, useState } from 'react';
import { getHstAcoes, updateHstAcaoStatus, deleteHstAcao, criarHstAcao, updateA3Report } from './actions';
import { getHstOcorrencias } from '../ocorrencias/actions'; // Added this import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ListTodo, CheckCircle2, Clock, AlertTriangle, MessageSquarePlus, MapPin, Loader2, Search, History, LayoutDashboard, Plus, Trash2, Calendar, Target, ShieldAlert, ArrowRight, Save, FileText, Crosshair, ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export default function HstActionsKanbanPage() {
    const [acoes, setAcoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter(); // Added this line

    // Filter Controls
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'kanban' | 'historico'>('kanban');

    // Drag State
    const [draggedItem, setDraggedItem] = useState<string | null>(null);

    // Modal State
    const [isA3Open, setIsA3Open] = useState(false);
    const [selectedA3Id, setSelectedA3Id] = useState<string | null>(null);
    const [isSavingA3, setIsSavingA3] = useState(false);

    // A3 specific states
    const [selectedAction, setSelectedAction] = useState<any>(null); // For headers
    const [equipa, setEquipa] = useState('');
    const [whys, setWhys] = useState(['', '', '', '', '']);
    const [tipoAnalise, setTipoAnalise] = useState<'5-Whys' | 'Ishikawa'>('5-Whys');
    const [ishikawa, setIshikawa] = useState({ man: '', machine: '', material: '', method: '', measurement: '', environment: '' });
    const [tasks5w, setTasks5w] = useState<any[]>([]);
    const [indicadores, setIndicadores] = useState('');
    const [validacao, setValidacao] = useState<'Pendente'|'Eficaz'|'Ineficaz'>('Pendente');

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

    const openA3Modal = (acao: any) => {
        const hst8d = acao.hst_8d;
        const id8d = hst8d?.id || acao.relatorio_8d_id; // Check both in case of API variations
        if (!hst8d && !id8d) {
            alert("Aviso: Esta ação não tem um relatório 8D associado no sistema.");
            return;
        }

        setSelectedAction({
            ...acao,
            descricao_acao: acao.hst_ocorrencias?.descricao_ocorrencia || acao.descricao_acao,
            anexos_url: acao.hst_ocorrencias?.anexos_url || acao.anexos_url
        });
        setSelectedA3Id(id8d);

        // Map from hst_8d schema to A3 generic state
        setEquipa(hst8d?.d1_equipa || '');
        setIndicadores(hst8d?.d7_prevencao || '');
        setValidacao(hst8d?.status === 'Concluido' ? 'Eficaz' : 'Pendente');
        setTipoAnalise(hst8d?.tipo_analise_causa || '5-Whys');

        // Parse whys from d4_causa_raiz
        try {
            if (hst8d?.d4_causa_raiz && hst8d.d4_causa_raiz.startsWith('[')) {
                const w = JSON.parse(hst8d.d4_causa_raiz);
                if (Array.isArray(w)) setWhys(w.length === 5 ? w : [...w, '', '', '', '', ''].slice(0, 5));
            } else if (hst8d?.d4_causa_raiz && hst8d.d4_causa_raiz.startsWith('{')) {
                const ish = JSON.parse(hst8d.d4_causa_raiz);
                setIshikawa(ish);
            }
        } catch {
            // Keep default empty whys
        }

        // Parse tasks from d5_acao_corretiva
        try {
            if (hst8d?.d5_acao_corretiva) {
                const t = JSON.parse(hst8d.d5_acao_corretiva);
                setTasks5w(Array.isArray(t) ? t : []);
            } else {
                setTasks5w([]);
            }
        } catch {
            setTasks5w([]);
        }

        setIsA3Open(true);
    };

    const handleSalvarA3 = async () => {
        if (!selectedA3Id) return;
        setIsSavingA3(true);

        const causa_raiz_data = tipoAnalise === '5-Whys' ? JSON.stringify(whys) : JSON.stringify(ishikawa);

        const payload = {
            d1_equipa: equipa,
            d4_causa_raiz: causa_raiz_data,
            d5_acao_corretiva: JSON.stringify(tasks5w),
            d7_prevencao: indicadores,
            tipo_analise_causa: tipoAnalise,
            status: validacao === 'Eficaz' ? 'Concluido' : 'Em Investigacao'
        };

        const res = await updateA3Report(selectedA3Id, payload);

        if (res.success) {
            setIsA3Open(false);
            carregarAcoes();
        } else {
            alert("Erro a guardar relatório: " + res.error);
        }
        setIsSavingA3(false);
    };

    const addTask5w = () => {
        setTasks5w([...tasks5w, { o_que: '', quem: '', quando: '', status: 'Pendente' }]);
    };

    const updateTask5w = (index: number, field: string, value: string) => {
        const newTasks = [...tasks5w];
        newTasks[index] = { ...newTasks[index], [field]: value };
        setTasks5w(newTasks);
    };

    const removeTask5w = (index: number) => {
        const newTasks = [...tasks5w];
        newTasks.splice(index, 1);
        setTasks5w(newTasks);
    };

    const StatusColumns = ["Aberto", "Em Investigacao", "Validacao", "Concluido"];

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

        const mTab = activeTab === 'kanban' ? acao.status !== 'Concluido' : acao.status === 'Concluido';

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
                    {StatusColumns.map(column => {
                        const columnTasks = filteredAcoes.filter(a => {
                            if (a.status !== column) return false;
                            
                            if (column === 'Concluido') {
                                const msPerDay = 1000 * 60 * 60 * 24;
                                const dataCriacao = new Date(a.data_conclusao || a.created_at || Date.now());
                                const diasPassados = (Date.now() - dataCriacao.getTime()) / msPerDay;
                                if (diasPassados > 30) return false;
                            }
                            return true;
                        });

                        let colColor = "bg-slate-100 border-slate-200";
                        let headColor = "bg-slate-200 text-slate-700";
                        if (column === 'Em Investigacao') { colColor = "bg-indigo-50 border-indigo-100"; headColor = "bg-indigo-100 text-indigo-800"; }
                        if (column === 'Validacao') { colColor = "bg-amber-50 border-amber-100"; headColor = "bg-amber-100 text-amber-800"; }
                        if (column === 'Concluido') { colColor = "bg-emerald-50 border-emerald-100"; headColor = "bg-emerald-100 text-emerald-800"; }

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
                                        const hasA3 = task.hst_8d != null || task.relatorio_8d_id != null;
                                        const isCritical = task.prioridade === 'Critica' || task.prioridade === 'Alta';

                                        return (
                                            <Card
                                                key={task.id}
                                                draggable
                                                onDragStart={() => setDraggedItem(task.id)}
                                                onDragEnd={() => setDraggedItem(null)}
                                                onClick={(e) => {
                                                    if ((e.target as HTMLElement).closest('.scrum-arrow')) return;
                                                    openA3Modal(task);
                                                }}
                                                className={`cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all group relative bg-white overflow-hidden border ${isCritical ? 'border-rose-300' : 'border-slate-200 hover:border-indigo-300'}`}
                                            >
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${hasA3 ? 'bg-indigo-400' : 'bg-slate-300'}`}></div>

                                                <CardContent className="p-4 pl-5">
                                                    <div className="flex justify-between items-start mb-2 gap-2">
                                                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 truncate max-w-[150px]" title={task.hst_ocorrencias?.tipo_ocorrencia}>
                                                            {getOriginIcon(task.hst_ocorrencias?.tipo_ocorrencia)}
                                                            {task.hst_ocorrencias?.tipo_ocorrencia || 'Ação'}
                                                        </div>
                                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${isCritical ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                            {task.prioridade}
                                                        </span>
                                                    </div>

                                                    <h3 className="font-bold text-slate-800 leading-tight mb-2 text-sm">
                                                        {task.hst_ocorrencias?.descricao_ocorrencia || task.descricao_acao}
                                                    </h3>
                                                    
                                                    <div className="text-[11px] text-slate-400 font-medium mb-3">
                                                        Contexto: {task.hst_ocorrencias?.areas_fabrica?.nome_area || 'N/A'}
                                                    </div>

                                                    <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                                                        <div>
                                                            {hasA3 ? (
                                                                <div className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">A3 ATIVO</div>
                                                            ) : (
                                                                <div className="text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">PENDENTE</div>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity scrum-arrow items-center">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={(e) => { e.stopPropagation(); moveCard(task.id, 'Concluido'); }} title="Marcar Concluída">
                                                                <CheckCircle2 size={14} />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-50 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} title="Eliminar">
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
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
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={() => openA3Modal(task)} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200" title="Ver Relatório A3">
                                                <FileText size={14} className="mr-1" /> A3
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => moveCard(task.id, 'Em Investigacao')} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200">
                                                Reabrir
                                            </Button>
                                        </div>
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
            {/* MODAL IDÊNTICO AO LEAN AÇÕES */}
            <Dialog open={isA3Open} onOpenChange={setIsA3Open}>
                <DialogContent className="max-w-[1000px] h-[90vh] flex flex-col p-0 border-slate-200 bg-slate-50 overflow-hidden">
                    <DialogHeader className="bg-white px-8 py-6 border-b border-slate-200 shrink-0 print:hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                    <FileText className="text-indigo-600" /> Relatório de Resolução HST (A3)
                                    <span className="text-xs bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full border border-slate-200 uppercase tracking-widest">{selectedAction?.status}</span>
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium mt-1 text-base">
                                    {selectedAction?.hst_ocorrencias?.tipo_ocorrencia} - {selectedAction?.descricao_acao}
                                </DialogDescription>
                            </div>
                            <Button variant="outline" onClick={() => window.print()} className="font-bold border-slate-300 text-slate-700 bg-slate-50 shadow-sm print:hidden">
                                🖨️ Imprimir Folha A3/8D
                            </Button>
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
                                    <h3 className="font-black text-lg text-slate-800 mb-4 flex items-center gap-2"><Target size={18} className="text-indigo-500" /> Definição do Problema (HST)</h3>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 leading-relaxed min-h-[100px] whitespace-pre-wrap text-sm">
                                        {selectedAction?.descricao_acao}
                                        {selectedAction?.hst_ocorrencias?.areas_fabrica?.nome_area && (
                                            <p className="mt-4 font-semibold text-slate-500 uppercase text-xs">Contexto: {selectedAction.hst_ocorrencias.areas_fabrica.nome_area}</p>
                                        )}
                                        {/* EXIBIÇÃO DE FOTOS NATIVAS DA OCORRÊNCIA */}
                                        {selectedAction?.anexos_url && selectedAction.anexos_url.length > 5 && (
                                            <div className="mt-6 border-t border-slate-200 pt-6">
                                                <h4 className="font-bold text-slate-700 text-xs uppercase mb-3 flex items-center gap-2"><ImageIcon size={14} className="text-indigo-500" /> Evidências Fotográficas da Anomalia</h4>
                                                <div className="flex gap-4 overflow-x-auto pb-4">
                                                    {(() => {
                                                        try {
                                                            const urls = JSON.parse(selectedAction.anexos_url);
                                                            if (Array.isArray(urls)) {
                                                                return urls.map((url: string, index: number) => url ? (
                                                                    <div key={index} className="w-56 h-56 shrink-0 rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all relative bg-slate-100 group">
                                                                        <img 
                                                                            src={url} 
                                                                            alt={`Prova ${index + 1}`} 
                                                                            className="object-cover w-full h-full cursor-pointer group-hover:scale-105 transition-transform duration-300" 
                                                                            onClick={() => window.open(url, '_blank')}
                                                                        />
                                                                    </div>
                                                                ) : null);
                                                            }
                                                        } catch(e) {}
                                                        return null;
                                                    })()}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium italic">Clique numa prova para a consultar no tamanho original (nova janela).</p>
                                            </div>
                                        )}
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
                                    <h3 className="font-black text-lg text-slate-800 mb-1 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /> Causa Raiz / Investigação</h3>
                                    <p className="text-sm text-slate-500 mb-6 font-medium">Selecione o método e identifique a verdadeira causa organizativa.</p>
                                </div>

                                <div className="flex bg-slate-100 p-1 rounded-lg w-fit mb-6">
                                    <button onClick={() => setTipoAnalise('5-Whys')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${tipoAnalise === '5-Whys' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>5 Porquês</button>
                                    <button onClick={() => setTipoAnalise('Ishikawa')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${tipoAnalise === 'Ishikawa' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Diagrama Ishikawa (6Ms)</button>
                                </div>

                                {tipoAnalise === '5-Whys' ? (
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
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { key: 'man', label: 'Mão-de-Obra', icon: '👷' },
                                            { key: 'machine', label: 'Máquina', icon: '⚙️' },
                                            { key: 'material', label: 'Material', icon: '📦' },
                                            { key: 'method', label: 'Método', icon: '📋' },
                                            { key: 'measurement', label: 'Medida', icon: '📏' },
                                            { key: 'environment', label: 'Meio Ambiente', icon: '🌍' }
                                        ].map(cat => (
                                            <div key={cat.key} className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <label className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-2">{cat.icon} {cat.label}</label>
                                                <Textarea 
                                                    value={(ishikawa as any)[cat.key]} 
                                                    onChange={e => setIshikawa({ ...ishikawa, [cat.key]: e.target.value })} 
                                                    className="min-h-[80px] bg-white text-sm" 
                                                    placeholder="Identifique possíveis causas nesta categoria..." 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* TAB 3: PLANO DE AÇÃO 5W2H */}
                            <TabsContent value="plano" className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <h3 className="font-black text-lg text-slate-800 mb-1 flex items-center gap-2"><ListTodo size={18} className="text-blue-500" /> Plano de Ação (Subtarefas)</h3>
                                        <p className="text-sm text-slate-500 font-medium">Contramedidas para atacar a causa raiz que acabou de ser identificada.</p>
                                    </div>
                                    <Button onClick={addTask5w} size="sm" className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold border border-blue-200">
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
                                                className={`flex-1 py-3 rounded-lg border-2 font-bold text-sm transition-all ${validacao === 'Pendente' ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-sm' : 'border-transparent bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                            >
                                                Em Análise / Observação
                                            </button>
                                            <button
                                                onClick={() => setValidacao('Eficaz')}
                                                className={`flex-1 py-3 rounded-lg border-2 font-bold text-sm transition-all ${validacao === 'Eficaz' ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm' : 'border-transparent bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                            >
                                                Padrão Eficaz (Fechado)
                                            </button>
                                            <button
                                                onClick={() => setValidacao('Ineficaz')}
                                                className={`flex-1 py-3 rounded-lg border-2 font-bold text-sm transition-all ${validacao === 'Ineficaz' ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-sm' : 'border-transparent bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
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

            {/* DEDICATED PRINT TEMPLATE FOR 8D / A3 (PROFESSIONAL LEVEL) */}
            {selectedAction && (
                <div className="print-8d-template hidden print:block pt-4">
                    <style dangerouslySetInnerHTML={{__html:`
                        @media print {
                            body * { visibility: hidden !important; }
                            .print-8d-template, .print-8d-template * { visibility: visible !important; color: black !important; }
                            .print-8d-template { position: absolute; left: 0; top: 0; width: 100vw; box-sizing: border-box; padding: 20px; font-family: sans-serif; background: transparent; }
                            @page { size: landscape; margin: 10mm; }
                            table { page-break-inside: avoid; }
                            .print-image-container { max-height: 200px; max-width: 300px; object-fit: contain; }
                            .dialog-overlay, [role="dialog"] { display: none !important; }
                        }
                    `}} />

                    {/* CABEÇALHO */}
                    <div className="flex justify-between items-end border-b-4 border-slate-800 pb-4 mb-6">
                        <div>
                            <div className="text-4xl font-black tracking-tighter uppercase">Relatório 8D / Contramedida</div>
                            <div className="text-lg font-bold text-slate-600 mt-1 uppercase">Resolvido através de Metodologia Lean</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nº Registo Oficial</div>
                            <div className="text-2xl font-black text-rose-700">{selectedAction?.hst_ocorrencias?.tipo_ocorrencia || 'Ação'}</div>
                        </div>
                    </div>

                    {/* D1: EQUIPA E CONTEXTO */}
                    <div className="grid grid-cols-4 gap-4 mb-6 border border-slate-300 rounded p-4 bg-slate-50">
                        <div><strong className="text-[10px] uppercase text-slate-500 block mb-1">Data de Extração:</strong><div className="font-bold text-sm">{new Date().toLocaleDateString('pt-PT')}</div></div>
                        <div><strong className="text-[10px] uppercase text-slate-500 block mb-1">Status do Kanban:</strong><div className="font-bold text-sm uppercase">{selectedAction?.status}</div></div>
                        <div><strong className="text-[10px] uppercase text-slate-500 block mb-1">Equipa de Trabalho (D1):</strong><div className="font-bold text-sm">{equipa || 'Não definido'}</div></div>
                        <div><strong className="text-[10px] uppercase text-slate-500 block mb-1">Gravidade Identificada:</strong><div className="font-bold text-sm uppercase">{selectedAction?.prioridade || 'Média'}</div></div>
                    </div>

                    <div className="flex gap-6 items-start">
                        {/* COLUNA ESQUERDA (2/3) */}
                        <div className="w-2/3 space-y-6">
                            {/* D2: DESCRIÇÃO DO PROBLEMA */}
                            <div className="border border-slate-300 rounded overflow-hidden">
                                <div className="bg-slate-100 font-bold px-4 py-2 text-xs uppercase tracking-widest border-b border-slate-300">
                                    D2: Definição e Descrição do Defeito (Base)
                                </div>
                                <div className="p-4 text-sm font-medium whitespace-pre-wrap leading-relaxed">
                                    {selectedAction?.descricao_acao}
                                    {selectedAction?.hst_ocorrencias?.areas_fabrica?.nome_area && (
                                        <p className="mt-4 pt-4 border-t border-slate-200 text-xs font-bold">Contexto/Localização: {selectedAction.hst_ocorrencias.areas_fabrica.nome_area}</p>
                                    )}
                                </div>
                            </div>

                            {/* D4: ANÁLISE CAUSA RAIZ (5WHY / ISHIKAWA) */}
                            <div className="border border-slate-300 rounded overflow-hidden">
                                <div className="bg-slate-100 font-bold px-4 py-2 text-xs uppercase tracking-widest border-b border-slate-300">
                                    D4: Causa Raiz / Investigação ({tipoAnalise})
                                </div>
                                <div className="p-4 text-sm">
                                    {tipoAnalise === '5-Whys' ? (
                                        whys.some(w => w.trim() !== '') ? (
                                            <ul className="space-y-2">
                                                {whys.map((why, idx) => why && (
                                                    <li key={idx} className="flex gap-3">
                                                        <span className="font-black text-rose-600 shrink-0">W{idx+1}.</span> 
                                                        <span className="font-medium">{why}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-slate-400 italic">Pesquisa de causa raiz não documentada.</span>
                                        )
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { key: 'man', label: 'Mão-de-Obra' },
                                                { key: 'machine', label: 'Máquina' },
                                                { key: 'material', label: 'Material' },
                                                { key: 'method', label: 'Método' },
                                                { key: 'measurement', label: 'Medida' },
                                                { key: 'environment', label: 'Ambiente' }
                                            ].map(cat => (ishikawa as any)[cat.key] ? (
                                                <div key={cat.key} className="bg-slate-50 p-2 rounded border border-slate-200">
                                                    <div className="text-[10px] font-bold uppercase text-indigo-700 mb-1">{cat.label}</div>
                                                    <div className="text-xs">{((ishikawa as any)[cat.key])}</div>
                                                </div>
                                            ) : null)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* D5: PLANO DE AÇÃO */}
                            <div className="border border-slate-300 rounded overflow-hidden">
                                <div className="bg-slate-100 font-bold px-4 py-2 text-xs uppercase tracking-widest border-b border-slate-300">
                                    D5/D6: Plano de Contramedida (Ações Permanentes 5W2H)
                                </div>
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2 font-bold uppercase">O que Fazer? (Definição da Ação)</th>
                                            <th className="px-4 py-2 font-bold uppercase">Quem?</th>
                                            <th className="px-4 py-2 font-bold uppercase">Até Quando?</th>
                                            <th className="px-4 py-2 font-bold uppercase">Estado Fase</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {tasks5w.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-4 text-center text-slate-400 italic">Nenhuma ação planeada na plataforma.</td>
                                            </tr>
                                        ) : (
                                            tasks5w.map((t, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2 font-medium">{t.o_que}</td>
                                                    <td className="px-4 py-2">{t.quem}</td>
                                                    <td className="px-4 py-2 font-mono text-[10px]">{t.quando}</td>
                                                    <td className="px-4 py-2 font-bold uppercase">{t.status}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* COLUNA DIREITA (1/3) */}
                        <div className="w-1/3 space-y-6">
                            {/* D8: VALIDAÇÃO */}
                            <div className="border border-slate-300 rounded overflow-hidden">
                                <div className="bg-slate-100 font-bold px-4 py-2 text-xs uppercase tracking-widest border-b border-slate-300">
                                    D8: Indicadores e Verificação de Sucesso
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="text-xs font-bold text-slate-500 uppercase">Indicadores a Acompanhar:</div>
                                    <div className="text-sm font-medium whitespace-pre-wrap">{indicadores || 'N/A'}</div>
                                    
                                    <div className="border-t border-slate-200 pt-4 mt-2">
                                        <div className="text-xs font-bold text-slate-500 uppercase mb-2">Veredícto de Eficácia do Comitê:</div>
                                        <div className={`font-black text-lg uppercase tracking-wider py-2 px-4 inline-block rounded-lg border-2 ${validacao === 'Eficaz' ? 'border-emerald-500 text-emerald-700' : validacao === 'Ineficaz' ? 'border-rose-500 text-rose-700' : 'border-amber-400 text-amber-700'}`}>
                                            {validacao === 'Eficaz' ? 'PADRÃO EFICAZ (FECHADO)' : validacao === 'Ineficaz' ? 'INEFICAZ (REPENSAR)' : 'EM OBSERVAÇÃO'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ANEXOS / PROVAS */}
                            {selectedAction?.anexos_url && selectedAction.anexos_url.length > 5 && (
                                <div className="border border-slate-300 rounded overflow-hidden">
                                    <div className="bg-slate-100 font-bold px-4 py-2 text-xs uppercase tracking-widest border-b border-slate-300">
                                        Provas de Defeito Documentadas
                                    </div>
                                    <div className="p-4 flex flex-col gap-4">
                                        {(() => {
                                            try {
                                                const urls = JSON.parse(selectedAction.anexos_url);
                                                if (Array.isArray(urls)) {
                                                    return urls.map((url: string, index: number) => url ? (
                                                        <div key={index} className="border border-slate-200 p-1 bg-white rounded">
                                                            <img src={url} alt={`Prova ${index + 1}`} className="w-full h-auto max-h-[160px] object-cover" />
                                                        </div>
                                                    ) : null);
                                                }
                                            } catch(e) {}
                                            return null;
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* ASSINATURAS */}
                    <div className="grid grid-cols-2 gap-12 mt-12 pt-6 border-t-2 border-slate-200">
                        <div className="border-t border-black text-center pt-2 text-xs font-bold uppercase text-slate-600">Assinatura Equipa Resolução</div>
                        <div className="border-t border-black text-center pt-2 text-xs font-bold uppercase text-slate-600">Revisão por Assuntos de Qualidade</div>
                    </div>
                </div>
            )}
        </div>
    );
}

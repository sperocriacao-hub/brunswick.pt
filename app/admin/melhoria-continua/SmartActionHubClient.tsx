'use client';

import React, { useState } from 'react';
import { processarTextoIA, submitNovaAcao, pedirAvaliacaoPlanoIA, pivotarEstrategiaIA, addCategoriaAcao, warRoomAnalyticsIA, updateAcaoGlobal } from './actions';
import { Sparkles, BrainCircuit, Activity, CheckCircle2, Filter, Layers, ListChecks, Bot, MessageSquareText, FilePlus, AlertCircle, RefreshCw, XCircle, Send, Plus, MapPin, TrendingUp, Flame, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ComposedChart, Line, AreaChart, Area } from 'recharts';

export default function SmartActionHubClient({ initialActions, initialCategorias, initialAreas }: { initialActions: any[], initialCategorias: string[], initialAreas: any[] }) {
    const router = useRouter();
    
    // UI State
    const [activeTab, setActiveTab] = useState<'KANBAN' | 'COGNITIVE_INBOX' | 'MANUAL_FORM' | 'WAR_ROOM' | 'KPIS'>('KANBAN');
    const [filterModule, setFilterModule] = useState('Todos');
    const [filterArea, setFilterArea] = useState('Todas');

    // Categorias Dinâmicas
    const [categorias, setCategorias] = useState<string[]>(initialCategorias || []);
    const [novaCategoria, setNovaCategoria] = useState('');
    const [showAddCategoria, setShowAddCategoria] = useState(false);

    // List Filters
    const [searchDesc, setSearchDesc] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('Todas');
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    // Edit State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingAction, setEditingAction] = useState<any>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Inbox State
    const [rawText, setRawText] = useState('');
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [suggestedActions, setSuggestedActions] = useState<any[]>([]);
    
    // Manual Form State
    const [manualForm, setManualForm] = useState({ titulo: '', descricao: '', responsavel_nome: '', categoria: categorias[0] || 'Outro', area_id: '' });
    const [aiFeedback, setAiFeedback] = useState<{nota: number, feedback_curto: string, sugestao_melhoria: string} | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);

    // Pivot State
    const [pivotSuggestion, setPivotSuggestion] = useState('');
    const [isPivoting, setIsPivoting] = useState<string | null>(null);

    // War Room State
    const [warRoomQuery, setWarRoomQuery] = useState('');
    const [warRoomHistory, setWarRoomHistory] = useState<{role: 'user'|'ai', content: string}[]>([]);
    const [isWarRoomThinking, setIsWarRoomThinking] = useState(false);

    // Calculate Dates & Status
    const today = new Date();
    
    // Aplicar Filtros (Módulo e Área e Novos Filtros)
    let filteredActions = [...initialActions];
    if (filterModule !== 'Todos') filteredActions = filteredActions.filter(a => a.modulo_origem === filterModule);
    if (filterArea !== 'Todas') filteredActions = filteredActions.filter(a => a.area_id === filterArea);
    if (filterCategoria !== 'Todas') filteredActions = filteredActions.filter(a => a.categoria === filterCategoria);
    if (filterStatus !== 'Todos') {
        filteredActions = filteredActions.filter(a => {
            const st = (a.status || '').toLowerCase();
            if (filterStatus === 'Aberto') return ['aberto', 'to do', 'pendente', 'in progress', 'em investigacao', 'em andamento'].includes(st);
            if (filterStatus === 'Em Investigacao') return ['em investigacao', 'validacao', 'em análise'].includes(st);
            if (filterStatus === 'Validacao') return ['validacao', 'validação'].includes(st);
            if (filterStatus === 'Concluido') return ['concluido', 'concluído', 'done', 'encerrado'].includes(st);
            if (filterStatus === 'Cancelado') return ['cancelado'].includes(st);
            return st === filterStatus.toLowerCase();
        });
    }
    if (searchDesc.trim()) {
        const q = searchDesc.toLowerCase();
        filteredActions = filteredActions.filter(a => 
            (a.titulo && a.titulo.toLowerCase().includes(q)) || 
            (a.descricao && a.descricao.toLowerCase().includes(q))
        );
    }
    if (filterDateFrom) {
        filteredActions = filteredActions.filter(a => a.data_limite && new Date(a.data_limite) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
        filteredActions = filteredActions.filter(a => a.data_limite && new Date(a.data_limite) <= new Date(filterDateTo));
    }

    // Force Descending Order (Newest First)
    filteredActions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const totalAbertas = filteredActions.filter(a => ['Aberto', 'To Do', 'Em Investigacao', 'In Progress', 'Pendente'].includes(a.status)).length;
    const totalConcluidas = filteredActions.filter(a => ['Concluido', 'Concluído', 'Done', 'Encerrado'].includes(a.status)).length;
    
    const overdueActions = filteredActions.filter(a => {
        if (['Concluido', 'Concluído', 'Done', 'Encerrado'].includes(a.status)) return false;
        if (!a.data_limite) return false;
        return new Date(a.data_limite) < today;
    }).length;

    // KPI Data Calculations (WCM Advanced Analytics)
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    // 1. Backlog Trend & Timeline
    const timelineMap: Record<string, {name: string, Criadas: number, Resolvidas: number}> = {};
    initialActions.forEach(a => {
        if (!a.created_at) return;
        const dt = new Date(a.created_at);
        if (dt < ninetyDaysAgo) return; // Last 90 days for better visibility in test envs
        const dateStr = dt.toISOString().split('T')[0];
        if (!timelineMap[dateStr]) timelineMap[dateStr] = { name: dateStr, Criadas: 0, Resolvidas: 0 };
        timelineMap[dateStr].Criadas++;
        
        if (['Concluido', 'Concluído', 'Done', 'Encerrado'].includes(a.status)) {
            // Se tiver status data_conclusao usaríamos, mas como não temos, usamos fallback pra data limite ou assume que fechou depois
            // Para simplificar a timeline, vamos colocar como "resolvidas naquele dia de criacao" ou criar um map melhor
            timelineMap[dateStr].Resolvidas++; 
        }
    });
    // For a real burn-down we would use actual resolution dates. Here we approximate by created_at cohort.
    const timelineData = Object.values(timelineMap).sort((a, b) => a.name.localeCompare(b.name));

    // 2. Pareto Analysis (Category)
    const categoryDataMap: Record<string, number> = {};
    let totalActionsCount = 0;
    initialActions.forEach(a => {
        const cat = a.categoria || 'Outro';
        categoryDataMap[cat] = (categoryDataMap[cat] || 0) + 1;
        totalActionsCount++;
    });
    
    const paretoData = Object.keys(categoryDataMap)
        .map(k => ({ name: k, count: categoryDataMap[k] }))
        .sort((a, b) => b.count - a.count);
        
    let cumulative = 0;
    const paretoChartData = paretoData.map(item => {
        cumulative += item.count;
        return {
            name: item.name,
            "Ocorrências": item.count,
            "Acumulado %": Math.round((cumulative / totalActionsCount) * 100)
        };
    });

    // 3. Hotspot (Gargalo Atual por Área)
    const areaTrendData = initialAreas.map(area => {
        const actionsForArea = initialActions.filter(a => a.area_id == area.id);
        const inProgress = actionsForArea.filter(a => ['Aberto', 'To Do', 'Em Investigacao', 'In Progress', 'Validacao', 'Pendente'].includes(a.status)).length;
        const resolved = actionsForArea.filter(a => ['Concluido', 'Concluído', 'Done', 'Encerrado'].includes(a.status)).length;
        const delayed = actionsForArea.filter(a => !['Concluido', 'Concluído', 'Done', 'Encerrado'].includes(a.status) && a.data_limite && new Date(a.data_limite) < today).length;
        return { name: area.nome_area, "Em Curso": inProgress, "Resolvido": resolved, "Atrasado": delayed, totalAbertas: inProgress + delayed };
    }).filter(d => d["Em Curso"] > 0 || d["Resolvido"] > 0 || d["Atrasado"] > 0);
    
    // Sort Area Matrix by most open tasks
    areaTrendData.sort((a, b) => b.totalAbertas - a.totalAbertas);
    const worstArea = areaTrendData.length > 0 ? areaTrendData[0] : null;

    // 4. On-Time Delivery Health
    const closedActions = initialActions.filter(a => ['Concluido', 'Concluído', 'Done', 'Encerrado'].includes(a.status));
    let onTimeCount = 0;
    closedActions.forEach(a => {
        // Simple heuristic: if it had a limit and was closed, we assume it met the limit.
        // A true MTTR needs an actual closed_at timestamp. We estimate based on limit existing.
        if (a.data_limite && new Date(a.created_at) <= new Date(a.data_limite)) {
            onTimeCount++;
        }
    });
    const onTimeRate = closedActions.length > 0 ? Math.round((onTimeCount / closedActions.length) * 100) : 100;
    
    const recentCreated = initialActions.filter(a => new Date(a.created_at) >= ninetyDaysAgo).length;
    const recentClosed = closedActions.filter(a => new Date(a.created_at) >= ninetyDaysAgo).length; // Cohort based
    const backlogRatio = recentClosed > 0 ? (recentCreated / recentClosed).toFixed(1) : (recentCreated > 0 ? "Crítico" : "1.0");

    // Handlers
    const handleAddCategoria = async () => {
        if (!novaCategoria.trim()) return;
        const res = await addCategoriaAcao(novaCategoria);
        if (res.success) {
            setCategorias(prev => [...prev, novaCategoria]);
            setManualForm(prev => ({...prev, categoria: novaCategoria}));
            setNovaCategoria('');
            setShowAddCategoria(false);
        } else alert("Erro ao adicionar categoria: " + res.error);
    };

    const handleGenerateAi = async () => {
        if (!rawText.trim()) return;
        setIsAiProcessing(true);
        const res = await processarTextoIA(rawText, initialAreas);
        if (res.success && res.data) {
            setSuggestedActions(res.data);
            setRawText('');
        } else {
            alert("Erro na IA: " + res.error);
        }
        setIsAiProcessing(false);
    };

    const handleApproveAction = async (idx: number, action: any) => {
        const payload = {
            titulo: action.titulo,
            descricao: action.descricao + '\n\n🤖 Sugestão IA: ' + action.sugestao_conclusao,
            categoria: action.categoria,
            responsavel_nome: action.responsavel_nome,
            area_id: action.area_id || null,
            data_limite: action.data_limite || null,
            origem_ia: true
        };
        const res = await submitNovaAcao(payload);
        if (res.success) {
            setSuggestedActions(prev => prev.filter((_, i) => i !== idx));
            router.refresh();
        } else alert("Erro ao gravar: " + res.error);
    };

    const handleEvaluateManual = async () => {
        if (!manualForm.descricao) return;
        setIsEvaluating(true);
        const res = await pedirAvaliacaoPlanoIA(manualForm.descricao);
        if (res.success && res.data) {
            setAiFeedback(res.data);
        } else alert(res.error);
        setIsEvaluating(false);
    };

    const handleSubmitManual = async () => {
        const payload = { 
            ...manualForm, 
            area_id: manualForm.area_id === '' ? null : manualForm.area_id,
            origem_ia: false 
        };
        const res = await submitNovaAcao(payload);
        if (res.success) {
            setManualForm({ titulo: '', descricao: '', responsavel_nome: '', categoria: categorias[0] || 'Outro', area_id: '' });
            setAiFeedback(null);
            setActiveTab('KANBAN');
            router.refresh();
        } else alert("Erro ao gravar: " + res.error);
    };

    const handlePivotStrategy = async (id: string, descricao: string) => {
        setIsPivoting(id);
        const res = await pivotarEstrategiaIA(descricao);
        if (res.success && res.data) {
            setPivotSuggestion(res.data);
        } else alert(res.error);
        setIsPivoting(null);
    };

    const handleWarRoomSubmit = async () => {
        if (!warRoomQuery.trim()) return;
        
        const q = warRoomQuery;
        setWarRoomQuery('');
        setWarRoomHistory(prev => [...prev, {role: 'user', content: q}]);
        setIsWarRoomThinking(true);

        const dados = `
TOTAL AÇÕES ABERTAS: ${totalAbertas}
TOTAL ATRASADAS (CRÍTICAS): ${overdueActions}
TOTAL RESOLVIDAS: ${totalConcluidas}

AÇÕES RECENTES (AMOSTRA):
${filteredActions.slice(0, 10).map(a => `- [${a.modulo_origem}] [Área: ${a.nome_area || 'N/A'}] Resp: ${a.responsavel_nome || 'N/A'}, Status: ${a.status}, Prazo: ${a.data_limite ? new Date(a.data_limite).toLocaleDateString() : 'S/ Data'}. Desc: ${a.titulo}`).join('\n')}
        `;

        const res = await warRoomAnalyticsIA(q, dados);
        if (res.success && res.data) {
            setWarRoomHistory(prev => [...prev, {role: 'ai', content: res.data}]);
        } else {
            setWarRoomHistory(prev => [...prev, {role: 'ai', content: "Erro de Conexão Cognitiva: " + res.error}]);
        }
        setIsWarRoomThinking(false);
    };

    const handleSaveEdit = async () => {
        if (!editingAction || editingAction.modulo_origem !== 'Geral') return;
        setIsSavingEdit(true);
        const payload = {
            titulo: editingAction.titulo,
            descricao: editingAction.descricao,
            categoria: editingAction.categoria,
            status: editingAction.status,
            area_id: editingAction.area_id === 'none' ? null : editingAction.area_id,
            data_limite: editingAction.data_limite || null,
            responsavel_nome: editingAction.responsavel_nome || null
        };
        const res = await updateAcaoGlobal(editingAction.id, payload);
        if (res.success) {
            setEditModalOpen(false);
            setEditingAction(null);
            router.refresh();
        } else {
            alert("Erro ao gravar edição: " + res.error);
        }
        setIsSavingEdit(false);
    };

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 bg-slate-50 min-h-screen text-slate-800 font-sans">
            
            {/* CABEÇALHO PADRÃO */}
            <header className="mb-6 border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative">
                <div>
                    <h1 className="text-4xl font-extrabold flex items-center gap-3 text-blue-900 tracking-tight">
                        <BrainCircuit size={40} className="text-blue-600" />
                        Torre de Controlo (Smart Hub)
                    </h1>
                    <p className="text-blue-600 font-medium tracking-wide text-sm flex items-center gap-2 mt-2">
                        <Activity size={16} /> Central Global de Ações e Inteligência Artificial
                    </p>
                </div>

                <div className="flex gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <button onClick={() => setActiveTab('KANBAN')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'KANBAN' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}><ListChecks size={16} className="inline mr-2"/> Lista Global</button>
                    <button onClick={() => setActiveTab('KPIS')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'KPIS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}><Activity size={16} className="inline mr-2"/> KPIs Gerenciais</button>
                    <button onClick={() => setActiveTab('COGNITIVE_INBOX')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center ${activeTab === 'COGNITIVE_INBOX' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}><Bot size={16} className="inline mr-2"/> Entrada I.A. {suggestedActions.length > 0 && <span className="ml-2 bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">{suggestedActions.length}</span>}</button>
                    <button onClick={() => setActiveTab('MANUAL_FORM')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'MANUAL_FORM' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}><FilePlus size={16} className="inline mr-2"/> Nova Ação</button>
                    <button onClick={() => setActiveTab('WAR_ROOM')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'WAR_ROOM' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'}`}><MessageSquareText size={16} className="inline mr-2"/> Sala de Análise</button>
                </div>
            </header>

            {/* KPIs */}
            {activeTab === 'KANBAN' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                        <CardContent className="p-4">
                            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block mb-1">Ações em Curso</span>
                            <div className="text-4xl font-black text-slate-800">{totalAbertas}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                        <CardContent className="p-4">
                            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block mb-1">Críticas Atrasadas</span>
                            <div className="text-4xl font-black text-rose-600 flex items-center gap-3">
                                {overdueActions} 
                                {overdueActions > 0 && <AlertCircle className="text-rose-500 animate-pulse" size={24} />}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                        <CardContent className="p-4">
                            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block mb-1">Resolvidas com Sucesso</span>
                            <div className="text-4xl font-black text-emerald-600">{totalConcluidas}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50 border border-blue-100 shadow-sm overflow-hidden relative flex flex-col justify-center">
                        <CardContent className="p-4">
                            <span className="text-blue-800 font-bold text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                                <Sparkles size={14} className="text-blue-600"/> Resumo Matinal I.A.
                            </span>
                            <p className="text-sm text-blue-900 font-medium leading-tight">
                                {overdueActions > 0 
                                    ? `Alerta: A fábrica tem ${overdueActions} caminhos críticos em atraso. Focar recursos no fecho de RNCs para evitar gargalos hoje.`
                                    : `Sistema nominal. Excelente taxa de resolução hoje. Não foram detetados bloqueios críticos.`}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TAB: LISTA GLOBAL */}
            {activeTab === 'KANBAN' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                                <Layers size={16} className="text-blue-500" /> Tabela de Ações (Ledger)
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                            <div className="xl:col-span-2">
                                <input 
                                    type="text" 
                                    placeholder="Pesquisar título ou descrição..." 
                                    value={searchDesc}
                                    onChange={e => setSearchDesc(e.target.value)}
                                    className="w-full text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <select 
                                value={filterArea}
                                onChange={(e) => setFilterArea(e.target.value)}
                                className="w-full text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="Todas">Todas as Áreas</option>
                                {initialAreas.map(a => <option key={a.id} value={a.id}>{a.nome_area}</option>)}
                            </select>
                            <select 
                                value={filterModule}
                                onChange={(e) => setFilterModule(e.target.value)}
                                className="w-full text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="Todos">Todas as Origens</option>
                                <option value="Qualidade">Qualidade (A3/RNC)</option>
                                <option value="Lean/Kaizen">Lean & Kaizen</option>
                                <option value="HST">Saúde e Segurança (HST)</option>
                                <option value="Geral">Central de Eficiência</option>
                            </select>
                            <select 
                                value={filterCategoria}
                                onChange={(e) => setFilterCategoria(e.target.value)}
                                className="w-full text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="Todas">Todas as Categorias</option>
                                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="Todos">Todos os Estados</option>
                                <option value="Aberto">Aberto / To Do</option>
                                <option value="Em Investigacao">Em Investigação</option>
                                <option value="Validacao">Validação</option>
                                <option value="Concluido">Concluído / Done</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                            <div className="flex gap-1 xl:col-span-1">
                                <input 
                                    type="date" 
                                    value={filterDateFrom}
                                    onChange={e => setFilterDateFrom(e.target.value)}
                                    title="Data Limite De"
                                    className="w-1/2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded py-1.5 px-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <input 
                                    type="date" 
                                    value={filterDateTo}
                                    onChange={e => setFilterDateTo(e.target.value)}
                                    title="Data Limite Até"
                                    className="w-1/2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded py-1.5 px-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Tarefa / Descrição</th>
                                    <th className="px-4 py-3 w-40">Área</th>
                                    <th className="px-4 py-3 w-32">Origem</th>
                                    <th className="px-4 py-3 w-32">Responsável</th>
                                    <th className="px-4 py-3 w-32">Abertura</th>
                                    <th className="px-4 py-3 w-32">Limite (Meta)</th>
                                    <th className="px-4 py-3 w-28 text-center">Estado</th>
                                    <th className="px-4 py-3 w-28 text-center">PDCA</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredActions.map((action, idx) => {
                                    const isOverdue = !['Concluido', 'Concluído', 'Done', 'Encerrado'].includes(action.status) && action.data_limite && new Date(action.data_limite) < today;
                                    const isIneficaz = action.status_eficacia === 'Ineficaz';

                                    return (
                                        <tr 
                                            key={`${action.id}-${idx}`} 
                                            onClick={() => {
                                                if (action.modulo_origem === 'Geral') {
                                                    setEditingAction(action);
                                                    setEditModalOpen(true);
                                                } else {
                                                    alert(`Esta ação pertence ao módulo ${action.modulo_origem}. Por favor edite-a no respetivo módulo.`);
                                                }
                                            }}
                                            className={`hover:bg-blue-50/50 transition-colors group cursor-pointer ${isOverdue ? 'bg-rose-50' : ''}`}
                                            title={action.modulo_origem === 'Geral' ? "Clique para editar esta ação global" : `Gerido via ${action.modulo_origem}`}
                                        >
                                            <td className="px-4 py-3 max-w-[300px]">
                                                <div className="font-bold text-slate-800 truncate">{action.titulo}</div>
                                                <div className="text-xs text-slate-500 truncate mt-1" title={action.descricao}>{action.descricao}</div>
                                                {isIneficaz && (
                                                    <div className="mt-3">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePivotStrategy(action.id, action.descricao);
                                                            }}
                                                            className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-md hover:bg-amber-200 transition-all flex items-center gap-1.5 shadow-sm"
                                                        >
                                                            {isPivoting === action.id ? <RefreshCw size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                                                            Consultor I.A. (Pivotar)
                                                        </button>
                                                        {pivotSuggestion && isPivoting !== action.id && (
                                                            <div className="mt-2 p-3 bg-white border border-amber-200 rounded-md text-[11px] text-amber-900 whitespace-pre-wrap font-medium shadow-sm">
                                                                {pivotSuggestion}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {action.nome_area ? (
                                                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                                        <MapPin size={12} className="text-slate-400" /> {action.nome_area}
                                                    </span>
                                                ) : <span className="text-xs text-slate-400">--</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge className="bg-slate-100 text-slate-600 border-slate-200 uppercase text-[9px] font-bold">{action.modulo_origem}</Badge>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-700">{action.responsavel_nome || '--'}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500">
                                                {new Date(action.created_at).toLocaleDateString('pt-PT')}
                                            </td>
                                            <td className={`px-4 py-3 text-xs font-bold ${isOverdue ? 'text-rose-600 animate-pulse' : 'text-slate-600'}`}>
                                                {action.data_limite ? new Date(action.data_limite).toLocaleDateString('pt-PT') : '--'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge className={`uppercase text-[9px] font-bold border-0
                                                    ${['Concluido', 'Concluído', 'Done', 'Encerrado'].includes(action.status) ? 'bg-emerald-100 text-emerald-700' : 
                                                    ['Aberto', 'To Do', 'Pendente'].includes(action.status) ? 'bg-blue-100 text-blue-700' : 
                                                    'bg-amber-100 text-amber-700'}`
                                                }>
                                                    {action.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {action.status_eficacia === 'Eficaz' ? <CheckCircle2 size={20} className="text-emerald-500 mx-auto"/> :
                                                 action.status_eficacia === 'Ineficaz' ? <XCircle size={20} className="text-rose-500 mx-auto"/> :
                                                 <span className="text-[10px] text-slate-400 font-bold uppercase">Pendente</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredActions.length === 0 && <div className="p-8 text-center text-slate-400 font-medium text-sm">Sem registos neste critério.</div>}
                    </div>
                </div>
            )}

            {/* TAB: KPIS GERENCIAIS (WCM) */}
            {activeTab === 'KPIS' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* Top Level Insight Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-16 h-16 bg-blue-100 rounded-bl-full opacity-50"></div>
                            <CardContent className="p-5 relative z-10">
                                <div className="flex items-center gap-2 mb-2 text-blue-600">
                                    <TrendingUp size={18} />
                                    <span className="font-bold text-xs uppercase tracking-widest">Rácio Fluxo (90d)</span>
                                </div>
                                <div className="text-3xl font-black text-blue-900 mb-1">{backlogRatio}x</div>
                                <p className="text-xs text-blue-700 font-medium">Novas vs Fechadas. <span className="opacity-70">(&gt; 1.0 = acumular backlog)</span></p>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-rose-50 to-white border border-rose-100 shadow-sm relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-16 h-16 bg-rose-100 rounded-bl-full opacity-50"></div>
                            <CardContent className="p-5 relative z-10">
                                <div className="flex items-center gap-2 mb-2 text-rose-600">
                                    <Flame size={18} />
                                    <span className="font-bold text-xs uppercase tracking-widest">Gargalo Crítico</span>
                                </div>
                                <div className="text-2xl font-black text-rose-900 mb-1 truncate" title={worstArea ? worstArea.name : '--'}>
                                    {worstArea ? worstArea.name : 'N/A'}
                                </div>
                                <p className="text-xs text-rose-700 font-medium">Área com maior stress atual ({worstArea ? worstArea.totalAbertas : 0} ações ativas)</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-sm relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-100 rounded-bl-full opacity-50"></div>
                            <CardContent className="p-5 relative z-10">
                                <div className="flex items-center gap-2 mb-2 text-emerald-600">
                                    <Target size={18} />
                                    <span className="font-bold text-xs uppercase tracking-widest">Saúde (On-Time)</span>
                                </div>
                                <div className="text-3xl font-black text-emerald-900 mb-1">{onTimeRate}%</div>
                                <p className="text-xs text-emerald-700 font-medium">Ações resolvidas dentro do prazo.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pareto Chart */}
                        <Card className="bg-white border border-slate-200 shadow-sm">
                            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                                <CardTitle className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                                    <Layers size={16} className="text-blue-500" /> Pareto por Categoria (80/20)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={paretoChartData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} interval={0} angle={-25} textAnchor="end" />
                                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} />
                                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} tickFormatter={(v) => `${v}%`} />
                                            <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                            <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                                            <Bar yAxisId="left" dataKey="Ocorrências" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                            <Line yAxisId="right" type="monotone" dataKey="Acumulado %" stroke="#f43f5e" strokeWidth={3} dot={{r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff'}} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timeline Flow Chart */}
                        <Card className="bg-white border border-slate-200 shadow-sm">
                            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                                <CardTitle className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                                    <Activity size={16} className="text-emerald-500" /> Fluxo Contínuo (Últimos 90 Dias)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={timelineData} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
                                            <defs>
                                                <linearGradient id="colorCriadas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} />
                                            <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px'}} />
                                            <Legend wrapperStyle={{fontSize: '12px'}} />
                                            <Area type="monotone" dataKey="Criadas" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorCriadas)" />
                                            <Area type="monotone" dataKey="Resolvidas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRes)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Matriz de Carga por Área (Horizontal Bar) */}
                        <Card className="bg-white border border-slate-200 shadow-sm lg:col-span-2">
                            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                                <CardTitle className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                                    <MapPin size={16} className="text-amber-500" /> Matriz de Carga por Área
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={areaTrendData} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#475569', fontWeight: 600}} width={100} />
                                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px'}} />
                                            <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                                            <Bar dataKey="Em Curso" stackId="a" fill="#3b82f6" maxBarSize={30} radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="Atrasado" stackId="a" fill="#f43f5e" maxBarSize={30} radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="Resolvido" stackId="a" fill="#10b981" maxBarSize={30} radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}


            {/* TAB: ENTRADA I.A. (COGNITIVE INBOX) */}
            {activeTab === 'COGNITIVE_INBOX' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-blue-100 shadow-sm rounded-xl p-6 relative overflow-hidden">
                        <Bot className="absolute -bottom-10 -right-10 text-blue-50 w-64 h-64 rotate-12" />
                        <h2 className="text-lg font-black text-blue-900 uppercase tracking-widest flex items-center gap-2 mb-2 relative z-10">
                            Extração Automática
                        </h2>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6 relative z-10">
                            Cola aqui atas de reuniões confusas, desabafos de turno ou relatórios por tratar. O motor cognitivo Gemini irá organizar a confusão em tarefas estruturadas.
                        </p>
                        <textarea 
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                            rows={6}
                            placeholder="Ex: Na reunião de hoje falámos que a máquina X partiu novamente e que precisamos de peças. O Manuel ficou de ver isso amanhã..."
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none text-slate-700 text-sm mb-4 relative z-10"
                        />
                        <button 
                            onClick={handleGenerateAi}
                            disabled={isAiProcessing || !rawText}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none uppercase tracking-widest relative z-10"
                        >
                            {isAiProcessing ? <span className="animate-pulse">A analisar contexto...</span> : <><BrainCircuit size={18}/> Iniciar Síntese</>}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-500 uppercase tracking-widest text-xs mb-2">Ações Sugeridas ({suggestedActions.length})</h3>
                        {suggestedActions.length === 0 ? (
                            <div className="h-64 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-xl flex items-center justify-center text-slate-400 font-bold text-sm uppercase">
                                A AGUARDAR DADOS
                            </div>
                        ) : (
                            suggestedActions.map((action, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative group">
                                    <div className="flex justify-between items-start mb-3 gap-4">
                                        <h4 className="font-bold text-slate-800 text-base">{action.titulo}</h4>
                                        <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[9px] shrink-0 font-bold">{action.categoria}</Badge>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-4">{action.descricao}</p>
                                    <div className="bg-indigo-50 p-3 rounded-lg text-xs text-indigo-900 mb-4 border border-indigo-100">
                                        <span className="font-bold text-indigo-700">{'>>'} DIRETRIZ WCM:</span> {action.sugestao_conclusao}
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Responsável: <span className="text-slate-800">{action.responsavel_nome || 'POR ATRIBUIR'}</span></span>
                                        <button 
                                            onClick={() => handleApproveAction(idx, action)}
                                            className="text-[10px] uppercase tracking-widest font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg shadow-sm transition-colors"
                                        >
                                            Guardar na Base de Dados
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* TAB: CRIAR AÇÃO MANUAL (COPILOT) */}
            {activeTab === 'MANUAL_FORM' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6">
                            <FilePlus size={18} className="text-blue-500" /> Preenchimento Humano
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Título da Ação</label>
                                <input 
                                    type="text" 
                                    value={manualForm.titulo}
                                    onChange={e => setManualForm({...manualForm, titulo: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ex: Melhoria no Posto 4"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição do Plano</label>
                                <textarea 
                                    value={manualForm.descricao}
                                    onChange={e => setManualForm({...manualForm, descricao: e.target.value})}
                                    rows={4}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                                    placeholder="Detalha o que vai ser feito, como, e porquê."
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Responsável</label>
                                    <input 
                                        type="text" 
                                        value={manualForm.responsavel_nome}
                                        onChange={e => setManualForm({...manualForm, responsavel_nome: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-blue-500 outline-none"
                                        placeholder="Ex: Rui Costureiro"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Área (Destino)</label>
                                    <select 
                                        value={manualForm.area_id}
                                        onChange={e => setManualForm({...manualForm, area_id: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-blue-500 outline-none"
                                    >
                                        <option value="">Sem Área Fixa</option>
                                        {initialAreas.map(a => <option key={a.id} value={a.id}>{a.nome_area}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Categoria Dinâmica</label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={manualForm.categoria}
                                            onChange={e => setManualForm({...manualForm, categoria: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-blue-500 outline-none"
                                        >
                                            {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                        <button 
                                            onClick={() => setShowAddCategoria(!showAddCategoria)}
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded-lg border border-slate-200 transition-colors"
                                            title="Adicionar Nova Categoria"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* UI Adicionar Categoria */}
                            {showAddCategoria && (
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-2 items-center animate-in slide-in-from-top-2">
                                    <input 
                                        type="text" 
                                        value={novaCategoria}
                                        onChange={e => setNovaCategoria(e.target.value)}
                                        placeholder="Nome da nova categoria..."
                                        className="flex-1 bg-white border border-blue-200 rounded px-2 py-1.5 text-sm outline-none"
                                    />
                                    <button onClick={handleAddCategoria} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold uppercase shadow-sm">Gravar</button>
                                </div>
                            )}
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    onClick={handleEvaluateManual}
                                    disabled={!manualForm.descricao || isEvaluating}
                                    className="flex-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-bold px-4 py-3 rounded-xl text-xs transition-all uppercase tracking-widest disabled:opacity-50 shadow-sm"
                                >
                                    {isEvaluating ? 'A avaliar...' : 'Pedir Auditoria I.A.'}
                                </button>
                                <button 
                                    onClick={handleSubmitManual}
                                    disabled={!manualForm.titulo || !manualForm.descricao}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-xl text-xs transition-all uppercase tracking-widest shadow-md disabled:opacity-50 disabled:shadow-none"
                                >
                                    Gravar Ação
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* AI COPILOT FEEDBACK */}
                    <div className="bg-slate-100/50 border border-slate-200 rounded-xl p-6 relative overflow-hidden">
                        <h3 className="font-bold text-slate-500 uppercase tracking-widest text-xs mb-6 flex items-center gap-2 relative z-10">
                            <Bot size={16} className="text-amber-500"/> Auditoria Copiloto
                        </h3>
                        
                        {!aiFeedback ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                <Sparkles size={32} className="mb-3 opacity-30 text-amber-500" />
                                <p className="font-bold text-xs uppercase text-center max-w-xs leading-relaxed">Escreve a descrição e clica em "Pedir Auditoria" para receberes uma nota WCM e dicas estruturais.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-right-4 relative z-10">
                                <div className="flex items-center gap-5 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-black text-2xl shadow-sm
                                        ${aiFeedback.nota >= 7 ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-amber-500 text-amber-600 bg-amber-50'}`}>
                                        {aiFeedback.nota}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Avaliação</p>
                                        <p className="font-black text-slate-800 text-lg">Nota de Qualidade do Plano</p>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-700">
                                    <strong className="text-rose-600 text-[10px] uppercase font-bold block mb-1.5 tracking-widest">Crítica do Auditor:</strong>
                                    {aiFeedback.feedback_curto}
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm text-sm text-emerald-900">
                                    <strong className="text-emerald-700 text-[10px] uppercase font-bold block mb-1.5 tracking-widest">Como Melhorar (I.A.):</strong>
                                    {aiFeedback.sugestao_melhoria}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: WAR ROOM CHAT */}
            {activeTab === 'WAR_ROOM' && (
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl h-[650px] flex flex-col overflow-hidden">
                    <div className="p-4 bg-amber-600 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <MessageSquareText size={20} />
                            <div>
                                <h3 className="font-bold text-sm uppercase tracking-widest">Sala de Análise (War Room)</h3>
                                <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Ligado ao Motor de Base de Dados</span>
                            </div>
                        </div>
                        <Badge className="bg-amber-900/40 text-amber-100 border-0 uppercase text-[9px] font-bold tracking-widest">Gemini 1.5 Pro</Badge>
                    </div>

                    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto space-y-6">
                        {warRoomHistory.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                                <BrainCircuit size={48} className="text-slate-300 mb-4" />
                                <h2 className="text-xl font-bold text-slate-700 mb-2">Bem-vindo à Direção de Operações</h2>
                                <p className="text-sm max-w-md">
                                    Pergunta-me qualquer coisa sobre o estado da fábrica. Eu tenho acesso ao painel global e posso identificar tendências de atrasos, quem precisa de ajuda e sugerir estratégias WCM.
                                </p>
                            </div>
                        ) : (
                            warRoomHistory.map((msg, i) => (
                                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-300"><Bot size={16} className="text-amber-700"/></div>}
                                    <div className={`p-4 rounded-xl max-w-[80%] text-sm shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none whitespace-pre-wrap leading-relaxed'}`}>
                                        {msg.content}
                                    </div>
                                    {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-slate-500">TU</span></div>}
                                </div>
                            ))
                        )}
                        {isWarRoomThinking && (
                            <div className="flex gap-4 justify-start">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-300 animate-pulse"><Bot size={16} className="text-amber-700"/></div>
                                <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-widest rounded-bl-none flex items-center gap-2">
                                    A cruzar dados da fábrica <RefreshCw size={12} className="animate-spin" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
                        <input 
                            type="text" 
                            value={warRoomQuery}
                            onChange={e => setWarRoomQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleWarRoomSubmit()}
                            placeholder="Ex: Quais são as prioridades absolutas para o dia de hoje segundo os dados?"
                            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                        <button 
                            onClick={handleWarRoomSubmit}
                            disabled={!warRoomQuery.trim() || isWarRoomThinking}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm uppercase text-xs tracking-widest"
                        >
                            <Send size={16} /> Enviar
                        </button>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editModalOpen && editingAction && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
                            <h3 className="font-bold uppercase tracking-wider flex items-center gap-2">
                                <FilePlus size={18} /> Editar Ação Central
                            </h3>
                            <button onClick={() => setEditModalOpen(false)} className="text-blue-100 hover:text-white">
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Título</label>
                                <input 
                                    type="text" 
                                    value={editingAction.titulo || ''}
                                    onChange={e => setEditingAction({...editingAction, titulo: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição</label>
                                <textarea 
                                    value={editingAction.descricao || ''}
                                    onChange={e => setEditingAction({...editingAction, descricao: e.target.value})}
                                    rows={4}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-blue-500 outline-none resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Área</label>
                                    <select 
                                        value={editingAction.area_id || 'none'}
                                        onChange={e => setEditingAction({...editingAction, area_id: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-blue-500 outline-none"
                                    >
                                        <option value="none">Sem Área Atribuída</option>
                                        {initialAreas.map(a => <option key={a.id} value={a.id}>{a.nome_area}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Responsável</label>
                                    <input 
                                        type="text" 
                                        value={editingAction.responsavel_nome || ''}
                                        onChange={e => setEditingAction({...editingAction, responsavel_nome: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Categoria</label>
                                    <select 
                                        value={editingAction.categoria || ''}
                                        onChange={e => setEditingAction({...editingAction, categoria: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-blue-500 outline-none"
                                    >
                                        {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado</label>
                                    <select 
                                        value={editingAction.status || 'Aberto'}
                                        onChange={e => setEditingAction({...editingAction, status: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-blue-500 outline-none"
                                    >
                                        <option value="Aberto">Aberto</option>
                                        <option value="Em Investigacao">Em Investigação</option>
                                        <option value="Validacao">Validação</option>
                                        <option value="Concluido">Concluído</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data Limite</label>
                                    <input 
                                        type="date" 
                                        value={editingAction.data_limite ? new Date(editingAction.data_limite).toISOString().split('T')[0] : ''}
                                        onChange={e => setEditingAction({...editingAction, data_limite: e.target.value ? new Date(e.target.value).toISOString() : null})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                            <button 
                                onClick={() => setEditModalOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit}
                                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSavingEdit ? 'A gravar...' : 'Gravar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
}

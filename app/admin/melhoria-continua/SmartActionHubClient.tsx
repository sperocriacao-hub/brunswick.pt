'use client';

import React, { useState } from 'react';
import { processarTextoIA, submitNovaAcao, pedirAvaliacaoPlanoIA, pivotarEstrategiaIA, addCategoriaAcao, warRoomAnalyticsIA } from './actions';
import { Sparkles, BrainCircuit, Activity, CheckCircle2, Filter, Layers, ListChecks, Bot, MessageSquareText, FilePlus, AlertCircle, RefreshCw, XCircle, Send, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function SmartActionHubClient({ initialActions, initialCategorias }: { initialActions: any[], initialCategorias: string[] }) {
    const router = useRouter();
    
    // UI State
    const [activeTab, setActiveTab] = useState<'KANBAN' | 'COGNITIVE_INBOX' | 'MANUAL_FORM' | 'WAR_ROOM'>('KANBAN');
    const [filterModule, setFilterModule] = useState('Todos');

    // Categorias Dinâmicas
    const [categorias, setCategorias] = useState<string[]>(initialCategorias || []);
    const [novaCategoria, setNovaCategoria] = useState('');
    const [showAddCategoria, setShowAddCategoria] = useState(false);

    // Inbox State
    const [rawText, setRawText] = useState('');
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [suggestedActions, setSuggestedActions] = useState<any[]>([]);
    
    // Manual Form State
    const [manualForm, setManualForm] = useState({ titulo: '', descricao: '', responsavel_nome: '', categoria: categorias[0] || 'Outro' });
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
    const filteredActions = filterModule === 'Todos' ? initialActions : initialActions.filter(a => a.modulo_origem === filterModule);
    const totalAbertas = filteredActions.filter(a => ['Aberto', 'To Do', 'Em Investigacao', 'In Progress'].includes(a.status)).length;
    const totalConcluidas = filteredActions.filter(a => ['Concluido', 'Done'].includes(a.status)).length;
    
    const overdueActions = filteredActions.filter(a => {
        if (['Concluido', 'Done'].includes(a.status)) return false;
        if (!a.data_limite) return false;
        return new Date(a.data_limite) < today;
    }).length;

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
        const res = await processarTextoIA(rawText);
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
        const payload = { ...manualForm, origem_ia: false };
        const res = await submitNovaAcao(payload);
        if (res.success) {
            setManualForm({ titulo: '', descricao: '', responsavel_nome: '', categoria: categorias[0] || 'Outro' });
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

        // Formatar o "Dashboard Text" para a IA analisar
        const dados = `
TOTAL AÇÕES ABERTAS: ${totalAbertas}
TOTAL ATRASADAS (CRÍTICAS): ${overdueActions}
TOTAL RESOLVIDAS: ${totalConcluidas}

AÇÕES RECENTES (AMOSTRA):
${filteredActions.slice(0, 10).map(a => `- [${a.modulo_origem}] Resp: ${a.responsavel_nome || 'N/A'}, Status: ${a.status}, Prazo: ${a.data_limite ? new Date(a.data_limite).toLocaleDateString() : 'S/ Data'}. Desc: ${a.titulo}`).join('\n')}
        `;

        const res = await warRoomAnalyticsIA(q, dados);
        if (res.success && res.data) {
            setWarRoomHistory(prev => [...prev, {role: 'ai', content: res.data}]);
        } else {
            setWarRoomHistory(prev => [...prev, {role: 'ai', content: "Erro de Conexão Cognitiva: " + res.error}]);
        }
        setIsWarRoomThinking(false);
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
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Layers size={16} className="text-blue-500" /> Tabela de Ações (Ledger)
                        </h3>
                        <div className="flex gap-2 items-center">
                            <Filter size={16} className="text-slate-400" />
                            <select 
                                value={filterModule}
                                onChange={(e) => setFilterModule(e.target.value)}
                                className="text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="Todos">Visão Global</option>
                                <option value="Qualidade">Qualidade (A3/RNC)</option>
                                <option value="Lean/Kaizen">Lean & Kaizen</option>
                                <option value="HST">Saúde e Segurança (HST)</option>
                                <option value="Geral">Central de Eficiência</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Tarefa / Descrição</th>
                                    <th className="px-4 py-3 w-32">Origem</th>
                                    <th className="px-4 py-3 w-32">Responsável</th>
                                    <th className="px-4 py-3 w-32">Abertura</th>
                                    <th className="px-4 py-3 w-32">Limite (Meta)</th>
                                    <th className="px-4 py-3 w-28 text-center">Estado</th>
                                    <th className="px-4 py-3 w-28 text-center">PDCA (Eficácia)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredActions.map(action => {
                                    const isOverdue = !['Concluido', 'Done'].includes(action.status) && action.data_limite && new Date(action.data_limite) < today;
                                    const isIneficaz = action.status_eficacia === 'Ineficaz';

                                    return (
                                        <tr key={action.id} className={`hover:bg-blue-50/50 transition-colors group ${isOverdue ? 'bg-rose-50' : ''}`}>
                                            <td className="px-4 py-3 max-w-md">
                                                <div className="font-bold text-slate-800 truncate">{action.titulo}</div>
                                                <div className="text-xs text-slate-500 truncate mt-1" title={action.descricao}>{action.descricao}</div>
                                                {isIneficaz && (
                                                    <div className="mt-3">
                                                        <button 
                                                            onClick={() => handlePivotStrategy(action.id, action.descricao)}
                                                            className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-md hover:bg-amber-200 transition-all flex items-center gap-1.5 shadow-sm"
                                                        >
                                                            {isPivoting === action.id ? <RefreshCw size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                                                            Consultor I.A. (Pivotar Solução)
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
                                                    ${['Concluido', 'Done'].includes(action.status) ? 'bg-emerald-100 text-emerald-700' : 
                                                    ['Aberto', 'To Do'].includes(action.status) ? 'bg-blue-100 text-blue-700' : 
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
                            <div className="grid grid-cols-2 gap-4">
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
            
        </div>
    );
}

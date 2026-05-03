'use client';

import React, { useState } from 'react';
import { processarTextoIA, submitNovaAcao, pedirAvaliacaoPlanoIA, pivotarEstrategiaIA } from './actions';
import { Sparkles, BrainCircuit, Activity, CheckCircle2, Filter, Layers, ListChecks, Bot, MessageSquareText, FilePlus, CalendarDays, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function SmartActionHubClient({ initialActions }: { initialActions: any[] }) {
    const router = useRouter();
    
    // UI State
    const [activeTab, setActiveTab] = useState<'KANBAN' | 'COGNITIVE_INBOX' | 'MANUAL_FORM' | 'WAR_ROOM'>('KANBAN');
    const [filterModule, setFilterModule] = useState('Todos');

    // Inbox State
    const [rawText, setRawText] = useState('');
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [suggestedActions, setSuggestedActions] = useState<any[]>([]);
    
    // Manual Form State
    const [manualForm, setManualForm] = useState({ titulo: '', descricao: '', responsavel_nome: '', categoria: 'Outro' });
    const [aiFeedback, setAiFeedback] = useState<{nota: number, feedback_curto: string, sugestao_melhoria: string} | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);

    // Pivot State
    const [pivotSuggestion, setPivotSuggestion] = useState('');
    const [isPivoting, setIsPivoting] = useState<string | null>(null);

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
            setManualForm({ titulo: '', descricao: '', responsavel_nome: '', categoria: 'Outro' });
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
            alert("Estratégia Pivotada (Vê as sugestões geradas!)");
            // For simplicity here, we show an alert. A proper modal is better.
        } else alert(res.error);
        setIsPivoting(null);
    };

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 bg-slate-900 min-h-screen text-slate-200 font-sans">
            
            {/* NASA HEADER */}
            <header className="mb-6 border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
                <div>
                    <h1 className="text-4xl font-black flex items-center gap-3 text-white tracking-tighter uppercase">
                        <BrainCircuit size={40} className="text-blue-500" />
                        AUTONOMOUS CONTROL TOWER
                    </h1>
                    <p className="text-blue-400 font-mono tracking-widest text-xs flex items-center gap-2 mt-2 uppercase">
                        <Activity size={14} /> System Online | Global Factory Actions Hub
                    </p>
                </div>

                <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                    <button onClick={() => setActiveTab('KANBAN')} className={`px-4 py-2 text-xs font-bold rounded-md uppercase tracking-wider transition-all ${activeTab === 'KANBAN' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-slate-400 hover:text-white'}`}><ListChecks size={14} className="inline mr-2"/> Ledger</button>
                    <button onClick={() => setActiveTab('COGNITIVE_INBOX')} className={`px-4 py-2 text-xs font-bold rounded-md uppercase tracking-wider transition-all flex items-center ${activeTab === 'COGNITIVE_INBOX' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'text-slate-400 hover:text-white'}`}><Bot size={14} className="inline mr-2"/> A.I. Inbox {suggestedActions.length > 0 && <span className="ml-2 bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[9px]">{suggestedActions.length}</span>}</button>
                    <button onClick={() => setActiveTab('MANUAL_FORM')} className={`px-4 py-2 text-xs font-bold rounded-md uppercase tracking-wider transition-all ${activeTab === 'MANUAL_FORM' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(5,150,105,0.5)]' : 'text-slate-400 hover:text-white'}`}><FilePlus size={14} className="inline mr-2"/> Manual Entry</button>
                    <button onClick={() => setActiveTab('WAR_ROOM')} className={`px-4 py-2 text-xs font-bold rounded-md uppercase tracking-wider transition-all ${activeTab === 'WAR_ROOM' ? 'bg-amber-600 text-white shadow-[0_0_15px_rgba(217,119,6,0.5)]' : 'text-slate-400 hover:text-white'}`}><MessageSquareText size={14} className="inline mr-2"/> War Room</button>
                </div>
            </header>

            {/* NASA KPIs */}
            {activeTab === 'KANBAN' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-md overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                        <CardContent className="p-4">
                            <span className="text-slate-400 font-mono text-[10px] uppercase tracking-widest block mb-1">Open Operations</span>
                            <div className="text-4xl font-black text-white">{totalAbertas}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-md overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                        <CardContent className="p-4">
                            <span className="text-slate-400 font-mono text-[10px] uppercase tracking-widest block mb-1">Critical Overdue</span>
                            <div className="text-4xl font-black text-rose-500 flex items-center gap-3">
                                {overdueActions} 
                                {overdueActions > 0 && <AlertCircle className="text-rose-500 animate-pulse" size={24} />}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-md overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                        <CardContent className="p-4">
                            <span className="text-slate-400 font-mono text-[10px] uppercase tracking-widest block mb-1">Resolved (Success)</span>
                            <div className="text-4xl font-black text-emerald-400">{totalConcluidas}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-indigo-900/40 border border-indigo-700/50 backdrop-blur-md overflow-hidden relative flex flex-col justify-center">
                        <CardContent className="p-4">
                            <span className="text-indigo-300 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2">
                                <Sparkles size={12} className="text-indigo-400"/> A.I. Morning Digest
                            </span>
                            <p className="text-xs text-indigo-100 font-medium leading-tight">
                                {overdueActions > 0 
                                    ? `Alert: Factory has ${overdueActions} overdue critical paths. Focus resources on closing them today to prevent bottleneck.`
                                    : `System nominal. Excellent burn-down rate today. No critical blockages detected.`}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TAB: KANBAN LEDGER */}
            {activeTab === 'KANBAN' && (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/80">
                        <h3 className="font-mono text-white text-sm uppercase tracking-widest flex items-center gap-2">
                            <Layers size={14} className="text-blue-500" /> Action Registry
                        </h3>
                        <div className="flex gap-2 items-center">
                            <Filter size={14} className="text-slate-400" />
                            <select 
                                value={filterModule}
                                onChange={(e) => setFilterModule(e.target.value)}
                                className="text-xs font-mono text-white bg-slate-900 border border-slate-600 rounded py-1 px-2 focus:outline-none"
                            >
                                <option value="Todos">Global View</option>
                                <option value="Qualidade">Qualidade (RNC)</option>
                                <option value="Lean/Kaizen">Lean & Kaizen</option>
                                <option value="HST">H.S.T.</option>
                                <option value="Geral">Central de Eficiência</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-900/50 text-xs font-mono uppercase tracking-widest text-slate-500 border-b border-slate-700/50">
                                <tr>
                                    <th className="px-4 py-3">Task / Description</th>
                                    <th className="px-4 py-3 w-32">Module</th>
                                    <th className="px-4 py-3 w-32">Assignee</th>
                                    <th className="px-4 py-3 w-32">Opened</th>
                                    <th className="px-4 py-3 w-32">Deadline</th>
                                    <th className="px-4 py-3 w-28 text-center">Status</th>
                                    <th className="px-4 py-3 w-28 text-center">PDCA</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {filteredActions.map(action => {
                                    const isOverdue = !['Concluido', 'Done'].includes(action.status) && action.data_limite && new Date(action.data_limite) < today;
                                    const isIneficaz = action.status_eficacia === 'Ineficaz';

                                    return (
                                        <tr key={action.id} className={`hover:bg-slate-800/80 transition-colors group ${isOverdue ? 'bg-rose-950/20' : ''}`}>
                                            <td className="px-4 py-3 max-w-md">
                                                <div className="font-bold text-slate-100 truncate">{action.titulo}</div>
                                                <div className="text-xs text-slate-400 truncate mt-1" title={action.descricao}>{action.descricao}</div>
                                                {isIneficaz && (
                                                    <div className="mt-2">
                                                        <button 
                                                            onClick={() => handlePivotStrategy(action.id, action.descricao)}
                                                            className="text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2 py-1 rounded hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1"
                                                        >
                                                            {isPivoting === action.id ? <RefreshCw size={10} className="animate-spin"/> : <Sparkles size={10}/>}
                                                            A.I. Pivot Strategy
                                                        </button>
                                                        {pivotSuggestion && isPivoting !== action.id && (
                                                            <div className="mt-2 p-2 bg-slate-900 border border-amber-500/20 rounded text-[10px] text-amber-200 whitespace-pre-wrap font-mono">
                                                                {pivotSuggestion}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge className="bg-slate-700 hover:bg-slate-600 text-slate-200 border-0 uppercase text-[9px] tracking-widest">{action.modulo_origem}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-slate-300 font-medium">{action.responsavel_nome || '--'}</td>
                                            <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                                                {new Date(action.created_at).toLocaleDateString()}
                                            </td>
                                            <td className={`px-4 py-3 text-xs font-mono font-bold ${isOverdue ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                                                {action.data_limite ? new Date(action.data_limite).toLocaleDateString() : '--'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge className={`uppercase text-[9px] tracking-widest font-bold border-0
                                                    ${['Concluido', 'Done'].includes(action.status) ? 'bg-emerald-500/10 text-emerald-400' : 
                                                    ['Aberto', 'To Do'].includes(action.status) ? 'bg-blue-500/10 text-blue-400' : 
                                                    'bg-amber-500/10 text-amber-400'}`
                                                }>
                                                    {action.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {action.status_eficacia === 'Eficaz' ? <CheckCircle2 size={16} className="text-emerald-500 mx-auto"/> :
                                                 action.status_eficacia === 'Ineficaz' ? <XCircle size={16} className="text-rose-500 mx-auto"/> :
                                                 <span className="text-[10px] text-slate-500 font-mono">PENDING</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredActions.length === 0 && <div className="p-8 text-center text-slate-500 font-mono text-sm">NO DATA DETECTED IN SECTOR</div>}
                    </div>
                </div>
            )}

            {/* TAB: A.I. COGNITIVE INBOX */}
            {activeTab === 'COGNITIVE_INBOX' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-6 backdrop-blur-md relative overflow-hidden">
                        <Bot className="absolute -bottom-10 -right-10 text-indigo-500/10 w-64 h-64 rotate-12" />
                        <h2 className="text-lg font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2 mb-2">
                            Raw Data Ingestion
                        </h2>
                        <p className="text-sm text-indigo-200/60 font-medium leading-relaxed mb-6">
                            Paste chaotic meeting notes, verbal complaints, or operator descriptions here. The Cognitive Engine will parse the entropy and synthesize actionable structural tasks.
                        </p>
                        <textarea 
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                            rows={6}
                            placeholder="Awaiting audio transcript or raw text input..."
                            className="w-full p-4 bg-slate-900/80 border border-indigo-500/30 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none text-indigo-100 font-mono text-sm placeholder:text-slate-700 mb-4"
                        />
                        <button 
                            onClick={handleGenerateAi}
                            disabled={isAiProcessing || !rawText}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none uppercase tracking-widest"
                        >
                            {isAiProcessing ? <span className="animate-pulse">Processing Telemetry...</span> : <><BrainCircuit size={18}/> Initiate Synthesis</>}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-mono text-slate-400 uppercase tracking-widest text-xs mb-2">Synthesized Actions ({suggestedActions.length})</h3>
                        {suggestedActions.length === 0 ? (
                            <div className="h-64 border-2 border-dashed border-slate-700/50 rounded-xl flex items-center justify-center text-slate-600 font-mono text-sm">
                                AWAITING SYNTHESIS
                            </div>
                        ) : (
                            suggestedActions.map((action, idx) => (
                                <div key={idx} className="bg-slate-800/80 border border-slate-600 p-5 rounded-xl shadow-lg relative group">
                                    <div className="flex justify-between items-start mb-3 gap-4">
                                        <h4 className="font-bold text-white text-base">{action.titulo}</h4>
                                        <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 uppercase text-[9px] shrink-0">{action.categoria}</Badge>
                                    </div>
                                    <p className="text-sm text-slate-300 mb-4">{action.descricao}</p>
                                    <div className="bg-indigo-950/50 p-3 rounded-lg text-xs text-indigo-200 mb-4 border border-indigo-500/20 font-mono">
                                        <span className="font-bold text-indigo-400">>> WCM DIRECTIVE:</span> {action.sugestao_conclusao}
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                                        <span className="text-[10px] font-mono text-slate-500 uppercase">Assigned to: <span className="text-slate-300">{action.responsavel_nome || 'UNASSIGNED'}</span></span>
                                        <button 
                                            onClick={() => handleApproveAction(idx, action)}
                                            className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400 hover:text-slate-900 border border-emerald-400/30 px-4 py-2 rounded transition-colors"
                                        >
                                            Commit to Database
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* TAB: MANUAL FORM WITH AI COPILOT */}
            {activeTab === 'MANUAL_FORM' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-md">
                        <h2 className="text-lg font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                            <FilePlus size={18} /> Human Entry Interface
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Title</label>
                                <input 
                                    type="text" 
                                    value={manualForm.titulo}
                                    onChange={e => setManualForm({...manualForm, titulo: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Action Description</label>
                                <textarea 
                                    value={manualForm.descricao}
                                    onChange={e => setManualForm({...manualForm, descricao: e.target.value})}
                                    rows={4}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Assignee</label>
                                    <input 
                                        type="text" 
                                        value={manualForm.responsavel_nome}
                                        onChange={e => setManualForm({...manualForm, responsavel_nome: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Category</label>
                                    <select 
                                        value={manualForm.categoria}
                                        onChange={e => setManualForm({...manualForm, categoria: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    >
                                        <option value="Eficiencia">Eficiencia</option>
                                        <option value="Scraps">Scraps</option>
                                        <option value="Consumiveis">Consumiveis</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    onClick={handleEvaluateManual}
                                    disabled={!manualForm.descricao || isEvaluating}
                                    className="flex-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-slate-900 border border-amber-500/30 font-bold px-4 py-2 rounded text-xs transition-all uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isEvaluating ? 'Evaluating...' : 'Ask A.I. to Review'}
                                </button>
                                <button 
                                    onClick={handleSubmitManual}
                                    disabled={!manualForm.titulo || !manualForm.descricao}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded text-xs transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(5,150,105,0.4)] disabled:opacity-50 disabled:shadow-none"
                                >
                                    Save Record
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* AI COPILOT FEEDBACK */}
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 relative">
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent -z-10 rounded-xl"></div>
                        <h3 className="font-mono text-slate-400 uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                            <Bot size={14}/> Copilot Audit
                        </h3>
                        
                        {!aiFeedback ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-600">
                                <Sparkles size={32} className="mb-2 opacity-20" />
                                <p className="font-mono text-xs uppercase text-center max-w-xs">Write a description and click "Ask A.I." to receive a WCM Quality Score and structural advice.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-right-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] 
                                        ${aiFeedback.nota >= 7 ? 'border-emerald-500 text-emerald-400' : 'border-amber-500 text-amber-400'}">
                                        {aiFeedback.nota}
                                    </div>
                                    <div>
                                        <p className="text-xs font-mono uppercase text-slate-400">Score</p>
                                        <p className="font-bold text-white text-lg">Action Quality Rating</p>
                                    </div>
                                </div>
                                <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700 text-sm text-slate-300">
                                    <strong className="text-amber-400 text-xs font-mono block mb-1">CRITIQUE:</strong>
                                    {aiFeedback.feedback_curto}
                                </div>
                                <div className="bg-emerald-950/30 p-4 rounded-lg border border-emerald-500/20 text-sm text-emerald-200">
                                    <strong className="text-emerald-400 text-xs font-mono block mb-1">A.I. SUGGESTION:</strong>
                                    {aiFeedback.sugestao_melhoria}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: WAR ROOM CHAT */}
            {activeTab === 'WAR_ROOM' && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl h-[600px] flex flex-col items-center justify-center text-center p-8 backdrop-blur-md">
                    <MessageSquareText size={64} className="text-slate-600 mb-6" />
                    <h2 className="text-2xl font-black text-slate-300 tracking-widest uppercase mb-2">War Room Terminal</h2>
                    <p className="text-slate-500 font-mono max-w-md">
                        Connection established. The A.I. Analytics Chat is currently in development phase (V4 Core Engine). 
                        It will soon allow you to query the entire factory database using natural language.
                    </p>
                    <Badge className="mt-6 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 uppercase tracking-widest text-[10px]">COMING NEXT SPRINT</Badge>
                </div>
            )}
            
        </div>
    );
}

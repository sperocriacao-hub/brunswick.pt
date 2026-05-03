'use client';

import React, { useState } from 'react';
import { processarTextoIA, submitNovaAcao } from './actions';
import { Sparkles, BrainCircuit, Activity, Clock, CheckCircle2, ChevronRight, Filter, AlertTriangle, Layers, ListChecks, Bot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function SmartActionHubClient({ initialActions }: { initialActions: any[] }) {
    const router = useRouter();
    const [rawText, setRawText] = useState('');
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [suggestedActions, setSuggestedActions] = useState<any[]>([]);
    
    const [filterModule, setFilterModule] = useState('Todos');

    // Stats
    const filteredActions = filterModule === 'Todos' ? initialActions : initialActions.filter(a => a.modulo_origem === filterModule);
    const totalAbertas = filteredActions.filter(a => ['Aberto', 'Em Investigacao', 'To Do', 'In Progress'].includes(a.status)).length;
    const totalConcluidas = filteredActions.filter(a => ['Concluido', 'Done'].includes(a.status)).length;

    const handleGenerateAi = async () => {
        if (!rawText.trim()) return;
        setIsAiProcessing(true);
        const res = await processarTextoIA(rawText);
        if (res.success && res.data) {
            setSuggestedActions(res.data);
        } else {
            alert("Erro na IA: " + res.error);
        }
        setIsAiProcessing(false);
    };

    const handleApproveAction = async (idx: number, action: any) => {
        // Build Payload for DB
        const payload = {
            titulo: action.titulo,
            descricao: action.descricao + '\n\n🤖 Sugestão IA: ' + action.sugestao_conclusao,
            categoria: action.categoria,
            responsavel_nome: action.responsavel_nome,
            origem_ia: true
        };

        const res = await submitNovaAcao(payload);
        if (res.success) {
            // Remove from draft list
            setSuggestedActions(prev => prev.filter((_, i) => i !== idx));
            router.refresh();
        } else {
            alert("Erro ao gravar: " + res.error);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* CABEÇALHO */}
            <header className="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold flex items-center gap-3 text-indigo-950 tracking-tight uppercase">
                        <BrainCircuit size={36} className="text-indigo-600" />
                        A.I. Action Hub
                    </h1>
                    <p className="text-indigo-600/80 font-bold tracking-widest text-sm flex items-center gap-2 uppercase mt-2">
                        <Activity size={16} /> Torre de Controlo de Melhoria Contínua Global
                    </p>
                </div>
            </header>

            {/* AI INPUT BLOCK */}
            <div className="mb-10 bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-bl-full -z-0"></div>
                <div className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row gap-8">
                    
                    <div className="flex-1 space-y-4">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="text-amber-500" /> Assistente Cognitivo
                        </h2>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xl">
                            Cola aqui as notas de reunião, os apontamentos soltos ou transcreve áudio. A Inteligência Artificial vai interpretar os teus dados, categorizar os problemas e sugerir Planos de Ação baseados no contexto da Manufatura de Classe Mundial.
                        </p>
                        
                        <div className="relative">
                            <textarea 
                                value={rawText}
                                onChange={e => setRawText(e.target.value)}
                                rows={4}
                                placeholder="Ex: Hoje tivemos 5 paragens na linha de montagem por causa de consumíveis em falta. A Sofia precisa resolver isso."
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none text-slate-700"
                            />
                            <button 
                                onClick={handleGenerateAi}
                                disabled={isAiProcessing || !rawText}
                                className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-lg text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAiProcessing ? <span className="animate-pulse">A analisar Contexto...</span> : <><Bot size={16}/> Processar Ações</>}
                            </button>
                        </div>
                    </div>

                    {/* SUGGESTIONS LIST */}
                    {suggestedActions.length > 0 && (
                        <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-indigo-50 max-h-[300px] overflow-y-auto">
                            <h3 className="text-xs font-black text-indigo-800 uppercase tracking-widest mb-4 flex justify-between items-center">
                                Planos Sugeridos ({suggestedActions.length})
                                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">Aguardando Revisão</Badge>
                            </h3>
                            
                            <div className="space-y-3">
                                {suggestedActions.map((action, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm relative group">
                                        <div className="flex justify-between items-start mb-2 gap-4">
                                            <h4 className="font-bold text-slate-800 text-sm">{action.titulo}</h4>
                                            <Badge className="bg-slate-100 text-slate-600 border-slate-200 uppercase text-[9px] shrink-0">{action.categoria}</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-2">{action.descricao}</p>
                                        <div className="bg-indigo-50 p-2 rounded text-[10px] text-indigo-900 mb-3 border border-indigo-100">
                                            <span className="font-bold">💡 Ideia WCM:</span> {action.sugestao_conclusao}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Resp: <span className="text-slate-700">{action.responsavel_nome || 'A definir'}</span></span>
                                            <button 
                                                onClick={() => handleApproveAction(idx, action)}
                                                className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1 rounded shadow-sm transition-colors"
                                            >
                                                Aprovar & Lançar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* KPIs & LISTA GLOBAL */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white border-0 shadow-sm ring-1 ring-slate-200">
                    <CardContent className="p-5 flex flex-col">
                        <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center justify-between">
                            Ações em Curso
                            <Activity size={14} className="text-indigo-400" />
                        </span>
                        <div className="text-4xl font-black text-slate-800">{totalAbertas}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-sm">
                    <CardContent className="p-5 flex flex-col text-white">
                        <span className="text-emerald-100 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center justify-between">
                            Resolvidas
                            <CheckCircle2 size={14} className="text-emerald-200" />
                        </span>
                        <div className="text-4xl font-black">{totalConcluidas}</div>
                    </CardContent>
                </Card>
            </div>

            {/* MAIN LIST */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 uppercase tracking-widest text-sm flex items-center gap-2">
                        <Layers size={16} className="text-slate-400" />
                        Log Operacional Global
                    </h3>
                    <div className="flex gap-2 items-center">
                        <Filter size={14} className="text-slate-400" />
                        <select 
                            value={filterModule}
                            onChange={(e) => setFilterModule(e.target.value)}
                            className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded py-1 px-2 focus:outline-none"
                        >
                            <option value="Todos">Todos os Módulos</option>
                            <option value="Lean/Kaizen">Lean & Kaizen</option>
                            <option value="HST">H.S.T.</option>
                            <option value="Geral">Central de Eficiência</option>
                        </select>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredActions.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-sm font-medium">
                            Nenhuma ação registada neste critério.
                        </div>
                    ) : (
                        filteredActions.map(action => (
                            <div key={action.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                    <ListChecks size={18} className="text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-slate-800 text-sm truncate">{action.titulo}</h4>
                                        <Badge className="bg-slate-100 text-slate-600 border-slate-200 uppercase text-[9px] shrink-0">{action.modulo_origem}</Badge>
                                        <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 uppercase text-[9px] shrink-0">{action.categoria}</Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{action.descricao}</p>
                                </div>
                                <div className="hidden md:flex flex-col items-end shrink-0 w-32">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Responsável</span>
                                    <span className="text-sm font-semibold text-slate-700 truncate w-full text-right">{action.responsavel_nome || 'N/A'}</span>
                                </div>
                                <div className="shrink-0 w-24 flex justify-end">
                                    <Badge className={`uppercase text-[10px] font-bold 
                                        ${['Concluido', 'Done'].includes(action.status) ? 'bg-emerald-100 text-emerald-700' : 
                                          ['Aberto', 'To Do'].includes(action.status) ? 'bg-slate-100 text-slate-600' : 
                                          'bg-amber-100 text-amber-700'}`
                                    }>
                                        {action.status}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
}

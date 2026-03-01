"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Target, Sparkles, ArrowRight, Loader2, PlaySquare, Search, History, LayoutDashboard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { getKaizens, convertKaizenToAction, updateKaizenStatus } from './actions';
import { Label } from '@/components/ui/label';

export default function ComiteKaizenPage() {
    const [kaizens, setKaizens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKaizen, setSelectedKaizen] = useState<any | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);

    // UI States
    const [activeTab, setActiveTab] = useState<'pendentes' | 'historico'>('pendentes');
    const [searchTerm, setSearchTerm] = useState('');

    // Evaluation Form
    const [effort, setEffort] = useState(5);
    const [impact, setImpact] = useState(5);
    const [procedendo, setProcedendo] = useState(false);

    useEffect(() => {
        carregarKaizens();
    }, []);

    async function carregarKaizens() {
        setLoading(true);
        const res = await getKaizens();
        if (res.success) {
            setKaizens(res.data || []);
        }
        setLoading(false);
    }

    const openEvaluationModal = (k: any) => {
        setSelectedKaizen(k);
        setEffort(k.esforco_estimado || 5);
        setImpact(k.impacto_estimado || 5);
        setIsEvaluating(true);
    };

    const handleAprovarParaAcao = async () => {
        setProcedendo(true);

        // Update effort/impact metrics
        await updateKaizenStatus(selectedKaizen.id, {
            esforco_estimado: effort,
            impacto_estimado: impact,
            avaliado_por: "Comitê Diretion" // Could pull User email/name here
        });

        // Convert exactly to an Action Kanban Board
        const res = await convertKaizenToAction(selectedKaizen);

        if (res.success) {
            setIsEvaluating(false);
            carregarKaizens();
        } else {
            alert("Falha ao gerar Ação: " + res.error);
        }
        setProcedendo(false);
    };

    const handleRejeitar = async () => {
        setProcedendo(true);
        await updateKaizenStatus(selectedKaizen.id, { status: "Rejeitada", data_avaliacao: new Date().toISOString() });
        setIsEvaluating(false);
        carregarKaizens();
        setProcedendo(false);
    };

    const getMatrixQuadrant = (eff: number, imp: number) => {
        if (eff <= 5 && imp >= 6) return { label: "Quick Win (Fazer Já)", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
        if (eff > 5 && imp >= 6) return { label: "Projeto Importante", color: "bg-blue-100 text-blue-800 border-blue-300" };
        if (eff <= 5 && imp < 6) return { label: "Tarefa Cosmética", color: "bg-amber-100 text-amber-800 border-amber-300" };
        return { label: "Desperdício de Tempo", color: "bg-rose-100 text-rose-800 border-rose-300" };
    };

    return (
        <div className="p-8 space-y-8 pb-32 max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500 bg-slate-50/50 min-h-screen">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-6 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <Lightbulb className="text-amber-500" size={36} fill="currentColor" /> Comitê Lean (Kaizen)
                    </h1>
                    <p className="text-lg text-slate-500 mt-1">Transforme ideias da fábrica em Ações de Melhoria.</p>
                </div>

                <div className="flex bg-slate-200/50 p-1 rounded-xl w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('pendentes')}
                        className={`flex-1 md:px-6 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all \${activeTab === 'pendentes' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <LayoutDashboard size={16} />
                        Por Avaliar
                    </button>
                    <button
                        onClick={() => setActiveTab('historico')}
                        className={`flex-1 md:px-6 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all \${activeTab === 'historico' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <History size={16} />
                        Histórico
                    </button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por Título, Área ou Colaborador..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-slate-700 font-medium"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>
            ) : kaizens.length === 0 ? (
                <div className="p-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                    Sem Ideias Submetidas pelos Operadores até ao momento.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {kaizens.filter(k => {
                        // Filter by Search Term
                        const matchSearch = searchTerm === '' ||
                            k.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            k.operadores?.nome_operador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            k.areas_fabrica?.nome_area?.toLowerCase().includes(searchTerm.toLowerCase());

                        // Filter by Tab
                        const isAberto = k.status === 'Pendente' || k.status === 'Em Analise';
                        const matchTab = activeTab === 'pendentes' ? isAberto : !isAberto;

                        return matchSearch && matchTab;
                    }).map(k => {
                        const isEmAberto = k.status === 'Pendente' || k.status === 'Em Analise';
                        const isRejeitada = k.status === 'Rejeitada';
                        const diag = k.esforco_estimado ? getMatrixQuadrant(k.esforco_estimado, k.impacto_estimado) : null;

                        return (
                            <Card key={k.id} className={`border shadow-sm overflow-hidden transition-all \${
                                isEmAberto ? 'border-slate-200 hover:shadow-lg hover:border-amber-300/50 hover:-translate-y-1' : 
                                isRejeitada ? 'border-rose-200 bg-rose-50/30 opacity-75 grayscale-[0.5]' :
                                'border-emerald-100 bg-slate-50/50 opacity-90'
                            }`}>
                                <div className={`h-2 w-full \${isEmAberto ? 'bg-amber-400' : k.status === 'Aceite' ? 'bg-emerald-500' : 'bg-rose-400'}`}></div>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-[10px] font-black tracking-widest uppercase bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded">
                                            {k.categoria}
                                        </div>
                                        <div className={`text-[10px] font-black uppercase px-2 py-1 rounded \${
                                            k.status === 'Pendente' ? 'bg-blue-100 text-blue-700' : 
                                            k.status === 'Em Analise' ? 'bg-amber-100 text-amber-700' :
                                            k.status === 'Aceite' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 
                                            k.status === 'Rejeitada' ? 'bg-slate-800 text-rose-300' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                            {k.status}
                                        </div>
                                    </div>
                                    <CardTitle className={`text-lg leading-tight \${isRejeitada ? 'text-slate-500 line-through decoration-rose-300' : 'text-slate-800'}`}>
                                        {k.titulo}
                                    </CardTitle>
                                    <CardDescription className="text-xs font-mono uppercase">Por {k.operadores?.nome_operador} • {k.areas_fabrica?.nome_area || 'Fábrica Geral'}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-600 line-clamp-3 relative group">
                                        <span className="font-bold text-slate-800 block mb-1">Problema:</span>
                                        {k.descricao_atual}
                                    </div>
                                    <div className="text-sm bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-emerald-800 line-clamp-3 relative">
                                        <span className="text-emerald-900 font-bold block mb-1">A Solução Pensada:</span>
                                        {k.proposta_melhoria}
                                    </div>

                                    {diag && (
                                        <div className={`px-3 py-2 text-xs font-bold rounded text-center border \${diag.color}`}>
                                            🎯 Avaliação: {diag.label} ({k.esforco_estimado} Esf / {k.impacto_estimado} Imp)
                                        </div>
                                    )}

                                    {isEmAberto && (
                                        <Button onClick={() => openEvaluationModal(k)} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold h-10 shadow-sm mt-4">
                                            Avaliar Ideia no Comitê <PlaySquare className="w-4 h-4 ml-2" />
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Modal de Feedback do Comite */}
            <Dialog open={isEvaluating} onOpenChange={setIsEvaluating}>
                <DialogContent className="sm:max-w-[700px] bg-white border-slate-200 text-slate-800">
                    {selectedKaizen && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                    <Target className="text-indigo-600" /> Avaliação da Matriz de Impacto
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium">
                                    Analise o Esforço e Impacto que o <b>{selectedKaizen.titulo}</b> trará à organização.
                                    Se classificado como válido, será automaticamente gerado um Ticket na <b>Ação Global de Melhoria.</b>
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-6 space-y-8">
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl text-sm">
                                    <div>
                                        <span className="block text-rose-500 font-bold uppercase text-xs mb-1">O que Dói (Gargalo)?</span>
                                        <p className="text-slate-600">{selectedKaizen.descricao_atual}</p>
                                    </div>
                                    <div>
                                        <span className="block text-emerald-500 font-bold uppercase text-xs mb-1">A Solução Propósta:</span>
                                        <p className="text-slate-600 font-medium">{selectedKaizen.proposta_melhoria}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <Label className="font-bold text-slate-700 uppercase tracking-widest text-xs">💪 Esforço de Implementação (1-10)</Label>
                                            <span className="font-black text-indigo-600">{effort}</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="10"
                                            value={effort} onChange={e => setEffort(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                                            <span>Fácil (1)</span>
                                            <span>Complexo / Caro (10)</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <Label className="font-bold text-slate-700 uppercase tracking-widest text-xs">🚀 Impacto no Negócio (1-10)</Label>
                                            <span className="font-black text-amber-500">{impact}</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="10"
                                            value={impact} onChange={e => setImpact(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                                            <span>Baixo / Nulo (1)</span>
                                            <span>Alto Impacto / Revolucionário (10)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 \${getMatrixQuadrant(effort, impact).color}`}>
                                    <Sparkles size={20} />
                                    <span className="font-black uppercase tracking-widest">{getMatrixQuadrant(effort, impact).label}</span>
                                </div>
                            </div>

                            <DialogFooter className="sm:justify-between items-center bg-slate-50 border-t border-slate-100 px-6 py-4 -mx-6 -mb-6">
                                <Button disabled={procedendo} variant="destructive" onClick={handleRejeitar} className="font-bold text-xs bg-rose-100 text-rose-700 hover:bg-rose-200 hover:text-rose-800 border border-rose-200">
                                    Rejeitar Ideia
                                </Button>
                                <Button disabled={procedendo} onClick={handleAprovarParaAcao} className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8 shadow-sm">
                                    {procedendo ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                                    Aprovar e Criar Ação!
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

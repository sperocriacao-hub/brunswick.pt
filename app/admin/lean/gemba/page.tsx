"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Search, PlusCircle, CheckCircle2, ChevronRight, PlaySquare, Calendar, Loader2, Footprints, Camera, Lightbulb } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getGembaWalks, submitGembaWalk, submitGembaAction } from './actions';
import { getLeanFormData } from '@/app/operador/ideias/actions';

export default function GembaWalksPage() {
    const [walks, setWalks] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isNewWalkModalOpen, setIsNewWalkModalOpen] = useState(false);
    const [isCreatingAction, setIsCreatingAction] = useState(false);

    // New Walk Form
    const [equipa, setEquipa] = useState("");
    const [areaId, setAreaId] = useState("");
    const [obs, setObs] = useState("");
    const [oportunidades, setOportunidades] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        setLoading(true);
        const walksRes = await getGembaWalks();
        const depsRes = await getLeanFormData(); // Re-use the combo box data generator from Kaizen

        if (walksRes.success) setWalks(walksRes.data || []);
        if (depsRes.success) setAreas(depsRes.areas || []);
        setLoading(false);
    }

    const handleNewWalkSubmit = async () => {
        setIsSubmitting(true);
        const res = await submitGembaWalk({
            equipa_auditora: equipa,
            area_auditada_id: areaId || null,
            observacoes: obs,
            oportunidades_melhoria: oportunidades
        });

        if (res.success) {
            setIsNewWalkModalOpen(false);
            setEquipa(""); setAreaId(""); setObs(""); setOportunidades("");
            carregarDados();
        } else {
            alert("Erro ao registar Ronda Gemba: " + res.error);
        }
        setIsSubmitting(false);
    };

    const handleDirectActionCreation = async (walk: any) => {
        setIsCreatingAction(true);
        const res = await submitGembaAction(walk.id, walk.area_auditada_id, walk.oportunidades_melhoria || walk.observacoes);
        if (res.success) {
            alert("Ação Lean gerada a partir desta Ronda e colocada na listagem 'To Do' (Fila de Trabalho).");
        } else {
            alert("Erro ao gerar a Acão Lean: " + res.error);
        }
        setIsCreatingAction(false);
    };

    return (
        <div className="p-8 space-y-8 pb-32 max-w-[1200px] mx-auto animate-in fade-in zoom-in-95 duration-500 bg-slate-50/50 min-h-screen">
            <header className="flex justify-between items-end border-b pb-4 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <Footprints className="text-blue-600" size={36} fill="currentColor" /> Rondas da Liderança (Gemba Walk)
                    </h1>
                    <p className="text-lg text-slate-500 mt-1">Registo das visitas operacionais ao chão de fábrica e identificação direta de desperdícios.</p>
                </div>
                <Button onClick={() => setIsNewWalkModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-12 px-6 font-bold shadow-md shadow-blue-500/20">
                    <PlusCircle className="mr-2 h-5 w-5" /> Iniciar Nova Ronda
                </Button>
            </header>

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : walks.length === 0 ? (
                <div className="p-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                    Nenhuma Ronda Gemba registada até ao momento.
                </div>
            ) : (
                <div className="space-y-4 relative">
                    {/* Linha do tempo visual */}
                    <div className="absolute left-[27px] top-6 bottom-6 w-1 bg-blue-100 rounded-full z-0 hidden md:block"></div>

                    {walks.map((w, i) => (
                        <div key={w.id} className="flex gap-6 relative z-10 w-full group">
                            {/* Dot */}
                            <div className="hidden md:flex w-14 h-14 shrink-0 mt-2 bg-white rounded-full border-4 border-blue-100 items-center justify-center shadow-sm group-hover:border-blue-400 group-hover:bg-blue-50 transition-colors">
                                <Footprints className="text-blue-600" size={20} />
                            </div>

                            {/* Card Content */}
                            <Card className="flex-1 overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
                                <div className="p-5">
                                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4 border-b border-slate-100 pb-4">
                                        <div>
                                            <h3 className="font-black text-xl text-slate-800 uppercase flex items-center gap-2">
                                                <MapPin className="text-rose-500" size={20} />
                                                {w.areas_fabrica?.nome_area || 'Área Não Especificada'}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm font-bold font-mono">
                                                <Calendar size={14} />
                                                {new Date(w.data_ronda).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 border border-slate-200 break-all max-w-[300px]">
                                            <span className="text-slate-400 block mb-0.5 text-[9px] uppercase tracking-widest">Avaliadores / Equipa</span>
                                            {w.equipa_auditora}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">O que os olhos viram:</span>
                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                {w.observacoes}
                                            </p>
                                        </div>
                                        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl">
                                            <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1 block">Oportunidades / Deficits:</span>
                                            <p className="text-sm text-amber-900 leading-relaxed font-medium">
                                                {w.oportunidades_melhoria || 'Não mencionadas.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                                        <Button
                                            variant="outline"
                                            disabled={isCreatingAction}
                                            onClick={() => handleDirectActionCreation(w)}
                                            className="text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 leading-none h-8"
                                        >
                                            {isCreatingAction ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <PlaySquare className="w-3 h-3 mr-1" />}
                                            Delegar para "Lean Ações"
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Registo Gemba Walk */}
            <Dialog open={isNewWalkModalOpen} onOpenChange={setIsNewWalkModalOpen}>
                <DialogContent className="sm:max-w-[700px] border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <Footprints className="text-blue-600" /> Registar Novo Gemba Walk
                        </DialogTitle>
                        <DialogDescription>
                            "Ir ver" é o pilar da cultura Lean. Registe as equipas envolvidas na ronda e os resultados obtidos antes de os traduzir em tarefas.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Avaliadores Presentes (Nomes)</label>
                                <Input value={equipa} onChange={e => setEquipa(e.target.value)} placeholder="Ex: João (CEO), Maria (Engenheira)" className="font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Setor Visitado</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={areaId} onChange={e => setAreaId(e.target.value)}
                                >
                                    <option value="" disabled>Selecione a Área...</option>
                                    {areas.map(a => (
                                        <option key={a.id} value={a.id}>{a.nome_area}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1"><Camera size={14} /> Observações Efetivas</label>
                                <Textarea
                                    value={obs} onChange={e => setObs(e.target.value)}
                                    placeholder="Descreva as anomalias, como as pessoas estavam a trabalhar e se a linha decorria fluidamente."
                                    className="resize-none h-24 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-amber-500 uppercase flex items-center gap-1"><Lightbulb size={14} /> Oportunidades Detetadas</label>
                                <Textarea
                                    value={oportunidades} onChange={e => setOportunidades(e.target.value)}
                                    placeholder="Ferramentas mal arrumadas? Movimentos bruscos repetitivos? Identifique aqui para depois passarmos ao fluxo de Tarefas Corretivas."
                                    className="resize-none h-24 bg-amber-50/30 border-amber-200 focus-visible:ring-amber-500 placeholder:text-amber-700/50 text-amber-900"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsNewWalkModalOpen(false)}>Cancelar</Button>
                        <Button disabled={!equipa || !obs || isSubmitting} onClick={handleNewWalkSubmit} className="bg-blue-600 hover:bg-blue-700 font-bold px-8">
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Gravar Relatório Gemba
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Info, CheckCircle2, ChevronRight, User, MapPin, Target, Zap, AlertTriangle, Coins, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getLeanFormData, submitKaizen } from "./actions";
import { useRouter } from "next/navigation";

export default function KaizenTabletPortal() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    const [areas, setAreas] = useState<any[]>([]);
    const [operadores, setOperadores] = useState<any[]>([]);

    // Form Fields
    const [colaboradorId, setColaboradorId] = useState("");
    const [areaId, setAreaId] = useState("");
    const [categoria, setCategoria] = useState("");
    const [titulo, setTitulo] = useState("");
    const [descricaoAtual, setDescricaoAtual] = useState("");
    const [proposta, setProposta] = useState("");
    const [beneficios, setBeneficios] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        const res = await getLeanFormData();
        if (res.success) {
            setAreas(res.areas || []);
            setOperadores(res.operadores || []);
        }
    }

    async function handleSubmit() {
        setSubmitting(true);
        const ref = {
            colaborador_id: colaboradorId || null,
            area_id: areaId || null,
            categoria,
            titulo,
            descricao_atual: descricaoAtual,
            proposta_melhoria: proposta,
            beneficios_esperados: beneficios,
            status: 'Pendente'
        };

        const res = await submitKaizen(ref);
        if (res.success) {
            setSuccess(true);
        } else {
            alert("Erro ao submeter Ideia: " + res.error);
        }
        setSubmitting(false);
    }

    const resetForm = () => {
        setStep(1);
        setColaboradorId("");
        setAreaId("");
        setCategoria("");
        setTitulo("");
        setDescricaoAtual("");
        setProposta("");
        setBeneficios("");
        setSuccess(false);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
                <div className="w-full max-w-lg bg-emerald-50 rounded-2xl p-8 md:p-12 text-center shadow-2xl border border-emerald-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <CheckCircle2 className="w-24 h-24 text-emerald-500 mx-auto mb-6 relative z-10" />
                    <h2 className="text-3xl font-black text-emerald-900 mb-2 relative z-10">Ideia Submetida!</h2>
                    <p className="text-emerald-700/80 font-medium mb-8 relative z-10">
                        Obrigado pela sua sugestão. A nossa equipa de Engenharia vai avaliá-la num dos próximos comitês. Juntos melhoramos!
                    </p>
                    <div className="flex gap-4 w-full justify-center relative z-10">
                        <Button variant="outline" size="lg" onClick={() => router.push('/operador')} className="font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-100 flex-1">
                            Sair para HMI
                        </Button>
                        <Button size="lg" onClick={resetForm} className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 flex-1">
                            <Lightbulb className="w-5 h-5 mr-2" /> Nova Ideia
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const canAdvanceToStep2 = colaboradorId !== "" && areaId !== "" && titulo.trim() !== "" && categoria !== "";
    const canSubmit = canAdvanceToStep2 && descricaoAtual.trim() !== "" && proposta.trim() !== "" && beneficios.trim() !== "";

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 selection:bg-rose-500/30">
            {/* HMI Tablet TOP BAR */}
            <div className="h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/operador')} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
                        <ArrowLeft className="text-white" size={20} />
                    </button>
                    <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
                    <div>
                        <h1 className="text-lg font-black text-white flex items-center gap-2">
                            <Lightbulb className="text-amber-400" size={18} fill="currentColor" /> Mural de Inovação (Kaizen)
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded bg-slate-800 border border-slate-700 flex items-center gap-2 text-xs font-bold font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        ONLINE - M.E.S. LINKED
                    </div>
                </div>
            </div>

            <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 md:p-8 gap-8 items-start relative z-10">

                {/* Lateral Explicativa / Gamified */}
                <div className="w-full md:w-[400px] shrink-0 space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
                        <CardContent className="p-8">
                            <Lightbulb className="w-12 h-12 text-amber-400 mb-6 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                            <h2 className="text-2xl font-black text-white mb-2 leading-tight">Uma pequena melhoria, todos os dias.</h2>
                            <p className="text-slate-400 leading-relaxed font-medium">
                                A metodologia Kaizen vive das pessoas que tocam nas peças. Viu algo que demora muito tempo? Encontrou um risco de segurança? Preencha esta ficha na hora.
                            </p>

                            <div className="mt-8 space-y-4">
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono transition-colors \${step >= 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'}`}>1</div>
                                    <span>Identificação do Problema</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono transition-colors \${step >= 2 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'}`}>2</div>
                                    <span>A Sua Visão (Solução)</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono transition-colors \${step >= 3 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>3</div>
                                    <span>Engenharia Avalia!</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Formulário Principal */}
                <div className="flex-1 w-full bg-slate-950/50 border border-slate-800/80 rounded-2xl shadow-2xl p-6 md:p-10 relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    {step === 1 ? (
                        <div className="space-y-8 animate-in slide-in-from-right-8 duration-300 relative z-10">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Passo 1: Quem e Onde?</h3>
                                <p className="text-slate-400 text-sm">Gere as fundações da sua sugestão.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><User size={14} /> Sou O...</label>
                                    <Select value={colaboradorId} onValueChange={setColaboradorId}>
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-12">
                                            <SelectValue placeholder="Toque para Selecionar..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                            {operadores.map(op => (
                                                <SelectItem key={op.id} value={op.id}>{op.nome} {op.apelido || ''}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><MapPin size={14} /> Área Afetada</label>
                                    <Select value={areaId} onValueChange={setAreaId}>
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-12">
                                            <SelectValue placeholder="Em que setor físico ocorre?" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                            {areas.map(a => (
                                                <SelectItem key={a.id} value={a.id}>{a.nome_area}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-800/50">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Qual o impacto principal desta ideia?</label>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {[
                                            { id: 'Seguranca', label: 'Segurança', icon: AlertTriangle, color: 'text-rose-400' },
                                            { id: 'Qualidade', label: 'Qualidade', icon: Sparkles, color: 'text-indigo-400' },
                                            { id: 'Produtividade', label: 'Produtividade', icon: Zap, color: 'text-emerald-400' },
                                            { id: 'Ergonomia', label: 'Ergonomia', icon: User, color: 'text-blue-400' },
                                            { id: 'Custo', label: 'Custo', icon: Coins, color: 'text-amber-400' },
                                        ].map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setCategoria(cat.id)}
                                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all \${categoria === cat.id ? 'border-amber-500 bg-amber-500/10 scale-[1.02]' : 'border-slate-800 bg-slate-900 hover:border-slate-600'}`}
                                            >
                                                <cat.icon className={`w-6 h-6 mb-2 \${cat.color}`} />
                                                <span className={`text-xs font-bold \${categoria === cat.id ? 'text-amber-500' : 'text-slate-400'}`}>{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Resuma a ideia num Título</label>
                                <Input
                                    className="bg-slate-900 border-slate-700 text-white h-14 text-lg font-bold placeholder:text-slate-600 focus:border-amber-500 focus:ring-amber-500/20"
                                    placeholder="Ex: Novo Suporte Móvel para Resina"
                                    value={titulo} onChange={e => setTitulo(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end pt-6">
                                <Button
                                    size="lg"
                                    disabled={!canAdvanceToStep2}
                                    onClick={() => setStep(2)}
                                    className="bg-amber-500 hover:bg-amber-600 font-bold text-amber-950 px-8 text-lg disabled:opacity-50"
                                >
                                    Avançar à Proposta <ChevronRight className="w-5 h-5 ml-1" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-right-8 duration-300 relative z-10">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setStep(1)} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                    <ChevronRight className="rotate-180" size={20} />
                                </button>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">Passo 2: Diagnóstico</h3>
                                    <p className="text-slate-400 text-sm">O que se passa e o que pretedes alterar?</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2 relative group">
                                    <label className="text-xs font-bold text-rose-400 uppercase flex items-center gap-2"><AlertTriangle size={14} /> Estado Atual (O Problema)</label>
                                    <textarea
                                        value={descricaoAtual}
                                        onChange={e => setDescricaoAtual(e.target.value)}
                                        className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 resize-none transition-all placeholder:text-slate-600"
                                        placeholder="Descreva o que acontece hoje. O quão difícil é fazer a tarefa? Quanto tempo se perde?"
                                    />
                                </div>

                                <div className="space-y-2 relative group">
                                    <label className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2"><Target size={14} /> Solução Proposta</label>
                                    <textarea
                                        value={proposta}
                                        onChange={e => setProposta(e.target.value)}
                                        className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-none transition-all placeholder:text-slate-600"
                                        placeholder="O que sugere mudar? Qual a ferramenta, regra ou processo devemos adotar?"
                                    />
                                </div>

                                <div className="space-y-2 relative group pb-4">
                                    <label className="text-xs font-bold text-amber-400 uppercase flex items-center gap-2"><Sparkles size={14} /> Benefícios Esperados</label>
                                    <textarea
                                        value={beneficios}
                                        onChange={e => setBeneficios(e.target.value)}
                                        className="w-full h-24 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 resize-none transition-all placeholder:text-slate-600"
                                        placeholder="Menos defeitos? Menos queixas de dor de costas? Produção mais rápida?"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-6 border-t border-slate-800/50">
                                <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                    <Info size={16} /> Reveja o texto antes de enviar.
                                </span>
                                <Button
                                    size="lg"
                                    disabled={!canSubmit || submitting}
                                    onClick={handleSubmit}
                                    className="bg-emerald-500 hover:bg-emerald-600 font-bold text-white px-8 h-14 text-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                                    Lançar a Ideia!
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

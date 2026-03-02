"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFactoryContext, getAuditoriaTopicos, submeterAuditoria } from "../actions";
import { ChevronLeft, Loader2, CheckCircle2, XCircle, FileText, AlertTriangle, Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Area { id: string; nome_area: string; }
interface Operador { id: string; nome_operador: string; }
interface Topico { id: string; topico: string; categoria: string; ativo: boolean; }
interface Resposta { topico_id: string; conforme: boolean; observacao: string }

export default function NovaAuditoriaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Context Lists
    const [areas, setAreas] = useState<Area[]>([]);
    const [operadores, setOperadores] = useState<Operador[]>([]);
    const [topicos, setTopicos] = useState<Topico[]>([]);

    // Form State
    const [step, setStep] = useState(1);
    const [selArea, setSelArea] = useState("");
    const [selAuditor, setSelAuditor] = useState("");
    const [obsGerais, setObsGerais] = useState("");
    const [respostas, setRespostas] = useState<Resposta[]>([]);

    // State for modal / extra info for a question
    const [activeObsId, setActiveObsId] = useState<string | null>(null);

    useEffect(() => {
        carregarConfiguracoes();
    }, []);

    const carregarConfiguracoes = async () => {
        setLoading(true);
        const [resContext, resTopicos] = await Promise.all([
            getFactoryContext(),
            getAuditoriaTopicos()
        ]);

        if (resContext.success) {
            setAreas(resContext.areas || []);
            setOperadores(resContext.operadores || []);
        }
        if (resTopicos.success) {
            const ativos = (resTopicos.data || []).filter((t: Topico) => t.ativo);
            setTopicos(ativos);
        }

        setLoading(false);
    };

    const handleAnswer = (topicoId: string, conforme: boolean) => {
        setRespostas(prev => {
            const filtrado = prev.filter(r => r.topico_id !== topicoId);
            return [...filtrado, { topico_id: topicoId, conforme, observacao: "" }];
        });
    };

    const handleAddObs = (topicoId: string, text: string) => {
        setRespostas(prev => prev.map(r => r.topico_id === topicoId ? { ...r, observacao: text } : r));
    };

    const startExecution = () => {
        if (!selArea || !selAuditor) {
            toast.warn("Por favor, selecione a Área e o Avaliador.");
            return;
        }
        setStep(2);
    };

    const handleSubmit = async () => {
        if (respostas.length !== topicos.length) {
            toast.warn(`Falta responder a ${topicos.length - respostas.length} questões.`);
            return;
        }

        setSubmitting(true);
        const res = await submeterAuditoria({
            area_id: selArea,
            auditor_id: selAuditor,
            observacoes_gerais: obsGerais,
            respostas
        });

        if (res.success) {
            toast.success("Auditoria Submetida com Sucesso!");
            setTimeout(() => {
                router.push('/admin/hst/auditorias');
            }, 1000);
        } else {
            toast.error("Erro ao submeter: " + res.error);
            setSubmitting(false);
        }
    };

    // Calculate live score
    const numRespondidas = respostas.length;
    const numConformes = respostas.filter(r => r.conforme).length;
    const currentScore = numRespondidas > 0 ? ((numConformes / numRespondidas) * 100).toFixed(0) : 0;

    if (loading) {
        return <div className="min-h-screen flex text-emerald-600 items-center justify-center bg-slate-50"><Loader2 className="w-12 h-12 animate-spin" /></div>;
    }

    if (topicos.length === 0) {
        return (
            <div className="p-8 max-w-lg mx-auto mt-20 text-center space-y-4">
                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
                <h2 className="text-xl font-bold">Sem Critérios Configurados</h2>
                <p className="text-slate-500">Deves configurar primeiro as perguntas no menu de Configurações das Auditorias.</p>
                <Button onClick={() => router.push('/admin/hst/auditorias')} variant="outline">Voltar ao Gestor</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 relative pb-32 max-w-4xl mx-auto md:p-6 animate-in slide-in-from-bottom-6">
            <ToastContainer position="top-center" />

            {step === 1 && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mt-12">
                    <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-800 flex items-center gap-2 mb-6 font-bold text-sm">
                        <ChevronLeft size={16} /> Voltar
                    </button>
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Iniciar Inspeção de Segurança</h1>
                        <p className="text-slate-500 mt-2 font-medium">Preencha os dados do local antes de prosseguir com a checklist (Gemba Walk).</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Área Fabril a Auditar</label>
                            <select
                                className="flex h-12 w-full items-center justify-between rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selArea} onChange={e => setSelArea(e.target.value)}
                            >
                                <option value="">--- Selecione a Área ---</option>
                                {areas.map(a => <option key={a.id} value={a.id}>{a.nome_area}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Avaliador (Auditor HST)</label>
                            <select
                                className="flex h-12 w-full items-center justify-between rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selAuditor} onChange={e => setSelAuditor(e.target.value)}
                            >
                                <option value="">--- Selecione o seu nome ---</option>
                                {operadores.map(o => <option key={o.id} value={o.id}>{o.nome_operador}</option>)}
                            </select>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end">
                            <Button size="lg" className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={startExecution}>
                                Iniciar Checklist ({topicos.length} Critérios) <ChevronRight size={18} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    {/* Fixed Header for Audit */}
                    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-4 pt-6 md:p-6 border-b border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Progresso da Inspeção</p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="font-bold text-slate-800">{numRespondidas} / {topicos.length}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Conformidade Atual</p>
                            <div className={`text-2xl font-black \${Number(currentScore) >= 80 ? 'text-emerald-600' : Number(currentScore) >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {currentScore}%
                            </div>
                        </div>
                    </div>

                    <div className="p-4 md:p-6 space-y-6">
                        {topicos.map((t, index) => {
                            const rsp = respostas.find(r => r.topico_id === t.id);
                            const hasRsp = !!rsp;
                            const isConforme = rsp?.conforme;

                            return (
                                <div key={t.id} className={`bg-white rounded-2xl p-5 border-2 transition-all \${!hasRsp ? 'border-transparent shadow-sm' : isConforme ? 'border-emerald-200 shadow-sm bg-emerald-50/10' : 'border-rose-200 shadow-sm bg-rose-50/10'}`}>
                                    <div className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-2 flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">{index + 1}</div>
                                        {t.categoria}
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-tight mb-6">{t.topico}</h3>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <button
                                            className={`flex flex-col items-center justify-center gap-2 py-6 rounded-2xl font-black transition-all border-2 \${hasRsp && isConforme ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg scale-[1.02] ring-4 ring-emerald-500/20' : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/30'}`}
                                            onClick={() => handleAnswer(t.id, true)}
                                        >
                                            <CheckCircle2 size={32} />
                                            <span className="text-sm uppercase tracking-wider">Conforme</span>
                                        </button>
                                        <button
                                            className={`flex flex-col items-center justify-center gap-2 py-6 rounded-2xl font-black transition-all border-2 \${hasRsp && !isConforme ? 'bg-rose-500 text-white border-rose-600 shadow-lg scale-[1.02] ring-4 ring-rose-500/20' : 'bg-white text-slate-400 border-slate-200 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/30'}`}
                                            onClick={() => handleAnswer(t.id, false)}
                                        >
                                            <XCircle size={32} />
                                            <span className="text-sm uppercase tracking-wider">Não Conforme</span>
                                        </button>
                                    </div>

                                    {/* Observations Input - Always visible if answered, but can expand */}
                                    {hasRsp && (
                                        <div className="mt-4 animate-in slide-in-from-top-2">
                                            {activeObsId === t.id || rsp.observacao ? (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                        <FileText size={12} /> Observações / Ação Necessária
                                                    </label>
                                                    <Textarea
                                                        placeholder="Registe o que viu de errado ou a correção necessária..."
                                                        className="bg-white border-slate-200 focus-visible:ring-emerald-500 min-h-[80px]"
                                                        value={rsp.observacao || ""}
                                                        onChange={(e) => handleAddObs(t.id, e.target.value)}
                                                    />
                                                </div>
                                            ) : (
                                                <button onClick={() => setActiveObsId(t.id)} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1">
                                                    <Plus size={16} /> Adicionar Nota / Evidência
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-8">
                            <h3 className="font-black text-slate-800 mb-2">Comentários Finais da Auditoria</h3>
                            <Textarea
                                placeholder="Resumo, considerações finais, ou elogios às equipas..."
                                className="min-h-[100px] border-slate-200 mb-6"
                                value={obsGerais}
                                onChange={e => setObsGerais(e.target.value)}
                            />

                            <Button
                                size="lg"
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-lg h-16"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="animate-spin w-6 h-6" /> : "Finalizar Auditoria da Área"}
                            </Button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

// Emulate a ChevronRight absent icon
function ChevronRight(props: any) {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="9 18 15 12 9 6"></polyline></svg>
}

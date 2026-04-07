"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useParams, useRouter } from 'next/navigation';
import { getA3, updateA3 } from '../../actions';
import { LayoutTemplate, Save, Loader2, ArrowLeft, Target, AlertCircle, Activity, Search, Wrench, ListTodo, Eye, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EditarATresPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rnc, setRnc] = useState<any>(null);
    const [reportId, setReportId] = useState<string>('');
    const [status, setStatusLabel] = useState<string>('');
    const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

    // A3 Fields
    const [titulo, setTitulo] = useState('');
    const [autor, setAutor] = useState('');
    const [background, setBackground] = useState('');
    const [condicaoAtual, setCondicaoAtual] = useState('');
    const [objetivo, setObjetivo] = useState('');
    const [analiseCausa, setAnaliseCausa] = useState('');
    const [contramedidas, setContramedidas] = useState('');
    const [seguimento, setSeguimento] = useState('');

    useEffect(() => {
        carregarBase();
    }, [id]);

    async function carregarBase() {
        setLoading(true);
        const res = await getA3(id);
        if (res.success && res.report) {
            setRnc(res.report.qualidade_rnc);
            setReportId(res.report.titulo || '');
            setStatusLabel(res.report.status);
            
            setTitulo(res.report.titulo || '');
            setAutor(res.report.autor || '');
            setBackground(res.report.background || '');
            setCondicaoAtual(res.report.condicao_atual || res.report.qualidade_rnc?.descricao_problema || '');
            setObjetivo(res.report.objetivo || '');
            setAnaliseCausa(res.report.analise_causa || '');
            setContramedidas(res.report.contramedidas || '');
            setSeguimento(res.report.seguimento || '');
        } else {
            console.error("Falha a carregar relatório A3:", res.error);
        }
        setLoading(false);
    }

    async function handleSave(newStatus?: string) {
        setSubmitting(true);
        const nextStatus = newStatus || status;

        const payload = {
            titulo,
            autor,
            background,
            condicao_atual: condicaoAtual,
            objetivo,
            analise_causa: analiseCausa,
            contramedidas,
            seguimento,
            status: nextStatus
        };

        const res = await updateA3(id, payload);
        if (res.success) {
            router.push('/admin/qualidade/rnc');
        } else {
            alert('Falha a atualizar relatório A3: ' + res.error);
            setSubmitting(false);
        }
    }

    if (loading) return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">A carregar registo do relatório A3...</div>;

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-32">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-500 mb-2 px-0 hover:bg-transparent hover:text-emerald-600">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar à Central
                    </Button>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <LayoutTemplate className="text-emerald-600" size={32} /> Edição de A3 Thinking
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 gap-2 flex items-center">
                        Vinculado a <span className="text-rose-600 font-bold">{rnc?.numero_rnc}</span> 
                        {rnc?.contexto_producao && <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{rnc.contexto_producao}</span>}
                        - Estado: <span className="text-emerald-800 font-bold">{status}</span>
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Button disabled={submitting} variant="outline" className="flex-1 md:flex-none border-emerald-200 text-emerald-700 bg-emerald-50" onClick={() => handleSave()}>
                        <Save className="w-4 h-4 mr-2" /> Atualizar Registo
                    </Button>
                    {status !== 'Aprovado' && (
                        <Button disabled={submitting} onClick={() => handleSave('Aprovado')} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md">
                            {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />} Aprovar (Concluir A3)
                        </Button>
                    )}
                </div>
            </header>

            {/* Cabeçalho do A3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Tema / Título</label>
                    <Input value={titulo} onChange={e => setTitulo(e.target.value)} className="font-bold text-lg mt-1" />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Autor / Responsável</label>
                    <Input value={autor} onChange={e => setAutor(e.target.value)} placeholder="Nome do Responsável pela Melhoria" className="mt-1" />
                </div>
            </div>

            {/* TABS CONTAINER */}
            <Tabs defaultValue="definicao" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-slate-200/50 p-1 mb-8 rounded-xl max-w-4xl">
                    <TabsTrigger value="definicao" className="font-bold text-xs uppercase data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">1. Definição & Sit. Atual</TabsTrigger>
                    <TabsTrigger value="causa" className="font-bold text-xs uppercase data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">2. Objetivo & Causa Raiz</TabsTrigger>
                    <TabsTrigger value="plano" className="font-bold text-xs uppercase data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">3. Contramedidas (5W2H)</TabsTrigger>
                    <TabsTrigger value="verificacao" className="font-bold text-xs uppercase data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">4. Verificação & Tracking</TabsTrigger>
                </TabsList>

                {/* TAB 1: Background & Situação Atual */}
                <TabsContent value="definicao" className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <AlertCircle size={16} className="text-slate-500" /> 1. Background / Contexto
                        </label>
                        <p className="text-xs text-slate-500">Porque é que estamos a falar disto? Qual o problema de negócio que estamos a tentar resolver?</p>
                        <textarea
                            value={background} onChange={e => setBackground(e.target.value)}
                            className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[140px]"
                        />
                        
                        {/* FOTOS DA RNC */}
                        {rnc?.anexos_url && rnc.anexos_url.length > 0 && (
                            <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
                                <span className="text-xs uppercase font-bold text-slate-400 self-center">Evidências Iniciais:</span>
                                {rnc.anexos_url.map((url: string, idx: number) => (
                                    <img 
                                        key={idx} src={url} alt="Evidência" onClick={() => setZoomedPhoto(url)}
                                        className="w-16 h-16 rounded border border-slate-200 object-cover cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all shadow-sm"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <hr className="border-slate-100" />

                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={16} className="text-rose-500" /> 2. Situação Atual
                        </label>
                        <p className="text-xs text-slate-500">Onde estamos hoje? Apresente factos, gráficos ou o fluxo de valor atual.</p>
                        <textarea
                            value={condicaoAtual} onChange={e => setCondicaoAtual(e.target.value)}
                            className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[160px]"
                        />
                    </div>
                </TabsContent>

                {/* TAB 2: Objetivo & Causa */}
                <TabsContent value="causa" className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Target size={16} className="text-amber-500" /> 3. Objetivo / Meta
                        </label>
                        <p className="text-xs text-slate-500">Para onde queremos ir? Indique uma métrica SMART (Específica, Mensurável, Atingível, Relevante, Temporal).</p>
                        <textarea
                            value={objetivo} onChange={e => setObjetivo(e.target.value)}
                            className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[120px]"
                        />
                    </div>

                    <hr className="border-slate-100" />

                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Search size={16} className="text-indigo-500" /> 4. Análise da Causa Raiz
                        </label>
                        <p className="text-xs text-slate-500">Porquê é que o problema ocorre? (5 Porquês, Diagrama de Ishikawa).</p>
                        <textarea
                            value={analiseCausa} onChange={e => setAnaliseCausa(e.target.value)}
                            className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[220px]"
                        />
                    </div>
                </TabsContent>

                {/* TAB 3: Plano */}
                <TabsContent value="plano" className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Wrench size={16} className="text-emerald-500" /> 5. Contramedidas Propostas
                        </label>
                        <p className="text-xs text-slate-500">Quais as soluções encontradas para combater a causa raiz e atingir o nosso objetivo?</p>
                        <textarea
                            value={contramedidas} onChange={e => setContramedidas(e.target.value)}
                            className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[200px]"
                        />
                    </div>

                    <hr className="border-slate-100" />

                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <ListTodo size={16} className="text-blue-500" /> 6. Plano de Ação (5W2H)
                        </label>
                        <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-center">
                            <p className="text-xs text-slate-500 mb-4">A lista individual de tarefas de investigação deverá ser gerida pelo Global Lean Actions.</p>
                            <Button disabled variant="outline" className="bg-white"><ListTodo className="w-4 h-4 mr-2" /> Gerir Tarefas do A3</Button>
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 4: Verificação */}
                <TabsContent value="verificacao" className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Eye size={16} className="text-teal-500" /> 7. Acompanhamento / Standard
                        </label>
                        <p className="text-xs text-slate-500">Como vamos avaliar o impacto destas ações e como garantimos que o erro não volta? O que será partilhado com o resto da fábrica?</p>
                        <textarea
                            value={seguimento} onChange={e => setSeguimento(e.target.value)}
                            className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[140px]"
                        />
                    </div>
                </TabsContent>
            </Tabs>

            {/* MODAL FOTO ZOOM */}
            {zoomedPhoto && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setZoomedPhoto(null)}>
                    <div className="relative max-w-4xl max-h-screen">
                        <button className="absolute -top-4 -right-4 bg-white text-black rounded-full w-8 h-8 font-bold shadow-lg" onClick={() => setZoomedPhoto(null)}>✕</button>
                        <img src={zoomedPhoto} className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain" />
                    </div>
                </div>
            )}
        </div>
    );
}

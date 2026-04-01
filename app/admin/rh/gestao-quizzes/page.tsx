"use client";

import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, Trash2, Users, Target, HeartHandshake, GraduationCap, LayoutGrid } from 'lucide-react';
import { 
    listarPerguntasCultura, criarPerguntaCultura, alterarStatusCultura,
    listarPerguntasSatisfacao, criarPerguntaSatisfacao, alterarStatusSatisfacao,
    listarPerguntasFormacao, criarPerguntaFormacao, alterarStatusFormacao,
    deletarPerguntaGlobal, PerguntaQuizGroup 
} from './actions';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function GestaoQuizzesHR() {
    const [activeTab, setActiveTab] = useState<'lideranca' | 'satisfacao' | 'formacao'>('lideranca');
    
    // States
    const [perguntasCultura, setPerguntasCultura] = useState<PerguntaQuizGroup[]>([]);
    const [perguntasSatisfacao, setPerguntasSatisfacao] = useState<PerguntaQuizGroup[]>([]);
    const [perguntasFormacao, setPerguntasFormacao] = useState<PerguntaQuizGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Form States
    const [newText, setNewText] = useState("");
    const [newTargetCultura, setNewTargetCultura] = useState<'Liderança' | 'Cultura'>('Liderança');
    const [newTargetFormacao, setNewTargetFormacao] = useState<'Avaliar Formando' | 'Avaliar Formador'>('Avaliar Formador');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        carregarTudo();
    }, []);

    const carregarTudo = async () => {
        setIsLoading(true);
        const [resCult, resSat, resForm] = await Promise.all([
            listarPerguntasCultura(),
            listarPerguntasSatisfacao(),
            listarPerguntasFormacao()
        ]);
        if (resCult.success && resCult.data) setPerguntasCultura(resCult.data);
        if (resSat.success && resSat.data) setPerguntasSatisfacao(resSat.data);
        if (resForm.success && resForm.data) setPerguntasFormacao(resForm.data);
        setIsLoading(false);
    };

    const handleCreate = async () => {
        if (!newText.trim()) return;
        setIsSubmitting(true);
        
        let success = false;
        if (activeTab === 'lideranca') {
            const res = await criarPerguntaCultura(newText, newTargetCultura);
            success = res.success;
        } else if (activeTab === 'satisfacao') {
            const res = await criarPerguntaSatisfacao(newText, 'Geral');
            success = res.success;
        } else if (activeTab === 'formacao') {
            const res = await criarPerguntaFormacao(newText, newTargetFormacao);
            success = res.success;
        }

        if (success) {
            setNewText("");
            await carregarTudo();
        } else {
            alert("Erro ao criar métrica.");
        }
        setIsSubmitting(false);
    };

    const handleToggle = async (p: PerguntaQuizGroup, tipo: 'cultura' | 'satisfacao' | 'formacao') => {
        let res;
        if (tipo === 'cultura') {
            res = await alterarStatusCultura(p.id, p.status === 'Ativa' ? 'Inativa' : 'Ativa');
        } else if (tipo === 'satisfacao') {
            res = await alterarStatusSatisfacao(p.id, !p.ativo);
        } else {
            res = await alterarStatusFormacao(p.id, !p.ativo);
        }

        if (res?.success) await carregarTudo();
        else alert("Erro ao alterar status.");
    };

    const handleDelete = async (id: string, tabela: string) => {
        if (!window.confirm("Atenção! Ao apagar esta pergunta, poderá quebrar relatórios antigos. É SEMPRE RECOMENDADO apenas Inativar! Deseja mesmo purgar?")) return;
        const res = await deletarPerguntaGlobal(id, tabela);
        if (res.success) await carregarTudo();
        else alert("A pergunta possui respostas na fábrica (Restrição Foreign Key). Não é possível apagar.");
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse text-slate-500 font-mono">A calibrar Central de Inquéritos 360...</div>;

    return (
        <div className="p-6 space-y-6 max-w-[1200px] mx-auto pb-32 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-5 rounded-xl shadow-sm border border-slate-200 gap-6">
                <div className="flex items-center gap-4 shrink-0">
                    <LayoutGrid className="w-10 h-10 text-indigo-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Central Universal de Quizzes 360</h1>
                        <p className="text-slate-500 text-sm">Controle de Inquéritos para Quiosques Fabris (Cultura, Satisfação e Academia).</p>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATOR */}
            <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
                <button 
                    onClick={() => setActiveTab('lideranca')}
                    className={`flex-1 flex justify-center items-center gap-3 py-3 px-4 text-sm font-bold rounded-lg transition-all ${activeTab === 'lideranca' ? 'bg-white shadow-md text-blue-700 scale-100' : 'text-slate-500 hover:text-slate-700 scale-95 opacity-80'}`}
                >
                    <Users size={18} /> Cultura & Liderança (Bottom-Up)
                </button>
                <button 
                    onClick={() => setActiveTab('satisfacao')}
                    className={`flex-1 flex justify-center items-center gap-3 py-3 px-4 text-sm font-bold rounded-lg transition-all ${activeTab === 'satisfacao' ? 'bg-white shadow-md text-pink-600 scale-100' : 'text-slate-500 hover:text-slate-700 scale-95 opacity-80'}`}
                >
                    <HeartHandshake size={18} /> Satisfação de Clima (Anónimo)
                </button>
                <button 
                    onClick={() => setActiveTab('formacao')}
                    className={`flex-1 flex justify-center items-center gap-3 py-3 px-4 text-sm font-bold rounded-lg transition-all ${activeTab === 'formacao' ? 'bg-white shadow-md text-orange-600 scale-100' : 'text-slate-500 hover:text-slate-700 scale-95 opacity-80'}`}
                >
                    <GraduationCap size={18} /> Avaliação Formação (Academia)
                </button>
            </div>

            {/* CREATOR WIDGET */}
            <Card className={`shadow-md border-t-4 ${activeTab === 'lideranca' ? 'border-t-blue-500' : activeTab === 'satisfacao' ? 'border-t-pink-500' : 'border-t-orange-500'}`}>
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pt-5 pb-4">
                    <CardTitle className="text-lg text-slate-800 font-bold flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Adicionar Pergunta ao Quiosque
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        {activeTab === 'lideranca' && (
                            <div className="flex flex-col w-full md:w-[250px]">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Foco Avaliativo</span>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button onClick={() => setNewTargetCultura('Liderança')} className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 text-sm font-semibold rounded-md transition-all ${newTargetCultura === 'Liderança' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Líder</button>
                                    <button onClick={() => setNewTargetCultura('Cultura')} className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 text-sm font-semibold rounded-md transition-all ${newTargetCultura === 'Cultura' ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>Fábrica</button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'formacao' && (
                            <div className="flex flex-col w-full md:w-[300px]">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Quem está a ser Avaliado?</span>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button onClick={() => setNewTargetFormacao('Avaliar Formador')} className={`flex-1 flex justify-center items-center gap-2 py-2 px-1 text-sm font-semibold rounded-md transition-all ${newTargetFormacao === 'Avaliar Formador' ? 'bg-white shadow text-orange-700' : 'text-slate-500 hover:text-slate-700'}`}>O Mestre</button>
                                    <button onClick={() => setNewTargetFormacao('Avaliar Formando')} className={`flex-1 flex justify-center items-center gap-2 py-2 px-1 text-sm font-semibold rounded-md transition-all ${newTargetFormacao === 'Avaliar Formando' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>O Aprendiz</button>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex-1 w-full">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Interrogação do Inquérito</span>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={
                                        activeTab === 'lideranca' ? "Ex: Sentiu apoio logístico do seu Coordenador hoje?" :
                                        activeTab === 'satisfacao' ? "Ex: Hoje o clima de trabalho entre colegas foi positivo?" :
                                        "Ex: O formador explicou detalhadamente o processo da máquina?"
                                    }
                                    className="flex-1 h-11 px-4 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    value={newText}
                                    onChange={(e) => setNewText(e.target.value)}
                                    maxLength={150}
                                />
                                <Button className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold" onClick={handleCreate} disabled={!newText.trim() || isSubmitting}>
                                    {isSubmitting ? "A Guardar..." : "Injetar Métrica"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* LISTINGS */}
            <div className="space-y-4 pt-4">
                {activeTab === 'lideranca' && perguntasCultura.map(p => (
                    <Card key={p.id} className={`transition-all ${p.status === 'Inativa' ? 'opacity-60 bg-slate-50' : 'bg-white hover:border-blue-200'}`}>
                        <CardContent className="p-4 flex justify-between items-center gap-4">
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-900 text-lg leading-tight">{p.texto_pergunta}</h4>
                                <div className="flex gap-2 mt-2 items-center">
                                    <Badge variant="outline" className={p.status === 'Ativa' ? 'text-green-600 border-green-200 bg-green-50' : 'text-slate-400'}>{p.status}</Badge>
                                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 uppercase font-bold tracking-widest">{p.tipo_alvo}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => handleToggle(p, 'cultura')} className={p.status === 'Ativa' ? "text-amber-500 border-amber-200" : "text-emerald-500 border-emerald-200"}>
                                    {p.status === 'Ativa' ? <XCircle size={20} /> : <CheckCircle size={20}/>}
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => handleDelete(p.id, 'quiz_cultura_perguntas')} className="text-rose-500 border-rose-100 hover:bg-rose-50"><Trash2 size={20} /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {activeTab === 'satisfacao' && perguntasSatisfacao.map(p => (
                    <Card key={p.id} className={`transition-all ${!p.ativo ? 'opacity-60 bg-slate-50' : 'bg-white hover:border-pink-200'}`}>
                        <CardContent className="p-4 flex justify-between items-center gap-4">
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-900 text-lg leading-tight">{p.texto_pergunta}</h4>
                                <div className="flex gap-2 mt-2">
                                    <Badge variant="outline" className={p.ativo ? 'text-green-600 border-green-200 bg-green-50' : 'text-slate-400'}>{p.ativo ? 'Ativa' : 'Inativa'}</Badge>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => handleToggle(p, 'satisfacao')} className={p.ativo ? "text-amber-500 border-amber-200" : "text-emerald-500 border-emerald-200"}>
                                    {p.ativo ? <XCircle size={20} /> : <CheckCircle size={20}/>}
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => handleDelete(p.id, 'quiz_satisfacao_perguntas')} className="text-rose-500 border-rose-100 hover:bg-rose-50"><Trash2 size={20} /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {activeTab === 'formacao' && perguntasFormacao.map(p => (
                    <Card key={p.id} className={`transition-all ${!p.ativo ? 'opacity-60 bg-slate-50' : 'bg-white hover:border-orange-200'}`}>
                        <CardContent className="p-4 flex justify-between items-center gap-4">
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-900 text-lg leading-tight">{p.texto_pergunta}</h4>
                                <div className="flex gap-2 mt-2 items-center">
                                    <Badge variant="outline" className={p.ativo ? 'text-green-600 border-green-200 bg-green-50' : 'text-slate-400'}>{p.ativo ? 'Ativa' : 'Inativa'}</Badge>
                                    <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold tracking-widest ${p.alvo_avaliacao === 'Avaliar Formador' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>{p.alvo_avaliacao}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => handleToggle(p, 'formacao')} className={p.ativo ? "text-amber-500 border-amber-200" : "text-emerald-500 border-emerald-200"}>
                                    {p.ativo ? <XCircle size={20} /> : <CheckCircle size={20}/>}
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => handleDelete(p.id, 'quiz_formacao_perguntas')} className="text-rose-500 border-rose-100 hover:bg-rose-50"><Trash2 size={20} /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

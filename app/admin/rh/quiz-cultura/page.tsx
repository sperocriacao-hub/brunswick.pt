"use client";

import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, Trash2, Users, Target, Search } from 'lucide-react';
import { criarPergunta, listarPerguntas, alterarStatusPergunta, deletarPergunta, PerguntaQuiz } from './actions';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function GestaoQuizCulturaHR() {
    const [perguntas, setPerguntas] = useState<PerguntaQuiz[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newQuestionText, setNewQuestionText] = useState("");
    const [newQuestionType, setNewQuestionType] = useState<'Liderança' | 'Cultura'>('Liderança');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        carregar();
    }, []);

    const carregar = async () => {
        setIsLoading(true);
        const res = await listarPerguntas();
        if (res.success && res.data) {
            setPerguntas(res.data);
        }
        setIsLoading(false);
    };

    const handleCreate = async () => {
        if (!newQuestionText.trim()) return;
        setIsSubmitting(true);
        const res = await criarPergunta(newQuestionText, newQuestionType);
        if (res.success) {
            setNewQuestionText("");
            await carregar();
        } else {
            alert("Erro a criar: " + res.error);
        }
        setIsSubmitting(false);
    };

    const handleToggleStatus = async (p: PerguntaQuiz) => {
        const novoStatus = p.status === 'Ativa' ? 'Inativa' : 'Ativa';
        const res = await alterarStatusPergunta(p.id, novoStatus);
        if (res.success) {
            await carregar();
        } else {
            alert("Erro a alterar status: " + res.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Se apagar a pergunta, perderá também o cruzamento desta métrica com respostas antigas numéricas! Prefere apenas INATIVAR?")) return;
        const res = await deletarPergunta(id);
        if (res.success) {
            await carregar();
        } else {
            alert("Não é possível apagar pois já tem dezenas de respostas associadas na fábrica. Desative-a em vez de apagar.");
        }
    };

    const perguntasLider = perguntas.filter(p => p.tipo_alvo === 'Liderança');
    const perguntasCultura = perguntas.filter(p => p.tipo_alvo === 'Cultura');

    if (isLoading) return <div className="p-10 text-center animate-pulse text-slate-500 font-mono">A carregar métricas de quiz...</div>;

    return (
        <div className="p-6 space-y-6 max-w-[1200px] mx-auto pb-32 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-5 rounded-xl shadow-sm border border-slate-200 gap-6">
                <div className="flex items-center gap-4 shrink-0">
                    <Target className="w-10 h-10 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestor do Banco de Perguntas</h1>
                        <p className="text-slate-500 text-sm">Edição do Quiz Diário ( Bottom-Up ) feito nos Quiosques da Fábrica.</p>
                    </div>
                </div>
            </div>

            {/* Criador de Novas */}
            <Card className="border-blue-100 shadow-md">
                <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                    <CardTitle className="text-lg text-blue-900 font-bold flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-600" /> Formular Nova Métrica
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="flex flex-col w-full md:w-[250px]">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Foco da Pergunta</span>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setNewQuestionType('Liderança')}
                                    className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 text-sm font-semibold rounded-md transition-all ${newQuestionType === 'Liderança' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Users size={16} /> Liderança
                                </button>
                                <button
                                    onClick={() => setNewQuestionType('Cultura')}
                                    className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 text-sm font-semibold rounded-md transition-all ${newQuestionType === 'Cultura' ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Target size={16} /> Cultura
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 w-full">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Texto no Quiosque (Que surge no Ecrã)</span>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={newQuestionType === 'Liderança' ? "Ex: Hoje, sentiu o apoio da sua Coordenação no posto?" : "Ex: Em repouso considerou hoje a fábrica termicamente confortável?"}
                                    className="flex-1 h-11 px-4 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={newQuestionText}
                                    onChange={(e) => setNewQuestionText(e.target.value)}
                                    maxLength={150}
                                />
                                <Button 
                                    className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                    onClick={handleCreate}
                                    disabled={!newQuestionText.trim() || isSubmitting}
                                >
                                    {isSubmitting ? "A Guardar..." : "Publicar"}
                                </Button>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">*{newQuestionType === 'Liderança' ? 'Esta métrica irá cruzar diretamente o Score com os Coordenadores/Supervisores envolvidos.' : 'Não afeta avaliações individuais. Apenas o ambiente corporativo.'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Pilares Liderança */}
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 border-b pb-2"><Users className="text-blue-500"/> Array de Liderança</h3>
                    {perguntasLider.length === 0 && <p className="text-slate-400 text-sm italic py-4">Nenhuma questão programada.</p>}
                    {perguntasLider.map(p => (
                        <Card key={p.id} className={`transition-all ${p.status === 'Inativa' ? 'opacity-60 bg-slate-50' : 'bg-white hover:border-blue-200'}`}>
                            <CardContent className="p-4 flex justify-between items-center gap-4">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-900 text-lg leading-tight">{p.texto_pergunta}</h4>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant="outline" className={p.status === 'Ativa' ? 'text-green-600 border-green-200 bg-green-50' : 'text-slate-400'}>
                                            {p.status}
                                        </Badge>
                                        <span className="text-xs text-slate-400 font-mono flex items-center">
                                            A cruzar com Perfil 360 do Líder...
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => handleToggleStatus(p)} className={p.status === 'Ativa' ? "text-amber-500 border-amber-200" : "text-emerald-500 border-emerald-200"}>
                                        {p.status === 'Ativa' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5"/>}
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleDelete(p.id)} className="text-rose-500 border-rose-100 hover:bg-rose-50">
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Pilares Cultura */}
                <div className="space-y-4">
                     <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 border-b pb-2"><Target className="text-emerald-500"/> Array de Cultura Organizacional</h3>
                     {perguntasCultura.length === 0 && <p className="text-slate-400 text-sm italic py-4">Nenhuma questão programada.</p>}
                     {perguntasCultura.map(p => (
                        <Card key={p.id} className={`transition-all ${p.status === 'Inativa' ? 'opacity-60 bg-slate-50' : 'bg-white hover:border-emerald-200'}`}>
                            <CardContent className="p-4 flex justify-between items-center gap-4">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-900 text-lg leading-tight">{p.texto_pergunta}</h4>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant="outline" className={p.status === 'Ativa' ? 'text-green-600 border-green-200 bg-green-50' : 'text-slate-400'}>
                                            {p.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => handleToggleStatus(p)} className={p.status === 'Ativa' ? "text-amber-500 border-amber-200" : "text-emerald-500 border-emerald-200"}>
                                        {p.status === 'Ativa' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5"/>}
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleDelete(p.id)} className="text-rose-500 border-rose-100 hover:bg-rose-50">
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

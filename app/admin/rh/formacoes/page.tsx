"use client";

import React, { useState, useEffect } from 'react';
import { Plus, GraduationCap, CheckCircle, Crosshair, Users, MapPin, Search, Calendar, Star, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    listarFormacoes, criarPlanoFormacao, atualizarStatusFormacao, 
    obterTopFormadores, listarFormadoresParaSelect, listarEstacoesParaSelect,
    PlanoFormacao 
} from './actions';

export default function GestaoFormacoesRH() {
    const [viewMode, setViewMode] = useState<'ativos' | 'historico' | 'ranking'>('ativos');
    const [formacoes, setFormacoes] = useState<PlanoFormacao[]>([]);
    const [topFormadores, setTopFormadores] = useState<{nome: string, rating: string, votos: number}[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dicionários para novo formulário
    const [operadoresList, setOperadoresList] = useState<any[]>([]);
    const [estacoesList, setEstacoesList] = useState<any[]>([]);

    // Form
    const [showForm, setShowForm] = useState(false);
    const [newFormando, setNewFormando] = useState("");
    const [newFormador, setNewFormador] = useState("");
    const [newEstacao, setNewEstacao] = useState("");
    const [newNotes, setNewNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        carregarDashboard();
    }, []);

    const carregarDashboard = async () => {
        setIsLoading(true);
        const [resForms, resTop, resOps, resEsts] = await Promise.all([
            listarFormacoes(),
            obterTopFormadores(),
            listarFormadoresParaSelect(),
            listarEstacoesParaSelect()
        ]);
        
        if (resForms.success && resForms.data) setFormacoes(resForms.data);
        if (resTop.success && resTop.data) setTopFormadores(resTop.data);
        
        setOperadoresList(resOps);
        setEstacoesList(resEsts);
        setIsLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFormando || !newFormador || !newEstacao) return;
        setIsSubmitting(true);
        
        const dto = {
            formando_id: newFormando,
            formador_id: newFormador,
            estacao_id: newEstacao,
            data_inicio: new Date().toISOString().split('T')[0],
            notas_gerais: newNotes
        };

        const res = await criarPlanoFormacao(dto);
        if (res.success) {
            setShowForm(false);
            setNewFormando(""); setNewFormador(""); setNewEstacao(""); setNewNotes("");
            await carregarDashboard();
        } else {
            alert("Erro ao criar o plano de Formação ILUO: " + res.error);
        }
        setIsSubmitting(false);
    };

    const handleStatusChange = async (id: string, novoStatus: 'Concluída' | 'Suspensa' | 'Reprovada') => {
        if (!window.confirm(`Deseja marcar esta formação como ${novoStatus}?`)) return;
        const res = await atualizarStatusFormacao(id, novoStatus);
        if (res.success) await carregarDashboard();
        else alert("Erro: " + res.error);
    };

    const emCurso = formacoes.filter(f => f.status === 'Em Curso' || f.status === 'Planeado');
    const historico = formacoes.filter(f => f.status !== 'Em Curso' && f.status !== 'Planeado');

    if (isLoading) return <div className="p-10 text-center animate-pulse text-indigo-500 font-mono font-bold">A carregar Academia Fabril...</div>;

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto pb-32 animate-in fade-in duration-500">
            {/* Header Mestre e Aprendiz */}
            <div className="flex flex-col md:flex-row justify-between md:items-center bg-indigo-900 p-8 rounded-3xl shadow-xl gap-6 relative overflow-hidden">
                <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-indigo-800 p-4 rounded-2xl shadow-inner">
                        <GraduationCap className="w-12 h-12 text-indigo-200" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Academia Fabril Brunswick</h1>
                        <p className="text-indigo-300 text-sm mt-1 max-w-xl leading-relaxed">Painel de Controlo Dinâmico para monitorizar 'New Hires', planeamento ILUO prático, acompanhamento de formadores e Inquéritos Ocultos sobre a Qualidade do Treino prático no Chão de Fábrica.</p>
                    </div>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} className="h-12 px-6 bg-white hover:bg-slate-100 text-indigo-900 font-bold tracking-widest text-sm rounded-xl shrink-0 group transition-all z-10 shadow-lg shadow-indigo-900/50">
                        <Plus className="w-5 h-5 mr-2 group-hover:scale-125 transition-transform" /> Iniciar Formação
                    </Button>
                )}
                {/* Decoration */}
                <div className="absolute -right-20 -top-20 opacity-10 pointer-events-none">
                    <Crosshair className="w-[400px] h-[400px] text-white animate-spin-slow" />
                </div>
            </div>

            {/* TAB NAVIGATOR */}
            <div className="flex gap-2">
                <button 
                    onClick={() => setViewMode('ativos')}
                    className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-all border-b-2 ${viewMode === 'ativos' ? 'bg-white border-blue-600 text-blue-700 shadow-sm' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200'}`}
                >
                    <div className="flex items-center gap-2"><MapPin size={16}/> Formações Em Curso <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200">{emCurso.length}</Badge></div>
                </button>
                <button 
                    onClick={() => setViewMode('historico')}
                    className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-all border-b-2 ${viewMode === 'historico' ? 'bg-white border-slate-600 text-slate-800 shadow-sm' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200'}`}
                >
                    <div className="flex items-center gap-2"><CheckCircle size={16}/> Histórico ILUO</div>
                </button>
                <button 
                    onClick={() => setViewMode('ranking')}
                    className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-all border-b-2 ${viewMode === 'ranking' ? 'bg-indigo-900 border-indigo-500 text-indigo-100 shadow-sm' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200'}`}
                >
                    <div className="flex items-center gap-2"><Star size={16}/> Top Formadores</div>
                </button>
            </div>

            {/* FORMULÁRIO COLAPSO */}
            {showForm && (
                <Card className="border-indigo-100 shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    <CardHeader className="bg-indigo-50 border-b border-indigo-100">
                        <CardTitle className="text-xl text-indigo-900 font-bold">Planear Entrada na Linha</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">O Aprendiz (New Hire)</label>
                                    <select required value={newFormando} onChange={e => setNewFormando(e.target.value)} className="w-full h-11 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                                        <option value="">Selecione Operador...</option>
                                        {operadoresList.map(o => <option key={o.id} value={o.id}>{o.numero_operador} - {o.nome_operador}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-orange-500 uppercase">O Formador ILUO</label>
                                    <select required value={newFormador} onChange={e => setNewFormador(e.target.value)} className="w-full h-11 px-3 border border-orange-300 bg-orange-50 rounded-lg focus:ring-2 focus:ring-orange-500">
                                        <option value="">Selecione quem vai ensinar...</option>
                                        {operadoresList.map(o => <option key={o.id} value={o.id}>{o.numero_operador} - {o.nome_operador}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Onde ensina? (Estação Fabril)</label>
                                    <select required value={newEstacao} onChange={e => setNewEstacao(e.target.value)} className="w-full h-11 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                                        <option value="">Selecione o local/Habilidade...</option>
                                        {estacoesList.map(e => <option key={e.id} value={e.id}>{e.areas_fabrica?.nome_area} » {e.nome_estacao}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Anotações Preliminares do RH</label>
                                <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Ex: Este jovem precisa de aprender a coser cabedal primeiro..." className="w-full h-24 p-3 border border-slate-300 rounded-lg resize-none" />
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 font-bold" disabled={isSubmitting}>{isSubmitting ? "A Registar..." : "Lançar Plano de Formação"}</Button>
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* VIEWS */}
            {(viewMode === 'ativos' || viewMode === 'historico') && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {(viewMode === 'ativos' ? emCurso : historico).length === 0 && (
                        <div className="col-span-full p-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-600">Sem registos nesta categoria</h3>
                        </div>
                    )}
                    
                    {(viewMode === 'ativos' ? emCurso : historico).map(formacao => (
                        <Card key={formacao.id} className="border-slate-200 hover:shadow-lg transition-all break-inside-avoid">
                            <CardContent className="p-0">
                                {/* Flex Row para Operadores */}
                                <div className="flex flex-col md:flex-row border-b border-slate-100">
                                    <div className="flex-1 p-5 md:border-r border-slate-100 bg-slate-50 relative group">
                                        <div className="absolute top-0 right-0 px-2 py-1 bg-slate-200 text-[10px] font-bold text-slate-500 rounded-bl-lg uppercase tracking-widest">
                                            Aprendiz / Formando
                                        </div>
                                        <div className="flex flex-col items-center text-center mt-2">
                                            <div className="w-14 h-14 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center mb-3 shadow-sm">
                                                <Users className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <span className="text-xs font-mono text-slate-400 font-bold">{formacao.formando?.numero_operador}</span>
                                            <h4 className="font-black text-slate-800 text-lg leading-tight mt-1">{formacao.formando?.nome_operador}</h4>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-5 bg-orange-50/30 relative group">
                                        <div className="absolute top-0 right-0 px-2 py-1 bg-orange-200 text-[10px] font-bold text-orange-800 rounded-bl-lg uppercase tracking-widest">
                                            Professor Responsável
                                        </div>
                                        <div className="flex flex-col items-center text-center mt-2">
                                            <div className="w-14 h-14 bg-white border-2 border-orange-200 rounded-full flex items-center justify-center mb-3 shadow-sm">
                                                <GraduationCap className="w-6 h-6 text-orange-500" />
                                            </div>
                                            <span className="text-xs font-mono text-orange-400 font-bold">{formacao.formador?.numero_operador}</span>
                                            <h4 className="font-black text-orange-900 text-lg leading-tight mt-1">{formacao.formador?.nome_operador}</h4>
                                        </div>
                                    </div>
                                </div>
                                {/* Meta Data */}
                                <div className="p-5 flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={`font-bold ${formacao.status === 'Em Curso' ? 'bg-blue-100 border-blue-400 text-blue-800 animate-pulse' : formacao.status === 'Concluída' ? 'bg-green-100 border-green-400 text-green-800' : 'bg-slate-100'}`}>{formacao.status}</Badge>
                                        <div className="flex items-center text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded">
                                            <MapPin className="w-4 h-4 mr-2 text-slate-400" /> {formacao.estacao?.nome_estacao}
                                        </div>
                                    </div>
                                    {formacao.notas_gerais && (
                                        <p className="text-sm text-slate-500 italic border-l-2 border-blue-200 pl-3">"{formacao.notas_gerais}"</p>
                                    )}
                                    <div className="text-xs font-mono text-slate-400 flex items-center justify-between mt-2">
                                        <span>Início: <strong className="text-slate-600">{new Date(formacao.data_inicio).toLocaleDateString('pt-PT')}</strong></span>
                                        {viewMode === 'ativos' ? (
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={() => handleStatusChange(formacao.id, 'Concluída')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-7 px-3 text-[10px]">Aprovar ILUO (U)</Button>
                                                <Button size="sm" onClick={() => handleStatusChange(formacao.id, 'Reprovada')} className="bg-rose-100 text-rose-700 hover:bg-rose-200 hover:text-rose-800 font-bold h-7 px-3 text-[10px]">Reprovar (I)</Button>
                                            </div>
                                        ) : (
                                            <span>Fim: <strong className="text-slate-600">{formacao.data_fim ? new Date(formacao.data_fim).toLocaleDateString('pt-PT') : 'N/A'}</strong></span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* RANKING TOP FORMADORES */}
            {viewMode === 'ranking' && (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm animate-in fade-in duration-700">
                    <div className="text-center mb-10">
                        <Star className="w-16 h-16 text-yellow-400 mx-auto fill-yellow-400 mb-4" />
                        <h2 className="text-3xl font-black text-slate-900">Mural de Mérito ILUO</h2>
                        <p className="text-slate-500 max-w-lg mx-auto mt-2">Gráfico extraído em tempo real a partir das respostas submetidas nos <b>Quiosques de Formação</b>. Classificação dos Colaboradores com maior impacto no Chão de Fábrica.</p>
                    </div>

                    <div className="max-w-2xl mx-auto space-y-4">
                        {topFormadores.length === 0 ? (
                            <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <span className="text-slate-500 font-bold">Ainda não existem Formação-Quizzes submetidos pelos alunos.</span>
                            </div>
                        ) : (
                            topFormadores.map((t, i) => (
                                <div key={i} className={`flex items-center gap-6 p-4 rounded-xl border ${i === 0 ? 'bg-amber-50 border-amber-200 shadow-md' : i === 1 ? 'bg-slate-50 border-slate-200' : 'bg-orange-50/50 border-orange-100'} transition-transform hover:scale-[1.02]`}>
                                    <div className={`w-12 h-12 flex items-center justify-center font-black text-xl rounded-full text-white ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-400' : 'bg-blue-300'}`}>
                                        #{i+1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-xl font-bold text-slate-800">{t.nome}</h4>
                                        <p className="text-sm text-slate-500 font-medium">{t.votos} Inquéritos Formulados nos Kiosks</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex border border-slate-200 rounded-lg overflow-hidden shadow-inner">
                                            <div className="bg-slate-800 text-white font-black text-2xl px-4 py-2">{t.rating}</div>
                                            <div className="bg-white flex items-center justify-center px-4 font-bold text-slate-400">/ 4.0</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

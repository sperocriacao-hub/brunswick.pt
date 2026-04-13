"use client";

import React, { useState, useEffect } from 'react';
import { Plus, GraduationCap, CheckCircle, Crosshair, Users, MapPin, Search, Calendar, Star, ShieldAlert, Edit3, Map, Save, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    listarFormacoes, criarPlanoFormacao, atualizarStatusFormacao, 
    obterTopFormadores, listarFormadoresParaSelect, listarEstacoesParaSelect,
    preverEvolucaoILUO, editarFormacao, obterMatrizIluoGlobal, PlanoFormacao 
} from './actions';

export default function GestaoFormacoesRH() {
    const [viewMode, setViewMode] = useState<'ativos' | 'historico' | 'ranking' | 'gantt' | 'matriz'>('ativos');
    const [formacoes, setFormacoes] = useState<PlanoFormacao[]>([]);
    const [topFormadores, setTopFormadores] = useState<{nome: string, rating: string, votos: number}[]>([]);
    const [matrizGlobal, setMatrizGlobal] = useState<{operadores: any[], estacoes: any[]}>({ operadores: [], estacoes: [] });

    // Inline Edit State
    const [editModeId, setEditModeId] = useState<string | null>(null);
    const [editDataFim, setEditDataFim] = useState("");
    const [editNotas, setEditNotas] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Dicionários para novo formulário
    const [operadoresList, setOperadoresList] = useState<any[]>([]);
    const [estacoesList, setEstacoesList] = useState<any[]>([]);

    // Form
    const [showForm, setShowForm] = useState(false);
    const [newFormando, setNewFormando] = useState("");
    const [newFormador, setNewFormador] = useState("");
    const [newEstacao, setNewEstacao] = useState("");
    const [newDataFimPlaneada, setNewDataFimPlaneada] = useState("");
    const [newNotes, setNewNotes] = useState("");
    const [iluoPrediction, setIluoPrediction] = useState<{current: string, target: string} | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        carregarDashboard();
    }, []);

    const carregarDashboard = async () => {
        setIsLoading(true);
        const [resForms, resTop, resOps, resEsts, resMatriz] = await Promise.all([
            listarFormacoes(),
            obterTopFormadores(),
            listarFormadoresParaSelect(),
            listarEstacoesParaSelect(),
            obterMatrizIluoGlobal()
        ]);
        
        if (resForms.success && resForms.data) setFormacoes(resForms.data);
        if (resTop.success && resTop.data) setTopFormadores(resTop.data);
        if (resMatriz.success && resMatriz.data) setMatrizGlobal(resMatriz.data);
        
        setOperadoresList(resOps);
        setEstacoesList(resEsts);
        
        // Predição inicial baseada em datas
        const d = new Date();
        d.setDate(d.getDate() + 14); // default 2 semanas
        setNewDataFimPlaneada(d.toISOString().split('T')[0]);
        
        setIsLoading(false);
    };

    // Efeito para prever nível ILUO assim que o operador e a estação sejam selecionados
    useEffect(() => {
        if (newFormando && newEstacao) {
            preverEvolucaoILUO(newFormando, newEstacao).then(res => setIluoPrediction(res));
        } else {
            setIluoPrediction(null);
        }
    }, [newFormando, newEstacao]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFormando || !newFormador || !newEstacao) return;
        setIsSubmitting(true);
        
        const dto = {
            formando_id: newFormando,
            formador_id: newFormador,
            estacao_id: newEstacao,
            data_inicio: new Date().toISOString().split('T')[0],
            data_fim_estimada: newDataFimPlaneada,
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

    const handleSaveEdit = async (id: string) => {
        const res = await editarFormacao(id, editDataFim, editNotas);
        if (res.success) {
            setEditModeId(null);
            await carregarDashboard();
        } else {
            alert("Erro ao editar plano: " + res.error);
        }
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
                    onClick={() => setViewMode('gantt')}
                    className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-all border-b-2 ${viewMode === 'gantt' ? 'bg-white border-purple-600 text-purple-700 shadow-sm' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200'}`}
                >
                    <div className="flex items-center gap-2"><Calendar size={16}/> Roadmap Tático (Gantt)</div>
                </button>
                <button 
                    onClick={() => setViewMode('ranking')}
                    className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-all border-b-2 ${viewMode === 'ranking' ? 'bg-indigo-900 border-indigo-500 text-indigo-100 shadow-sm' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200'}`}
                >
                    <div className="flex items-center gap-2"><Star size={16}/> Top Formadores</div>
                </button>
                <button 
                    onClick={() => setViewMode('matriz')}
                    className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-all border-b-2 ${viewMode === 'matriz' ? 'bg-emerald-700 border-emerald-500 text-emerald-50 shadow-sm' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200'}`}
                >
                    <div className="flex items-center gap-2"><Map size={16}/> Relatório (Matriz ILUO)</div>
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
                            
                            {/* Intelligent Section */}
                            {iluoPrediction && (
                                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-emerald-100 p-2 rounded-lg"><Crosshair className="text-emerald-600" /></div>
                                        <div>
                                            <h4 className="font-bold text-emerald-900">Previsão de Crescimento ILUO</h4>
                                            <p className="text-sm text-emerald-700">Com base no currículo atual do operário nesta estação.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-center bg-slate-100 rounded-lg px-4 py-2 border border-slate-200">
                                            <span className="block text-[10px] uppercase font-bold text-slate-500">Atual</span>
                                            <span className="block font-black text-xl text-slate-700">{iluoPrediction.current}</span>
                                        </div>
                                        <div className="text-emerald-500 font-bold">➔</div>
                                        <div className="text-center bg-emerald-500 rounded-lg px-4 py-2 border border-emerald-600 shadow-sm">
                                            <span className="block text-[10px] uppercase font-bold text-emerald-100">Meta</span>
                                            <span className="block font-black text-xl text-white">{iluoPrediction.target}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Anotações Preliminares do RH</label>
                                    <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Ex: Este jovem precisa de aprender a coser cabedal primeiro..." className="w-full h-24 p-3 border border-slate-300 rounded-lg resize-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-purple-600 uppercase flex items-center gap-1"><Calendar size={14} /> Data Limite Estimada (Meta)</label>
                                    <input type="date" required value={newDataFimPlaneada} onChange={e => setNewDataFimPlaneada(e.target.value)} className="w-full h-11 px-3 border border-purple-200 bg-purple-50 rounded-lg focus:ring-2 focus:ring-purple-500 font-bold text-purple-900" />
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Usado no Gráfico de Roadmap</p>
                                </div>
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
                    
                    {(viewMode === 'ativos' ? emCurso : historico).map(formacao => {
                        const isVencida = viewMode === 'ativos' && formacao.status === 'Em Curso' && formacao.data_fim_estimada && new Date(formacao.data_fim_estimada).getTime() < new Date().getTime();
                        
                        return (
                        <Card key={formacao.id} className={`hover:shadow-lg transition-all break-inside-avoid ${isVencida ? 'border-rose-300 shadow-sm shadow-rose-200' : 'border-slate-200'}`}>
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
                                {editModeId === formacao.id ? (
                                    <div className="p-5 flex flex-col gap-4 bg-slate-50/50 border-t border-slate-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Data Limite (Meta)</label>
                                                <input type="date" value={editDataFim} onChange={e => setEditDataFim(e.target.value)} className="w-full h-9 px-2 border border-slate-300 rounded text-sm mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Anotações do Plano</label>
                                                <textarea value={editNotas} onChange={e => setEditNotas(e.target.value)} className="w-full h-16 p-2 border border-slate-300 rounded text-sm mt-1 resize-none" />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <Button size="sm" onClick={() => handleSaveEdit(formacao.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-8 px-4 text-xs"><Save className="w-4 h-4 mr-2"/> Guardar</Button>
                                            <Button size="sm" onClick={() => setEditModeId(null)} className="bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold h-8 px-4 text-xs"><X className="w-4 h-4 mr-2"/> Cancelar</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-5 flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className={`font-bold ${formacao.status === 'Em Curso' ? 'bg-blue-100 border-blue-400 text-blue-800 animate-pulse' : formacao.status === 'Concluída' ? 'bg-green-100 border-green-400 text-green-800' : 'bg-slate-100'}`}>{formacao.status}</Badge>
                                            {isVencida && <Badge className="bg-rose-500 text-white animate-bounce-slow border-rose-600 shadow-sm"><ShieldAlert className="w-3 h-3 mr-1" /> ATRASADO</Badge>}
                                            <div className="flex items-center text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded ml-auto">
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
                                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-slate-500 hover:bg-slate-100" onClick={() => { setEditModeId(formacao.id); setEditDataFim(formacao.data_fim_estimada || ""); setEditNotas(formacao.notas_gerais || ""); }}><Edit3 className="w-4 h-4"/></Button>
                                                </div>
                                            ) : (
                                                <span>Fim: <strong className="text-slate-600">{formacao.data_fim ? new Date(formacao.data_fim).toLocaleDateString('pt-PT') : 'N/A'}</strong></span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )})}
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

            {/* ROADMAP GANTT CHART (Visão Tática) */}
            {viewMode === 'gantt' && (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm animate-in fade-in duration-700 overflow-x-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Calendar className="text-purple-500" /> Timeline & Roadmap de Ensino</h2>
                        <p className="text-slate-500 mt-1 font-medium">Cronograma dos mestres e aprendizes no piso fabril. Usado para não sobrecarregar as linhas de produção com excesso de treinos simultâneos.</p>
                    </div>

                    <div className="min-w-[800px]">
                        {emCurso.length === 0 ? (
                            <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <span className="text-slate-500 font-bold">Sem operações de treino a circular na fábrica neste momento.</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {emCurso.map((f, i) => {
                                    // Math to calculate Gantt bar position relative to current month window
                                    const now = new Date();
                                    const start = new Date(f.data_inicio);
                                    const end = f.data_fim_estimada ? new Date(f.data_fim_estimada) : new Date(start.getTime() + (14 * 24 * 60 * 60 * 1000));
                                    
                                    // Very basic math for visual rep (Not pixel perfect timeline, but visual)
                                    // We create a relative timeline span of Next 30 Days.
                                    const msPerDay = 1000 * 60 * 60 * 24;
                                    const totalDays = Math.max((end.getTime() - start.getTime()) / msPerDay, 1);
                                    const daysPassed = Math.max((now.getTime() - start.getTime()) / msPerDay, 0);
                                    const progressPercent = Math.min((daysPassed / totalDays) * 100, 100);

                                    return (
                                        <div key={i} className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden group">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 font-bold uppercase">{f.estacao?.nome_estacao}</Badge>
                                                    <h4 className="font-bold text-slate-700">{f.formando?.nome_operador}</h4>
                                                    <span className="text-xs text-slate-400">c/</span>
                                                    <h4 className="font-bold text-orange-600">{f.formador?.nome_operador}</h4>
                                                </div>
                                                <div className="text-xs font-mono font-bold text-slate-500">
                                                    {start.toLocaleDateString('pt-PT')} — {end.toLocaleDateString('pt-PT')}
                                                </div>
                                            </div>

                                            {/* Bar */}
                                            <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden mt-2 relative">
                                                <div 
                                                    className={`h-full absolute left-0 top-0 bg-gradient-to-r ${progressPercent >= 100 ? 'from-rose-400 to-rose-500' : 'from-purple-400 to-purple-600'} transition-all`}
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                            
                                            {progressPercent >= 100 && (
                                                <div className="absolute top-1/2 -translate-y-1/2 right-4 bg-rose-500 text-white text-[10px] uppercase font-black px-2 py-1 rounded shadow-sm animate-pulse">
                                                    Excedeu Tempo Alvo! Verificar Graduação
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* GLOBAL ILUO MATRIX */}
            {viewMode === 'matriz' && (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm animate-in fade-in duration-700">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Map className="text-emerald-500" /> Relatório ILUO (Matriz Global)</h2>
                            <p className="text-slate-500 mt-1 font-medium">Cruzamento oficial de competências ativas de todos os operadores por Posto de Trabalho.</p>
                        </div>
                        <Button className="bg-slate-800 hover:bg-slate-700 font-bold" onClick={() => window.print()}>Imprimir Ficha</Button>
                    </div>

                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full text-sm text-left border-collapse min-w-max">
                            <thead>
                                <tr>
                                    <th className="bg-slate-100 text-slate-700 font-black p-3 border border-slate-200 sticky left-0 z-10 w-64 uppercase text-xs">Operador (RH)</th>
                                    {matrizGlobal.estacoes.map(est => (
                                        <th key={est.id} className="bg-slate-50 text-slate-600 font-bold p-3 border border-slate-200 text-center px-4 w-24">
                                            <div className="text-[9px] uppercase text-slate-400 mb-1">{est.areas_fabrica?.nome_area}</div>
                                            <div className="leading-tight">{est.nome_estacao}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {matrizGlobal.operadores.map((op, index) => (
                                    <tr key={op.operador_id} className="hover:bg-slate-50/50">
                                        <td className="p-3 border border-slate-200 bg-white sticky left-0 font-medium">
                                            <span className="text-xs font-mono text-slate-400 mr-2">{op.numero}</span>
                                            {op.nome}
                                        </td>
                                        {matrizGlobal.estacoes.map(est => {
                                            const val = op.skills[est.id];
                                            let colorClass = "text-slate-300";
                                            let bgClass = "bg-transparent";
                                            if (val === 'I') { colorClass = "text-slate-800"; bgClass = "bg-slate-200 border-slate-400"; }
                                            if (val === 'L') { colorClass = "text-amber-800"; bgClass = "bg-amber-100 border-amber-400"; }
                                            if (val === 'U') { colorClass = "text-blue-800"; bgClass = "bg-blue-100 border-blue-400"; }
                                            if (val === 'O') { colorClass = "text-emerald-800"; bgClass = "bg-emerald-100 border-emerald-400"; }
                                            
                                            // Empty cell logic
                                            if (!val) {
                                                return <td key={est.id} className="p-3 border border-slate-200 text-center"><span className="text-slate-200 text-xs">-</span></td>;
                                            }

                                            return (
                                                <td key={est.id} className="p-1 border border-slate-200 text-center">
                                                    <div className={`w-8 h-8 rounded shrink-0 mx-auto font-black flex items-center justify-center text-sm border-2 ${bgClass} ${colorClass}`}>
                                                        {val}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

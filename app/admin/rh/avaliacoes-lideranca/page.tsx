"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Activity, TrendingUp, CheckCircle, Save, Check, ChevronsUpDown, Search, UserCheck, Calendar, Users, Settings, Target, HeartHandshake, Briefcase, Filter, X, Star } from 'lucide-react';
import { AvaliacaoLiderancaDTO, submeterAvaliacaoLideranca, getFeedbackQuizAggregado, QuizFeedbacksAgg } from './actions';
import { carregarEquipaLideranca } from './actions';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const PILLARS_LIDERANCA = [
    { key: 'hst', label: 'HST', icon: Shield, color: 'text-orange-500' },
    { key: 'epi', label: 'EPI', icon: Shield, color: 'text-blue-500' },
    { key: 'limpeza', label: 'Limpeza (5S)', icon: Activity, color: 'text-green-500' },
    { key: 'eficiencia', label: 'Eficiência', icon: TrendingUp, color: 'text-red-500' },
    { key: 'objetivos', label: 'Objetivos', icon: CheckCircle, color: 'text-indigo-500' },
    { key: 'atitude', label: 'Atitude', icon: Activity, color: 'text-pink-500' },
    { key: 'gestao_motivacao', label: 'Gestão Motivação', icon: Activity, color: 'text-orange-600' },
    { key: 'desenvolvimento', label: 'Desenv. Habilidades', icon: Users, color: 'text-blue-600' },
    { key: 'desperdicios', label: 'Gestão Desperdícios', icon: Activity, color: 'text-red-600' },
    { key: 'qualidade', label: 'Gestão da Qualidade', icon: CheckCircle, color: 'text-purple-600' },
    { key: 'operacoes', label: 'Gestão Operações', icon: Settings, color: 'text-slate-600' },
    { key: 'melhoria', label: 'Melhoria Contínua', icon: TrendingUp, color: 'text-green-600' },
    { key: 'kpis', label: 'Indicadores (KPIs)', icon: Target, color: 'text-indigo-600' },
    { key: 'cultura', label: 'Guardião da Cultura', icon: HeartHandshake, color: 'text-pink-600' },
] as const;

type OperadorLideranca = {
    id: string;
    numero_operador: string;
    nome_operador: string;
    funcao: string;
    area_nome: string;
};

type FormEdicao = {
    hst: number;
    epi: number;
    limpeza: number;
    eficiencia: number;
    objetivos: number;
    atitude: number;
    gestao_motivacao: number;
    desenvolvimento: number;
    desperdicios: number;
    qualidade: number;
    operacoes: number;
    melhoria: number;
    kpis: number;
    cultura: number;
    notasFinais: string;
};

export default function AvaliacoesLideranca() {
    const [operadores, setOperadores] = useState<OperadorLideranca[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedFuncao, setSelectedFuncao] = useState<string | null>(null);

    // Estado local de formulários e saves
    const [evaluations, setEvaluations] = useState<Record<string, FormEdicao>>({});
    const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

    const [showFilters, setShowFilters] = useState(false);

    // States de Feedback Anónimo (Bottom-Up Quiz)
    const [selectedFeedbackLeader, setSelectedFeedbackLeader] = useState<string | null>(null);
    const [feedbacksAgregados, setFeedbacksAgregados] = useState<QuizFeedbacksAgg[]>([]);
    const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);

    useEffect(() => {
        const fetchEquipa = async () => {
            setIsLoading(true);
            const res = await carregarEquipaLideranca();
            if (res.success && res.operadores) {
                const mapped = res.operadores.map((op: any) => ({
                    id: op.id,
                    numero_operador: op.numero_operador,
                    nome_operador: op.nome_operador,
                    funcao: op.funcao,
                    area_nome: (op.areas_fabrica as any)?.nome_area || 'Geral'
                }));
                // Sort by name
                mapped.sort((a: any, b: any) => a.nome_operador.localeCompare(b.nome_operador));
                setOperadores(mapped);
            } else {
                setErrorMsg(res.error || "Acesso Negado");
            }
            setIsLoading(false);
        };
        fetchEquipa();
    }, []);

    const funcoesDisponiveis = useMemo(() => {
        return Array.from(new Set(operadores.map(e => e.funcao).filter(Boolean))).sort();
    }, [operadores]);

    const filteredEmployees = useMemo(() => {
        if (!selectedFuncao) return [];
        return operadores.filter(e => e.funcao === selectedFuncao);
    }, [operadores, selectedFuncao]);

    useEffect(() => {
        if (filteredEmployees.length === 0) return;

        const newForms = { ...evaluations };
        filteredEmployees.forEach(emp => {
            if (!newForms[emp.id]) {
                newForms[emp.id] = {
                    hst: 3.0, epi: 3.0, limpeza: 3.0, eficiencia: 3.0, objetivos: 3.0, atitude: 3.0,
                    gestao_motivacao: 3.0, desenvolvimento: 3.0, desperdicios: 3.0, qualidade: 3.0,
                    operacoes: 3.0, melhoria: 3.0, kpis: 3.0, cultura: 3.0, notasFinais: ""
                };
            }
        });
        setEvaluations(newForms);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredEmployees]);

    const handleScoreChange = (empId: string, pillarKey: keyof FormEdicao, value: number) => {
        setEvaluations(prev => ({
            ...prev,
            [empId]: {
                ...prev[empId],
                [pillarKey]: value
            }
        }));
        setSavedStates(prev => ({ ...prev, [empId]: false }));
    };

    const calculateDailyScore = (evalData: FormEdicao | undefined) => {
        if (!evalData) return "0.0";
        const sum = evalData.hst + evalData.epi + evalData.limpeza + evalData.eficiencia + evalData.objetivos + evalData.atitude + evalData.gestao_motivacao + evalData.desenvolvimento + evalData.desperdicios + evalData.qualidade + evalData.operacoes + evalData.melhoria + evalData.kpis + evalData.cultura;
        return (sum / 14).toFixed(1);
    };

    const getScoreColor = (scoreStr: string) => {
        const score = Number(scoreStr);
        if (score >= 3.5) return "bg-green-100 text-green-700 border-green-300";
        if (score >= 2.5) return "bg-yellow-100 text-yellow-700 border-yellow-300";
        return "bg-red-100 text-red-700 border-red-300";
    };

    const submitAvaliacao = async (emp: OperadorLideranca) => {
        const form = evaluations[emp.id];
        if (!form) return;

        const justificacoes: Record<string, string> = {};
        let needsJustification = false;

        PILLARS_LIDERANCA.forEach(p => {
            const grade = Number(form[p.key as keyof FormEdicao]);
            if (grade < 2.0 || grade > 3.8) {
                justificacoes[p.key] = form.notasFinais || "Anotação rápida registada em Lote (Líder)";
                if (!form.notasFinais) needsJustification = true;
            }
        });

        if (needsJustification && form.notasFinais.trim() === "") {
            alert("Existem pilares sob classificação crítica (< 2.0) ou de Excelência (> 3.8). Tem obrigatoriamente de inserir uma justificativa no bloco inferior antes de gravar.");
            return;
        }

        setIsSubmitting(prev => ({ ...prev, [emp.id]: true }));

        const dto: AvaliacaoLiderancaDTO = {
            funcionario_id: emp.id,
            nomeFuncionario: emp.nome_operador,
            data_avaliacao: selectedDate, // Retroativa suportada
            ...form,
            justificacoes
        };

        const res = await submeterAvaliacaoLideranca(dto, "Supervisor Logado");

        if (res.success) {
            setSavedStates(prev => ({ ...prev, [emp.id]: true }));
        } else {
            alert(`Falha em ${emp.nome_operador}: ${res.error}`);
        }
        setIsSubmitting(prev => ({ ...prev, [emp.id]: false }));
    };

    const openFeedbackModal = async (nomeLider: string) => {
        setSelectedFeedbackLeader(nomeLider);
        setIsLoadingFeedbacks(true);
        const res = await getFeedbackQuizAggregado(nomeLider);
        if (res.success && res.data) {
            setFeedbacksAgregados(res.data);
        } else {
            setFeedbacksAgregados([]);
        }
        setIsLoadingFeedbacks(false);
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse text-slate-500 font-mono">Verificando hierarquia e permissões RLS...</div>;
    
    if (errorMsg) return (
        <div className="flex flex-col items-center justify-center p-20 text-center">
            <Shield className="w-16 h-16 text-rose-500 mb-4" />
            <h1 className="text-2xl font-bold text-slate-900">Acesso Restrito</h1>
            <p className="text-slate-500 max-w-md mt-2">{errorMsg}</p>
        </div>
    );

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto pb-32 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-center bg-indigo-50 p-4 rounded-xl shadow-sm border border-indigo-100 gap-4 sticky top-4 z-40">
                <div className="flex items-center justify-between w-full md:w-auto shrink-0">
                    <div className="flex items-center gap-4">
                        <Briefcase className="w-8 h-8 text-indigo-600 hidden sm:block" />
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-indigo-950 tracking-tight">Avaliação da Liderança</h1>
                            <p className="text-indigo-600/70 text-xs sm:text-sm">Cargo Subordinado (Gestão Diretiva).</p>
                        </div>
                    </div>
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowFilters(!showFilters)} 
                        className="md:hidden border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        {showFilters ? "Ocultar" : "Filtros"}
                    </Button>
                </div>

                <div className={cn("flex-col sm:flex-row items-center gap-3 w-full md:w-auto", showFilters ? "flex" : "hidden md:flex")}>
                    <div className="w-full sm:w-auto">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">Data Audit:</span>
                         <input
                                type="date"
                                className="h-10 px-3 border border-indigo-200 rounded-md bg-white font-semibold focus:ring-2 focus:ring-indigo-500 w-full text-indigo-900"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                    </div>
                    <div className="w-full sm:w-[300px]">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">Filtrar Categoria:</span>
                        <div className="relative">
                            <select
                                className="w-full appearance-none bg-white text-indigo-900 border border-indigo-200 hover:bg-slate-50 shadow-sm rounded-md h-10 px-3 pr-8 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={selectedFuncao || ""}
                                onChange={(e) => setSelectedFuncao(e.target.value || null)}
                            >
                                <option value="">Selecione uma Função...</option>
                                {funcoesDisponiveis.map((funcao) => (
                                    <option key={funcao} value={funcao}>
                                        {funcao}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-400">
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout Vazio */}
            {!selectedFuncao && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
                    <Search className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700">Selecione uma Função Hierárquica</h3>
                    <p className="text-slate-500 max-w-md text-center">
                        Ao selecionar uma camada (Ex: Líder de Equipa), carregaremos os profissionais disponíveis ao seu nível de Autoridade.
                    </p>
                </div>
            )}

            {/* Grelha de Cartões Multi-Slider */}
            {selectedFuncao && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmployees.map(emp => {
                        const form = evaluations[emp.id];
                        if (!form) return null;

                        const currentScore = calculateDailyScore(form);
                        const scoreColor = getScoreColor(currentScore);
                        const isSaved = savedStates[emp.id];
                        const isSaving = isSubmitting[emp.id];

                        return (
                            <Card key={emp.id} className={cn(
                                "border-t-4 transition-all duration-300 shadow-sm",
                                isSaved ? "border-t-green-500 ring-2 ring-green-100 bg-white" : "border-t-indigo-500 hover:shadow-lg bg-white"
                            )}>
                                <CardHeader className="flex flex-row justify-between items-start pb-2">
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-800 flex flex-col gap-2 items-start w-full">
                                            <div className="flex gap-2 items-center w-full mt-1">
                                                <span className="text-slate-400 font-mono text-sm bg-slate-100 px-1.5 py-0.5 rounded">
                                                    #{emp.numero_operador}
                                                </span>
                                                <span className="line-clamp-1">{emp.nome_operador}</span>
                                            </div>
                                            <button 
                                                onClick={() => openFeedbackModal(emp.nome_operador)}
                                                className="text-xs text-blue-600 font-semibold hover:bg-blue-100 hover:scale-[1.02] transition-transform flex items-center gap-1.5 mt-1 bg-blue-50 px-2 py-1 rounded-md border border-blue-200"
                                            >
                                                <Target className="w-3.5 h-3.5"/> Histórico Espião (Feedback Chão de Fábrica)
                                            </button>
                                        </CardTitle>
                                        <div className="flex gap-2 mt-2">
                                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-200">{emp.funcao}</Badge>
                                            <Badge variant="outline" className="text-slate-500">{emp.area_nome}</Badge>
                                        </div>
                                    </div>
                                    <div className={cn("flex flex-col items-center justify-center h-12 w-12 rounded-full border-2 shadow-sm", scoreColor)}>
                                        <span className="text-lg font-bold">{currentScore}</span>
                                    </div>
                                </CardHeader>

                                {/* Bloco dos Sliders */}
                                <CardContent className="space-y-4 pt-0">
                                    <div className="grid gap-3 bg-slate-50/50 p-4 rounded-lg border border-slate-100 mt-2">
                                        {PILLARS_LIDERANCA.map(pillar => {
                                            const Icon = pillar.icon;
                                            const val = form[pillar.key as keyof FormEdicao] as number;
                                            return (
                                                <div key={pillar.key} className="space-y-1">
                                                    <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                                        <span className="flex items-center gap-1.5">
                                                            <Icon className={cn("w-3.5 h-3.5", pillar.color)} /> {pillar.label}
                                                        </span>
                                                        <span className={cn(
                                                            "font-bold text-sm",
                                                            val < 2.5 ? "text-red-600" : val >= 3.5 ? "text-green-600" : "text-yellow-600"
                                                        )}>{val.toFixed(1)}</span>
                                                    </div>
                                                    <Slider
                                                        value={[val]} max={4} min={1} step={0.5}
                                                        onValueChange={(v) => handleScoreChange(emp.id, pillar.key as keyof FormEdicao, v[0])}
                                                        className="py-1 cursor-pointer"
                                                        disabled={isSaved}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Observações / Justificações */}
                                    <div className="pt-2">
                                        <Textarea
                                            placeholder="Redação obrigatória de Justificação para Notas (< 2.0) ou (> 3.8)..."
                                            className={cn(
                                                "h-20 text-xs resize-none border-slate-200 focus:border-indigo-400 shadow-inner",
                                                isSaved && "opacity-50 cursor-not-allowed"
                                            )}
                                            value={form.notasFinais || ""}
                                            onChange={(e) => handleScoreChange(emp.id, 'notasFinais', e.target.value as any)}
                                            readOnly={isSaved}
                                        />
                                    </div>

                                    <Button
                                        disabled={isSaved || isSaving}
                                        className={cn(
                                            "w-full font-semibold shadow-sm transition-all duration-200",
                                            isSaved
                                                ? "bg-green-600 hover:bg-green-700 text-white shadow-green-200 disabled:opacity-100"
                                                : "bg-indigo-700 hover:bg-indigo-600 text-white shadow-indigo-200"
                                        )}
                                        onClick={() => submitAvaliacao(emp)}
                                    >
                                        {isSaving ? "A Processar..." : isSaved ? (
                                            <span className="flex items-center animate-in zoom-in duration-300">
                                                <Check className="w-5 h-5 mr-2" /> Avaliação Trancada (Salva)
                                            </span>
                                        ) : (
                                            <span className="flex items-center">
                                                <Save className="w-4 h-4 mr-2" /> Submeter Avaliação
                                            </span>
                                        )}
                                    </Button>

                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Modal Bottom-up */}
            {selectedFeedbackLeader && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b bg-indigo-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Target className="w-6 h-6 text-indigo-600" />
                                    Voz do Operador (Anónimo)
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Líder Analisado: <span className="font-bold text-slate-700">{selectedFeedbackLeader}</span></p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedFeedbackLeader(null)} className="rounded-full hover:bg-slate-200">
                                <X className="w-5 h-5 text-slate-500" />
                            </Button>
                        </div>
                        
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {isLoadingFeedbacks ? (
                                <div className="text-center py-10 text-slate-400 animate-pulse font-mono">
                                    Desencriptando Avaliações do Cofre 360...
                                </div>
                            ) : feedbacksAgregados.length === 0 ? (
                                <div className="text-center py-12">
                                    <Shield className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                    <h4 className="text-lg font-bold text-slate-600">Nenhum feedback registado</h4>
                                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">Este líder ainda não recebeu avaliações do chão de fábrica nos Quiosques de Cultura.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {feedbacksAgregados.map((fb, i) => (
                                        <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl gap-4">
                                            <div className="flex-1">
                                                <h5 className="font-semibold text-slate-800 leading-tight">{fb.texto_pergunta}</h5>
                                                <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">Amostra: {fb.respostas} Operadores</p>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm shrink-0">
                                                <Star className={cn("w-5 h-5", fb.media >= 4 ? "text-green-500 fill-green-500" : fb.media <= 2.5 ? "text-red-500 fill-red-500" : "text-yellow-500 fill-yellow-500")} />
                                                <span className="text-2xl font-black text-slate-800">{fb.media}</span>
                                                <span className="text-slate-400 font-bold">/ 5</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                        <p className="text-xs text-blue-600 text-center font-semibold">Os dados visíveis são médias exatas submetidas anonimamente a partir da zona fabril.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

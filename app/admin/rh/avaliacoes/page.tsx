"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Shield, Activity, TrendingUp, CheckCircle, Save, Check, ChevronsUpDown, Search, UserCheck, Calendar, Filter } from 'lucide-react';
import { AvaliacaoDTO, submeterAvaliacaoDiaria } from './actions';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const PILLARS = [
    { key: 'hst', label: 'HST', icon: Shield, color: 'text-orange-500' },
    { key: 'epi', label: 'EPI', icon: Shield, color: 'text-blue-500' },
    { key: 'limpeza', label: 'Limpeza (5S)', icon: Activity, color: 'text-green-500' },
    { key: 'qualidade', label: 'Qualidade', icon: CheckCircle, color: 'text-purple-500' },
    { key: 'eficiencia', label: 'Eficiência', icon: TrendingUp, color: 'text-red-500' },
    { key: 'objetivos', label: 'Objetivos', icon: CheckCircle, color: 'text-indigo-500' },
    { key: 'atitude', label: 'Atitude', icon: Activity, color: 'text-pink-500' },
] as const;

type OperadorLote = {
    id: string;
    numero_operador: string;
    nome_operador: string;
    funcao: string;
    area_nome: string;
    estacao_nome: string;
};

type FormEdicao = {
    hst: number;
    epi: number;
    limpeza: number;
    qualidade: number;
    eficiencia: number;
    objetivos: number;
    atitude: number;
    notasFinais: string;
};

export default function LoteAvaliacoesDiariasLayout() {
    const supabase = createClient();
    const [operadores, setOperadores] = useState<OperadorLote[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 4 Filtros Universais M.E.S
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedArea, setSelectedArea] = useState<string>("");
    const [selectedEstacao, setSelectedEstacao] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Estado local de formulários e saves
    const [evaluations, setEvaluations] = useState<Record<string, FormEdicao>>({});
    const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        carregarLista();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase]);

    const carregarLista = async () => {
        setIsLoading(true);

        const { data: estacoesData } = await supabase.from('estacoes').select('id, nome_estacao');
        const mapEstacoes = new Map(estacoesData?.map(e => [e.id, e.nome_estacao]) || []);

        const { data } = await supabase
            .from('operadores')
            .select('id, numero_operador, nome_operador, funcao, area_base_id, posto_base_id, areas_fabrica(nome_area)')
            .eq('status', 'Ativo')
            .order('nome_operador');

        if (data) {
            const mapped = data.map(op => {
                const areaBase = (op.areas_fabrica as any)?.nome_area || 'Geral';
                const estacaoBase = mapEstacoes.get(op.posto_base_id) || '';

                return {
                    id: op.id,
                    numero_operador: op.numero_operador,
                    nome_operador: op.nome_operador,
                    funcao: op.funcao,
                    area_nome: areaBase,
                    estacao_nome: estacaoBase
                };
            });
            mapped.sort((a, b) => a.nome_operador.localeCompare(b.nome_operador));
            setOperadores(mapped);
        }
        setIsLoading(false);
    };

    // Arrays de Filtros Dropdowns
    const areas = useMemo(() => Array.from(new Set(operadores.map(e => e.area_nome).filter(Boolean))).sort(), [operadores]);
    
    // As estações disponíveis atualizam consoante a Área selecionada
    const estacoesDisponiveis = useMemo(() => {
        let ops = operadores;
        if (selectedArea) ops = ops.filter(e => e.area_nome === selectedArea);
        return Array.from(new Set(ops.map(e => e.estacao_nome).filter(Boolean))).sort();
    }, [operadores, selectedArea]);

    // Motor de Filtragem Ativa
    const filteredEmployees = useMemo(() => {
        if (!selectedArea && !selectedEstacao && !searchQuery) return [];

        return operadores.filter(e => {
            const matchArea = selectedArea ? e.area_nome === selectedArea : true;
            const matchEstacao = selectedEstacao ? e.estacao_nome === selectedEstacao : true;
            const matchSearch = searchQuery ? 
                e.nome_operador.toLowerCase().includes(searchQuery.toLowerCase()) || 
                e.numero_operador.toLowerCase().includes(searchQuery.toLowerCase()) : true;
            
            return matchArea && matchEstacao && matchSearch;
        });
    }, [operadores, selectedArea, selectedEstacao, searchQuery]);

    // Ao mudar os filtros ou a data específica, garantimos preenchimento do Form (Zero-load ou Retroativo se existir na BD)
    useEffect(() => {
        if (filteredEmployees.length === 0) {
            if (Object.keys(evaluations).length > 0) setEvaluations({});
            return;
        }

        const carregarFormsAntigos = async () => {
            const ids = filteredEmployees.map(e => e.id);
            const { data: dbRecords } = await supabase
                .from('avaliacoes_diarias')
                .select('*')
                .eq('data_avaliacao', selectedDate)
                .in('funcionario_id', ids);

            const dictRemoto = new Map(dbRecords?.map(r => [r.funcionario_id, r]) || []);

            const newForms = { ...evaluations };
            const newSaved = { ...savedStates };

            filteredEmployees.forEach(emp => {
                const found = dictRemoto.get(emp.id);
                if (found) {
                    newForms[emp.id] = {
                        hst: found.nota_hst || 3.0,
                        epi: found.nota_epi || 3.0,
                        limpeza: found.nota_5s || 3.0,
                        qualidade: found.nota_qualidade || 3.0,
                        eficiencia: found.nota_eficiencia || 3.0,
                        objetivos: found.nota_objetivos || 3.0,
                        atitude: found.nota_atitude || 3.0,
                        notasFinais: found.justificacao || ""
                    };
                    newSaved[emp.id] = true;
                } else if (!newForms[emp.id] || newSaved[emp.id]) { // Reset Form if it was dirty from another date
                    newForms[emp.id] = {
                        hst: 3.0, epi: 3.0, limpeza: 3.0, qualidade: 3.0,
                        eficiencia: 3.0, objetivos: 3.0, atitude: 3.0, notasFinais: ""
                    };
                    newSaved[emp.id] = false;
                }
            });

            setEvaluations(newForms);
            setSavedStates(newSaved);
        };

        carregarFormsAntigos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredEmployees, selectedDate, supabase]);

    const handleScoreChange = (empId: string, pillarKey: keyof FormEdicao, value: number) => {
        setEvaluations(prev => ({
            ...prev,
            [empId]: {
                ...prev[empId],
                [pillarKey]: value
            }
        }));
        setSavedStates(prev => ({ ...prev, [empId]: false })); // Liberta o botão "Salvar" se houver alterações
    };

    const calculateDailyScore = (evalData: FormEdicao | undefined) => {
        if (!evalData) return "0.0";
        const sum = evalData.hst + evalData.epi + evalData.limpeza + evalData.qualidade + evalData.eficiencia + evalData.objetivos + evalData.atitude;
        return (sum / 7).toFixed(1);
    };

    const getScoreColor = (scoreStr: string) => {
        const score = Number(scoreStr);
        if (score >= 3.5) return "bg-green-100 text-green-700 border-green-300";
        if (score >= 2.5) return "bg-yellow-100 text-yellow-700 border-yellow-300";
        return "bg-red-100 text-red-700 border-red-300";
    };

    const submitAvaliacao = async (emp: OperadorLote) => {
        const form = evaluations[emp.id];
        if (!form) return;

        const justificacoes: Record<string, string> = {};
        let needsJustification = false;

        PILLARS.forEach(p => {
            const grade = Number(form[p.key as keyof FormEdicao]);
            // O USER solicitou feedback estrito para Liderança E Operadores em Extremos (>3.8 ou <2.0)
            if (grade < 2.0 || grade > 3.8) {
                justificacoes[p.key] = form.notasFinais || "Anotação rápida registada em Lote (Líder)";
                if (!form.notasFinais) needsJustification = true;
            }
        });

        if (needsJustification && form.notasFinais.trim() === "") {
            alert("Existem pilares sob classificação crítica (< 2.0) ou Excelência (> 3.8). Tem obrigatoriamente de inserir uma justificativa no bloco inferior antes de gravar.");
            return;
        }

        setIsSubmitting(prev => ({ ...prev, [emp.id]: true }));

        const dto: AvaliacaoDTO = {
            funcionario_id: emp.id,
            nomeFuncionario: emp.nome_operador,
            data_avaliacao: selectedDate, // Retroativa suportada!
            ...form,
            justificacoes
        };

        const res = await submeterAvaliacaoDiaria(dto, "Supervisor Logado");

        if (res.success) {
            setSavedStates(prev => ({ ...prev, [emp.id]: true }));
        } else {
            alert(`Falha em ${emp.nome_operador}: ${res.error}`);
        }
        setIsSubmitting(prev => ({ ...prev, [emp.id]: false }));
    };

    if (isLoading) {
        return <div className="p-10 text-center animate-pulse text-slate-500 font-mono">A carregar registos ativos da fábrica...</div>;
    }

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto pb-32 animate-in fade-in duration-500">
            {/* Header Flutuante / Comando Central */}
            <div className="flex flex-col xl:flex-row justify-between xl:items-center bg-white p-5 rounded-xl shadow-sm border border-slate-200 gap-6 sticky top-4 z-40">
                <div className="flex items-center justify-between w-full xl:w-auto shrink-0">
                    <div className="flex items-center gap-4">
                        <UserCheck className="w-10 h-10 text-blue-600 hidden sm:block" />
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Avaliações 360</h1>
                            <p className="text-slate-500 text-xs sm:text-sm">Controle as camadas operacionais.</p>
                        </div>
                    </div>
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowFilters(!showFilters)} 
                        className="xl:hidden border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        {showFilters ? "Ocultar" : "Filtros"}
                    </Button>
                </div>

                <div className={cn("grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full", showFilters ? "grid" : "hidden xl:grid")}>
                    {/* Filtro 1: Data Retroativa */}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1 flex items-center gap-1"><Calendar size={12}/> Data Audit</span>
                        <input
                            type="date"
                            className="h-10 px-3 border border-slate-300 rounded-md bg-slate-50 font-semibold focus:ring-2 focus:ring-blue-500 w-full"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    {/* Filtro 2: Área Fabril */}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Área Genérica</span>
                        <div className="relative">
                            <select
                                className="h-10 px-3 pr-8 border border-slate-300 rounded-md bg-slate-50 font-semibold focus:ring-2 focus:ring-blue-500 w-full appearance-none"
                                value={selectedArea}
                                onChange={(e) => setSelectedArea(e.target.value)}
                            >
                                <option value="">Todas as Áreas</option>
                                {areas.map((area) => <option key={area} value={area}>{area}</option>)}
                            </select>
                            <ChevronsUpDown className="absolute right-2 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* Filtro 3: Estação Específica (As you wished) */}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Estação / Linha</span>
                        <div className="relative">
                            <select
                                className="h-10 px-3 pr-8 border border-slate-300 rounded-md bg-slate-50 font-semibold focus:ring-2 focus:ring-blue-500 w-full appearance-none"
                                value={selectedEstacao}
                                onChange={(e) => setSelectedEstacao(e.target.value)}
                            >
                                <option value="">Todas as Estações</option>
                                {estacoesDisponiveis.map((est) => <option key={est} value={est}>{est}</option>)}
                            </select>
                            <ChevronsUpDown className="absolute right-2 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* Filtro 4: Search Textual */}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Procurar Nome</span>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Colaborador / OP-XXX"
                                className="h-10 pl-9 pr-3 border border-slate-300 rounded-md bg-slate-50 font-semibold focus:ring-2 focus:ring-blue-500 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout Vazio Extremo */}
            {filteredEmployees.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
                    <Search className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700">Nenhum Colaborador Encontrado</h3>
                    <p className="text-slate-500 max-w-md text-center mt-2">
                        Experimente remover ou alterar os filtros acima. Pode estar a cruzar uma Área com uma Estação que não pertence a ela.
                    </p>
                </div>
            )}

            {/* Grelha de Cartões Multi-Slider */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map(emp => {
                    const form = evaluations[emp.id];
                    if (!form) return null; // Safety

                    const currentScore = calculateDailyScore(form);
                    const scoreColor = getScoreColor(currentScore);
                    const isSaved = savedStates[emp.id];
                    const isSaving = isSubmitting[emp.id];

                    return (
                        <Card key={emp.id} className={cn(
                            "border-t-4 transition-all duration-300 shadow-sm",
                            isSaved ? "border-t-green-500 ring-2 ring-green-100 bg-white" : "border-t-blue-500 hover:shadow-lg bg-white"
                        )}>
                            <CardHeader className="flex flex-row justify-between items-start pb-2">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2 line-clamp-1">
                                        <span className="text-slate-400 font-mono text-sm bg-slate-100 px-1.5 py-0.5 rounded">
                                            #{emp.numero_operador}
                                        </span>
                                        {emp.nome_operador}
                                    </CardTitle>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">{emp.funcao}</Badge>
                                        {(emp.area_nome || emp.estacao_nome) && (
                                            <Badge variant="outline" className="text-slate-400 border-slate-200">
                                                {emp.area_nome} {emp.estacao_nome && `> ${emp.estacao_nome}`}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className={cn("flex flex-col items-center justify-center h-12 w-12 rounded-full border-2 shadow-sm shrink-0", scoreColor)}>
                                    <span className="text-lg font-bold">{currentScore}</span>
                                </div>
                            </CardHeader>

                            {/* Bloco dos Sliders */}
                            <CardContent className="space-y-4 pt-0">
                                <div className="grid gap-3 bg-slate-50/50 p-4 rounded-lg border border-slate-100 mt-2">
                                    {PILLARS.map(pillar => {
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
                                        placeholder="Redação de Justificação p/ Notas Criticas (< 2.0)..."
                                        className={cn(
                                            "h-16 text-xs resize-none border-slate-200 focus:border-blue-400 shadow-inner",
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
                                            : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200"
                                    )}
                                    onClick={() => submitAvaliacao(emp)}
                                >
                                    {isSaving ? "A Processar..." : isSaved ? (
                                        <span className="flex items-center animate-in zoom-in duration-300">
                                            <Check className="w-5 h-5 mr-2" /> Trancada & Gravada
                                        </span>
                                    ) : (
                                        <span className="flex items-center">
                                            <Save className="w-4 h-4 mr-2" /> Gravar Seleção
                                        </span>
                                    )}
                                </Button>

                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Shield, Activity, TrendingUp, CheckCircle, Save, Check, ChevronsUpDown, Search, UserCircle2, AlertTriangle, UserCheck } from 'lucide-react';
import { AvaliacaoDTO, submeterAvaliacaoDiaria } from './actions';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
    area_base_id: number;
    area_nome: string;
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

    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [openCombobox, setOpenCombobox] = useState(false);

    // Estado local de formulários e saves
    const [evaluations, setEvaluations] = useState<Record<string, FormEdicao>>({});
    const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

    useEffect(() => {
        carregarLista();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase]);

    const carregarLista = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('operadores')
            .select('id, numero_operador, nome_operador, funcao, area_base_id, areas_fabrica(nome_area)')
            .eq('status', 'Ativo')
            .order('nome_operador');

        if (data) {
            const mapped = data.map(op => ({
                id: op.id,
                numero_operador: op.numero_operador,
                nome_operador: op.nome_operador,
                funcao: op.funcao,
                area_base_id: op.area_base_id,
                area_nome: (op.areas_fabrica as any)?.nome_area || 'Geral'
            }));
            setOperadores(mapped);
        }
        setIsLoading(false);
    };

    const areas = useMemo(() => {
        return Array.from(new Set(operadores.map(e => e.area_nome).filter(Boolean))).sort();
    }, [operadores]);

    const filteredEmployees = useMemo(() => {
        if (!selectedArea) return [];
        return operadores.filter(e => e.area_nome === selectedArea);
    }, [operadores, selectedArea]);

    // Ao mudar de área, garantimos que cada funcionário tem um Form pré-preenchido
    useEffect(() => {
        if (filteredEmployees.length === 0) return;

        const newForms = { ...evaluations };
        filteredEmployees.forEach(emp => {
            if (!newForms[emp.id]) {
                newForms[emp.id] = {
                    hst: 3.0, epi: 3.0, limpeza: 3.0, qualidade: 3.0,
                    eficiencia: 3.0, objetivos: 3.0, atitude: 3.0, notasFinais: ""
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

        // Auto Justificações para notas < 2.0 (Simplificado para Bulk, usa as Notes)
        const justificacoes: Record<string, string> = {};
        let needsJustification = false;

        PILLARS.forEach(p => {
            const grade = Number(form[p.key as keyof FormEdicao]);
            if (grade < 2.0) {
                justificacoes[p.key] = form.notasFinais || "Anotação rápida registada em Lote (Líder)";
                if (!form.notasFinais) needsJustification = true;
            }
        });

        if (needsJustification && form.notasFinais.trim() === "") {
            alert("Existem pilares sob classificação crítica (< 2.0). Tem obrigatoriamente de inserir uma justificativa no bloco inferior antes de gravar.");
            return;
        }

        setIsSubmitting(prev => ({ ...prev, [emp.id]: true }));

        const dto: AvaliacaoDTO = {
            funcionario_id: emp.id,
            nomeFuncionario: emp.nome_operador,
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
            {/* Header Flutuante / Fixo */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4 sticky top-4 z-40">
                <div className="flex items-center gap-4">
                    <UserCheck className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Avaliação Diária de Turno</h1>
                        <p className="text-slate-500 text-sm">Selecione uma Área Logística para carregar os seus Operadores.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider hidden md:block">Filtrar por Área:</span>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCombobox}
                                className="w-full md:w-[300px] justify-between bg-white text-slate-900 border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                            >
                                {selectedArea ? (
                                    <span className="font-semibold">{selectedArea}</span>
                                ) : (
                                    <span className="text-slate-400">Selecione uma área...</span>
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 bg-white border-slate-200 shadow-lg">
                            <Command className="bg-white">
                                <CommandInput placeholder="Buscar área..." className="h-9" />
                                <CommandList className="max-h-[300px] overflow-y-auto">
                                    <CommandEmpty>Nenhuma área encontrada.</CommandEmpty>
                                    <CommandGroup>
                                        {areas.map((area) => (
                                            <CommandItem
                                                key={area}
                                                value={area}
                                                onSelect={() => {
                                                    setSelectedArea(area);
                                                    setOpenCombobox(false);
                                                }}
                                                className="cursor-pointer hover:bg-slate-100"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4 text-blue-600",
                                                        selectedArea === area ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {area}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Layout Vazio */}
            {!selectedArea && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
                    <Search className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700">Nenhuma área em seleção</h3>
                    <p className="text-slate-500 max-w-md text-center">
                        Para maximizar o Desempenho (Zero-Lag), filtre a Secção exata do seu turno de modo a renderizarmos os cartões iterativos.
                    </p>
                </div>
            )}

            {/* Grelha de Cartões Multi-Slider */}
            {selectedArea && (
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
                                        </div>
                                    </div>
                                    <div className={cn("flex flex-col items-center justify-center h-12 w-12 rounded-full border-2 shadow-sm", scoreColor)}>
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
                                            placeholder="Observações do labor diário ou Redação de Justificação para Notas Críticas (< 2.0)..."
                                            className={cn(
                                                "h-20 text-xs resize-none border-slate-200 focus:border-blue-400 shadow-inner",
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
        </div>
    );
}

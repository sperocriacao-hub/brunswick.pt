"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Info, Map } from "lucide-react";

type HeatmapPillar = {
    key: string;
    label: string;
    short: string;
    score?: number;
};

const PILLARS: HeatmapPillar[] = [
    { key: 'nota_hst', label: 'HST', short: 'HST' },
    { key: 'nota_epi', label: 'EPI', short: 'EPI' },
    { key: 'nota_5s', label: 'Limpeza (5S)', short: '5S' },
    { key: 'nota_qualidade', label: 'Qualidade', short: 'QUAL' },
    { key: 'nota_eficiencia', label: 'Eficiência', short: 'EFFIC' },
    { key: 'nota_objetivos', label: 'Objetivos', short: 'OBJ' },
    { key: 'nota_atitude', label: 'Atitude', short: 'ATIT' },
] as const;

export interface DB_AvaliacaoDiaria {
    id: string;
    funcionario_id: string;
    data_avaliacao: string;
    nota_hst: number;
    nota_epi: number;
    nota_5s: number;
    nota_qualidade: number;
    nota_eficiencia: number;
    nota_objetivos: number;
    nota_atitude: number;
}

export interface DB_OperadorArea {
    id: string;
    nome_operador: string;
    status: string;
    area_base_id: number;
    area_nome?: string;
}

interface FactoryHeatmapProps {
    avaliacoes: DB_AvaliacaoDiaria[];
    operadores: DB_OperadorArea[];
}

export function FactoryHeatmap({ avaliacoes, operadores }: FactoryHeatmapProps) {
    const [selectedPillar, setSelectedPillar] = useState<string>("all");

    // 1. Group Data by Area
    const areaStats = useMemo(() => {
        const areas = Array.from(new Set(operadores.map(e => e.area_nome).filter(Boolean)));

        return areas.map(area => {
            const areaEmps = operadores.filter(e => e.area_nome === area);
            const empIds = areaEmps.map(e => e.id);

            // Get evaluations for these employees
            const areaEvals = avaliacoes.filter(ev => empIds.includes(ev.funcionario_id));

            if (areaEvals.length === 0) return { area, score: 0, count: 0, criticalPillar: null, empCount: areaEmps.length };

            let totalScore = 0;
            let count = 0;
            const pillarSums: Record<string, number> = {};
            const pillarCounts: Record<string, number> = {};

            areaEvals.forEach(ev => {
                if (selectedPillar === 'all') {
                    // Average of all pillars
                    PILLARS.forEach(p => {
                        const val = (ev as any)[p.key];
                        if (typeof val === 'number') {
                            totalScore += val;
                            count++;
                            pillarSums[p.key] = (pillarSums[p.key] || 0) + val;
                            pillarCounts[p.key] = (pillarCounts[p.key] || 0) + 1;
                        }
                    });
                } else {
                    const val = (ev as any)[selectedPillar];
                    if (typeof val === 'number') {
                        totalScore += val;
                        count++;
                    }
                }
            });

            const avg = count > 0 ? totalScore / count : 0;

            // Find worst pillar if 'all' is selected
            let worstPillar: HeatmapPillar | null = null;
            if (selectedPillar === 'all') {
                let minAvg = 5;
                PILLARS.forEach(p => {
                    const pAvg = pillarCounts[p.key] ? pillarSums[p.key] / pillarCounts[p.key] : 5;
                    if (pAvg < minAvg) {
                        minAvg = pAvg;
                        worstPillar = { ...p, score: pAvg };
                    }
                });
            }

            return { area, score: avg, count: areaEvals.length, criticalPillar: worstPillar, empCount: areaEmps.length };
        }).sort((a, b) => a.score - b.score); // Worst first
    }, [operadores, avaliacoes, selectedPillar]);

    const getStatusColor = (score: number) => {
        if (score === 0) return "bg-slate-100 border-slate-200 text-slate-400";
        if (score < 2.5) return "bg-red-50 border-red-200 text-red-900";
        if (score < 3.5) return "bg-yellow-50 border-yellow-200 text-yellow-900";
        return "bg-green-50 border-green-200 text-green-900";
    };

    const getBarColor = (score: number) => {
        if (score === 0) return "bg-slate-300";
        if (score < 2.5) return "bg-red-500";
        if (score < 3.5) return "bg-yellow-500";
        return "bg-green-500";
    };

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Map className="w-5 h-5 text-blue-500" />
                            Mapa de Calor da Fábrica
                        </CardTitle>
                        <CardDescription>Visualização de desempenho por Área/Secção (Avaliações Ativas no Período)</CardDescription>
                    </div>
                    <Select value={selectedPillar} onValueChange={setSelectedPillar}>
                        <SelectTrigger className="w-[200px] bg-white">
                            <SelectValue placeholder="Filtrar por Pilar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Média Global</SelectItem>
                            {PILLARS.map(p => (
                                <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {areaStats.map((stat) => (
                        <TooltipProvider key={stat.area || "Geral"}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={cn(
                                            "flex flex-col justify-between p-4 rounded-xl border-2 transition-all hover:scale-[1.02] cursor-default h-[140px]",
                                            getStatusColor(stat.score)
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-md truncate max-w-[120px]" title={stat.area || "Geral"}>{stat.area || "Geral"}</h3>
                                                <div className="text-xs opacity-70 flex items-center gap-1">
                                                    <span className="font-semibold">{stat.empCount}</span> func.
                                                </div>
                                            </div>
                                            <span className="text-2xl font-bold tracking-tight">{stat.score > 0 ? stat.score.toFixed(1) : "--"}</span>
                                        </div>

                                        {/* Critical Pillar Info (Only if 'all' selected and score exists) */}
                                        {selectedPillar === 'all' && stat.criticalPillar && stat.score > 0 && (
                                            <div className="mt-2 text-xs bg-white/50 p-1.5 rounded flex items-center justify-between">
                                                <span className="opacity-80">Crítico:</span>
                                                <span className={cn(
                                                    "font-bold px-1.5 rounded text-[10px]",
                                                    ((stat.criticalPillar as any)?.score ?? 0) < 2.5 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                                )}>
                                                    {(stat.criticalPillar as any)?.short} ({((stat.criticalPillar as any)?.score ?? 0).toFixed(1)})
                                                </span>
                                            </div>
                                        )}

                                        {/* Progress Bar */}
                                        <div className="mt-auto pt-2">
                                            <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full", getBarColor(stat.score))}
                                                    style={{ width: `${(stat.score / 4) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-bold">{stat.area || "Geral"}</p>
                                    <p className="text-xs">Baseado em {stat.count} avaliações</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                    {areaStats.length === 0 && (
                        <div className="col-span-full py-10 text-center text-slate-400 italic">
                            Nenhuma área logstica disponível encontrada.
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="mt-8 flex flex-wrap gap-4 text-xs text-slate-500 justify-center border-t pt-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        <span>Crítico (&lt; 2.5)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-yellow-500"></div>
                        <span>Atenção (2.5 - 3.5)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-green-500"></div>
                        <span>Bom (&gt; 3.5)</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

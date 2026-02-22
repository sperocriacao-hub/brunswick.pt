import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, TrendingUp } from "lucide-react";
import { DB_AvaliacaoDiaria, DB_OperadorArea } from './FactoryHeatmap';
import { cn } from "@/lib/utils";

interface TopPerformersProps {
    operadores: DB_OperadorArea[];
    avaliacoes: DB_AvaliacaoDiaria[];
}

export function TopPerformersMural({ operadores, avaliacoes }: TopPerformersProps) {
    // Agrupa todos os empregados e calcula a sua média global
    const scoredEmployees = operadores.map(op => {
        const myEvals = avaliacoes.filter(e => e.funcionario_id === op.id);
        if (myEvals.length === 0) return { ...op, score: 0, evalCount: 0 };

        let totalScore = 0;
        myEvals.forEach(ev => {
            const sum = ev.nota_hst + ev.nota_epi + ev.nota_5s + ev.nota_qualidade + ev.nota_eficiencia + ev.nota_objetivos + ev.nota_atitude;
            totalScore += sum / 7;
        });

        return {
            ...op,
            score: totalScore / myEvals.length,
            evalCount: myEvals.length
        };
    }).filter(op => op.evalCount > 0);

    // Agrupa por Área
    const byArea: Record<string, typeof scoredEmployees> = {};

    // Todos os funcionários num bolo geral
    scoredEmployees.forEach(e => {
        const area = e.area_nome || "Geral";
        if (!byArea[area]) byArea[area] = [];
        byArea[area].push(e);
    });

    Object.keys(byArea).forEach(area => {
        byArea[area].sort((a, b) => b.score - a.score);
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Heróis da Fábrica (Funcionários do Mês)
                    </h2>
                    <p className="text-sm text-slate-500">Ranking baseado na média contínua dos Pilares de Performance.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {Object.entries(byArea).map(([area, performers]) => {
                    const top3 = performers.slice(0, 3);
                    if (top3.length === 0) return null;
                    const winner = top3[0];
                    const runnersUp = top3.slice(1);

                    return (
                        <Card key={area} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative group hover:shadow-md transition-shadow">
                            {/* Area Header */}
                            <div className="bg-slate-50 border-b px-4 py-3 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-slate-400" />
                                    {area}
                                </h3>
                                <Badge variant="outline" className="text-[10px] font-normal bg-white">
                                    {performers.length} Avaliados
                                </Badge>
                            </div>

                            {/* WINNER SPOTLIGHT */}
                            <div className="p-6 flex flex-col items-center text-center bg-gradient-to-b from-blue-50/50 to-transparent relative">
                                <div className="absolute top-4 right-4 animate-pulse">
                                    <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-sm" />
                                </div>

                                {/* Avatar */}
                                <div className="relative mb-4">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg ring-4 ring-white">
                                        {winner.nome_operador.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute -bottom-2 inset-x-0 mx-auto w-fit bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-yellow-200">
                                        1º LUGAR
                                    </div>
                                </div>

                                <h4 className="text-lg font-bold text-slate-900 line-clamp-1">{winner.nome_operador}</h4>
                                <p className="text-xs text-slate-500 mb-3">{winner.status}</p>

                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="font-bold text-blue-700">{winner.score.toFixed(1)}</span>
                                    <span className="text-xs text-slate-400">/ 4.0</span>
                                </div>
                            </div>

                            {/* RUNNERS UP */}
                            {runnersUp.length > 0 && (
                                <div className="bg-slate-50/50 border-t border-slate-100 p-2 divide-y divide-slate-100 flex-1">
                                    {runnersUp.map((emp, idx) => (
                                        <div
                                            key={emp.id}
                                            className="flex items-center gap-3 p-3 hover:bg-slate-100/50 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border",
                                                idx === 0 ? "bg-slate-200 text-slate-700 border-slate-300" : "bg-orange-100 text-orange-800 border-orange-200"
                                            )}>
                                                {idx + 2}
                                            </div>
                                            <div className="flex-1 min-w-0 flex justify-between items-center">
                                                <p className="text-xs font-semibold text-slate-700 truncate">{emp.nome_operador}</p>
                                                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                    {emp.score.toFixed(1)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingDown, Lightbulb, Target, AlertTriangle } from 'lucide-react';
import { DB_OperadorArea } from './FactoryHeatmap';

export interface DB_AvaliacaoLideranca {
    id: string;
    funcionario_id: string;
    data_avaliacao: string;
    nota_hst?: number;
    nota_epi?: number;
    nota_5s?: number;
    nota_qualidade?: number;
    nota_eficiencia?: number;
    nota_gestao_motivacao?: number;
    nota_kpis?: number;
}

interface LowPerformersPDIProps {
    operadores: DB_OperadorArea[];
    avaliacoes: DB_AvaliacaoLideranca[];
}

export function LowPerformersPDI({ operadores, avaliacoes }: LowPerformersPDIProps) {

    const underperformers = useMemo(() => {
        if (!operadores || !avaliacoes || avaliacoes.length === 0) return [];

        const liderStats = operadores.map(op => {
            const minhasAvs = avaliacoes.filter(a => a.funcionario_id === op.id);
            if (minhasAvs.length === 0) return null;

            const sum = minhasAvs.reduce((acc, crr) => {
                acc.epi += crr.nota_epi || 0;
                acc.hst += crr.nota_hst || 0;
                acc.qualidade += crr.nota_qualidade || 0;
                acc.cinco_s += crr.nota_5s || 0;
                acc.eficiencia += crr.nota_eficiencia || 0;
                acc.gestao += crr.nota_gestao_motivacao || 0;
                acc.kpis += crr.nota_kpis || 0;
                return acc;
            }, { epi: 0, hst: 0, qualidade: 0, cinco_s: 0, eficiencia: 0, gestao: 0, kpis: 0 });

            const count = minhasAvs.length;
            const averages = {
                'EPI & Fardamento': sum.epi / count,
                'Assiduidade (HST)': sum.hst / count,
                'Qualidade': sum.qualidade / count,
                'Metodologia 5S': sum.cinco_s / count,
                'Eficiência e Linhas': sum.eficiencia / count,
                'Gestão/Motivação': sum.gestao / count,
                'Gestão de KPIs': sum.kpis / count,
            };

            const overallMedia = Object.values(averages).reduce((a,b) => a+b, 0) / 7;

            // Encontrar o pior critério
            let worstSubject = '';
            let worstScore = 5.0;
            Object.entries(averages).forEach(([subject, score]) => {
                if (score < worstScore) {
                    worstScore = score;
                    worstSubject = subject;
                }
            });

            return {
                id: op.id,
                nome: op.nome_operador,
                funcao: op.status === 'Ativo' ? op.area_nome : op.status,
                area: op.area_nome,
                overallMedia,
                worstSubject,
                worstScore,
                avaliacoesFeitas: count
            };
        }).filter(Boolean) as any[];

        // Filtrar apenas Lideres cuja media geral é fraca (< 3.8) ou que tem um score gravíssimo (< 2.8)
        const necessitamApoio = liderStats.filter(l => l.overallMedia < 3.8 || l.worstScore < 2.8);

        // Sort pelos piores OEEs globais
        necessitamApoio.sort((a,b) => a.overallMedia - b.overallMedia);

        return necessitamApoio.slice(0, 3); // Top 3 focos de PDI
    }, [operadores, avaliacoes]);

    if (underperformers.length === 0) return null;

    return (
        <Card className="bg-gradient-to-br from-slate-50 to-rose-50/20 border-rose-100 shadow-sm mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="pb-3 border-b border-rose-100 bg-white/50">
                <CardTitle className="text-sm font-extrabold text-rose-800 uppercase tracking-widest flex items-center justify-between">
                    <span className="flex items-center gap-2"><Target size={18} className="text-rose-500" /> Focos PDI (Plano Desenvolvimento Individual)</span>
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold">Liderança M.E.S</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {underperformers.map((up, idx) => (
                    <div key={up.id} className="flex gap-4 items-center bg-white border border-slate-100 p-3 rounded-lg shadow-sm hover:border-rose-300 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 font-black flex items-center justify-center shrink-0 border-2 border-white shadow-sm ring-1 ring-rose-200">
                            {idx + 1}º
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{up.nome}</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 mt-0.5">{up.area || 'Fábrica'}</p>
                            
                            <div className="flex flex-col sm:flex-row gap-2 mt-2">
                                <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-600 flex items-center gap-1">
                                    <span>Radar Geral:</span>
                                    <span className={up.overallMedia < 3.0 ? "text-red-500" : "text-amber-500"}>{up.overallMedia.toFixed(1)} / 5</span>
                                </div>
                                <div className="bg-rose-50 border border-rose-200 rounded px-2 py-1 text-xs font-bold text-rose-700 flex items-center gap-1 min-w-0">
                                    <AlertTriangle size={12} className="shrink-0 text-red-500" />
                                    <span className="truncate">Gargalo Crítico: {up.worstSubject} (<span className="text-red-600 font-black">{up.worstScore.toFixed(1)}</span>)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

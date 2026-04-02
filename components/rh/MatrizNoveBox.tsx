"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine } from 'recharts';
import { Target } from 'lucide-react';

export type LiderancaKPIs = {
    nome: string;
    equipaOee: number; // 0-100 X Axis
    mentoriaScore: number; // Y Axis (e.g., number of feedbacks or an average quality score 0-4. For simplicity let's use a normalized cultural score 1-4)
    andonMins: number; // Bubble size or secondary indicator
};

interface MatrizNoveBoxProps {
    data: LiderancaKPIs[];
}

export function MatrizNoveBox({ data }: MatrizNoveBoxProps) {

    // Helper: Quadrant Classification
    const getQuadranteName = (x: number, y: number) => {
        if (x >= 70 && y >= 3.0) return "Talento Chave (Top)";
        if (x >= 70 && y >= 2.0 && y < 3.0) return "Forte Desempenho";
        if (x >= 70 && y < 2.0) return "Profissional Técnico";
        
        if (x >= 50 && x < 70 && y >= 3.0) return "Líder em Crescimento";
        if (x >= 50 && x < 70 && y >= 2.0 && y < 3.0) return "Profissional Chave (Core)";
        if (x >= 50 && x < 70 && y < 2.0) return "Desempenho Eficaz";
        
        if (x < 50 && y >= 3.0) return "Enigma (Alto Potencial, Baixa Execução)";
        if (x < 50 && y >= 2.0 && y < 3.0) return "Dilema de Liderança";
        if (x < 50 && y < 2.0) return "Subaproveitado / Risco (PIP)";
        return "N/A";
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-sm">
                    <p className="font-bold text-indigo-400 mb-2">{data.nome}</p>
                    <div className="space-y-1">
                        <p><span className="opacity-60">OEE da Equipa:</span> <span className="font-mono font-bold text-emerald-400">{Number(data.equipaOee).toFixed(1)}%</span></p>
                        <p><span className="opacity-60">Skill/Cultura:</span> <span className="font-mono font-bold text-amber-400">{Number(data.mentoriaScore).toFixed(1)}/4.0</span></p>
                        <p><span className="opacity-60">Resposta Andon:</span> <span className="font-mono font-bold">{data.andonMins} min</span></p>
                    </div>
                    <div className="mt-3 bg-slate-800 text-xs px-2 py-1 rounded font-semibold text-center border border-slate-700 uppercase tracking-widest text-slate-300">
                        {getQuadranteName(data.equipaOee, data.mentoriaScore)}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="bg-white border hover:border-indigo-200 transition-colors shadow-sm h-full">
            <CardHeader className="pb-2 border-b border-slate-50">
                <CardTitle className="text-slate-600 text-sm font-extrabold tracking-widest uppercase flex items-center gap-2">
                    <Target size={18} className="text-indigo-500" />
                    Matriz de Mentoria e Eficiência (9-Box)
                </CardTitle>
                <p className="text-xs text-slate-500 opacity-80 font-medium">Cruzamento do OEE da equipa liderada vs Avaliação Cultural Média do Líder.</p>
            </CardHeader>
            <CardContent className="pt-4 pb-2">
                <div className="h-[400px] w-full">
                    {data.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-400 italic">Sem avaliação de líderes no período.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                
                                {/* Eixo X = OEE (Performance) */}
                                <XAxis 
                                    type="number" 
                                    dataKey="equipaOee" 
                                    name="OEE da Equipa" 
                                    domain={[0, 100]} 
                                    tick={{ fontSize: 12 }} 
                                    label={{ value: 'Rendimento da Equipa (OEE %)', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} 
                                />
                                
                                {/* Eixo Y = Cultural / Mentoria Score */}
                                <YAxis 
                                    type="number" 
                                    dataKey="mentoriaScore" 
                                    name="Avaliação Perfil Líder" 
                                    domain={[0, 4]} 
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Skill Perfil & Cultura (0.0 a 4.0)', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748b', fontWeight: 'bold' }}
                                />
                                
                                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                                {/* 9-Box Guidelines */}
                                {/* Vertical separators for Performance: 50% and 75% maybe? Let's use 50% and 70% */}
                                <ReferenceLine x={50} stroke="rgba(0,0,0,0.1)" strokeWidth={2} />
                                <ReferenceLine x={70} stroke="rgba(0,0,0,0.1)" strokeWidth={2} />
                                
                                {/* Horizontal separators for Cultural Score: 2.0 and 3.0 */}
                                <ReferenceLine y={2.0} stroke="rgba(0,0,0,0.1)" strokeWidth={2} />
                                <ReferenceLine y={3.0} stroke="rgba(0,0,0,0.1)" strokeWidth={2} />

                                {/* Top Performers Background Light Area */}
                                <ReferenceArea x1={70} x2={100} y1={3.0} y2={4.0} fill="#10b981" fillOpacity={0.08} />
                                <ReferenceArea x1={0} x2={50} y1={0} y2={2.0} fill="#ef4444" fillOpacity={0.05} />

                                <Scatter name="Líderes" data={data} fill="#6366f1" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

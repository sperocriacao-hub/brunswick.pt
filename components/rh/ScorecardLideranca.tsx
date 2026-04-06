"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ColaboradorRaioXModal } from './ColaboradorRaioXModal';

interface LiderStats {
    id: string;
    nome_operador: string;
    tag_rfid_operador?: string;
    area_nome: string;
    equipaTamanho: number;
    mentorshipCount: number;
    mtrAndon: number;
    equipaOee: number;
    suaCulturaScore: number;
    notaHst: number;
    notaObjetivos: number;
}

interface ScorecardProps {
    statsOperador: LiderStats[];
    isLeader: boolean;
}

export function ScorecardLideranca({ statsOperador, isLeader }: ScorecardProps) {
    const [selectedColaborador, setSelectedColaborador] = useState<LiderStats | null>(null);

    return (
        <Card className="bg-white border hover:border-indigo-200 transition-colors shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50">
                <CardTitle className="text-slate-700 text-lg font-extrabold flex items-center justify-between">
                    <span>Scorecard Desempenho Dirigentes</span>
                    <span className="text-xs font-normal text-slate-500">Clique na linha do Gestor para ver o Histórico/Raio-X</span>
                </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-indigo-50 border-b border-indigo-100 text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                            <th className="p-4 rounded-tl-lg">Líder (Nome & Área)</th>
                            <th className="p-4 text-center">MTR (Andon SLA)</th>
                            <th className="p-4 text-center">Índice Cultura (B.U.)</th>
                            <th className="p-4 text-center">Conformidade HST</th>
                            <th className="p-4 text-center rounded-tr-lg">Objetivos</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-slate-700">
                        {statsOperador.map((lider) => {
                            const getBadgeColor = (score: number) => {
                                if (score >= 4.0) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                                if (score >= 3.0) return 'bg-blue-100 text-blue-800 border-blue-200';
                                if (score > 0) return 'bg-rose-100 text-rose-800 border-rose-200';
                                return 'bg-slate-100 text-slate-500 border-slate-200';
                            };

                            return (
                                <tr 
                                    key={lider.id} 
                                    onClick={() => setSelectedColaborador(lider)}
                                    className="border-b border-slate-100 hover:bg-slate-50/80 transition-all cursor-pointer group"
                                >
                                    <td className="p-4 font-bold text-slate-900 flex flex-col group-hover:pl-5 transition-all">
                                        <div className="flex items-center gap-2">
                                            <span>{lider.nome_operador}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mt-0.5">
                                            {lider.area_nome}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border ${lider.mtrAndon < 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : lider.mtrAndon < 30 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                            {lider.mtrAndon > 0 ? `${lider.mtrAndon}m` : 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center justify-center w-12 h-6 text-xs font-bold rounded border ${getBadgeColor(lider.suaCulturaScore)}`}>
                                            {lider.suaCulturaScore > 0 ? lider.suaCulturaScore.toFixed(1) : '-'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center justify-center w-12 h-6 text-xs font-bold rounded border ${getBadgeColor(lider.notaHst)}`}>
                                            {lider.notaHst > 0 ? lider.notaHst.toFixed(1) : '-'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center justify-center w-12 h-6 text-xs font-bold rounded border ${getBadgeColor(lider.notaObjetivos)}`}>
                                            {lider.notaObjetivos > 0 ? lider.notaObjetivos.toFixed(1) : '-'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {statsOperador.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-10 text-center text-slate-500 italic">
                                    Nenhuma informação de Liderança neste período/filtro.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedColaborador && (
                <ColaboradorRaioXModal
                    isOpen={!!selectedColaborador}
                    operadorId={selectedColaborador.id}
                    operadorRfid={selectedColaborador.tag_rfid_operador || ''}
                    nomeOperador={selectedColaborador.nome_operador}
                    funcaoArea={selectedColaborador.area_nome || ''}
                    onClose={() => setSelectedColaborador(null)}
                    isLeader={isLeader}
                    aiContext={{
                        equipaOee: selectedColaborador.equipaOee,
                        mtrAndon: selectedColaborador.mtrAndon,
                        mentoriaScore: selectedColaborador.suaCulturaScore,
                        mentorshipCount: selectedColaborador.mentorshipCount
                    }}
                />
            )}
        </Card>
    );
}

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
                            <th className="p-4">Líder (Nome & Área)</th>
                            <th className="p-4">Tamanho Equipa</th>
                            <th className="p-4">Índice Mentoria</th>
                            <th className="p-4">SLA Tempo p/ Andon</th>
                            <th className="p-4">OEE da Equipa Dir.</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-slate-700">
                        {statsOperador.map((lider) => (
                            <tr 
                                key={lider.id} 
                                onClick={() => setSelectedColaborador(lider)}
                                className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <td className="p-4 font-bold text-slate-900 flex flex-col">
                                    <span>{lider.nome_operador}</span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                                        {lider.area_nome}
                                    </span>
                                </td>
                                <td className="p-4 font-mono">
                                    {lider.equipaTamanho} operários
                                </td>
                                <td className="p-4 text-emerald-600 font-bold">
                                    {lider.mentorshipCount} Guias/Correções
                                </td>
                                <td className="p-4">
                                    <span className={`font-mono font-bold px-2 py-0.5 rounded ${lider.mtrAndon < 10 ? 'bg-green-100 text-green-700' : lider.mtrAndon < 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {lider.mtrAndon > 0 ? `${lider.mtrAndon}m Médio` : 'Nenhum Rgt.'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div className={`h-2 rounded-full ${lider.equipaOee > 80 ? 'bg-blue-500' : lider.equipaOee > 60 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, lider.equipaOee)}%` }}></div>
                                        </div>
                                        <span className="font-bold text-slate-800 w-12">{lider.equipaOee.toFixed(0)}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
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

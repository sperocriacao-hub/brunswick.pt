"use client";

import React, { useState, useMemo } from 'react';
import { Search, Activity, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ColaboradorRaioXModal } from './ColaboradorRaioXModal';
import { ExportRHButton } from './ExportRHButton';

interface ProdutividadeTableProps {
    statsOperador: any[];
    hojeIso: string;
}

export function ProdutividadeTable({ statsOperador, hojeIso }: ProdutividadeTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOperador, setSelectedOperador] = useState<any | null>(null);

    const filteredWorkers = useMemo(() => {
        if (!searchTerm) return statsOperador;
        const lower = searchTerm.toLowerCase();
        return statsOperador.filter(w =>
            w.nome_operador?.toLowerCase().includes(lower) ||
            w.tag_rfid_operador?.toLowerCase().includes(lower) ||
            w.area_nome?.toLowerCase().includes(lower)
        );
    }, [statsOperador, searchTerm]);

    return (
        <Card className="border-none shadow-xl bg-white overflow-hidden rounded-2xl ring-1 ring-slate-100">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                        <Activity size={20} className="text-blue-600" /> Rendimento Humano Diário ({hojeIso})
                    </CardTitle>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-72">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Pesquisar funcionário, ID ou área..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-white border-slate-300 w-full"
                            />
                        </div>
                        <ExportRHButton data={statsOperador} filename={`Relatorio_Assiduidade_${hojeIso}.csv`} />
                    </div>
                </div>
            </CardHeader>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Equipa / Operador</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center items-center justify-center gap-1 group">
                                Valor Produzido <span className="text-[10px] lowercase font-normal opacity-70">(minutos)</span>
                            </th>
                            <th className="px-6 py-4 text-center">
                                Desperdício <span className="text-[10px] lowercase font-normal opacity-70">(NVA)</span>
                            </th>
                            <th className="px-6 py-4 text-center text-blue-800">Taxa Value %</th>
                            <th className="px-6 py-4 text-center">Zonas de Trânsito</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredWorkers.map((worker) => (
                            <tr
                                key={worker.id}
                                onClick={() => setSelectedOperador(worker)}
                                className="hover:bg-blue-50/50 transition-colors cursor-pointer border-b border-slate-100"
                            >
                                <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm">
                                        {worker.nome_operador.substring(0, 2).toUpperCase()}
                                    </div>
                                    {worker.nome_operador}
                                </td>

                                <td className="px-6 py-4 text-center">
                                    {worker.picouHoje ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-widest shadow-sm">
                                            In-Loco
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-widest shadow-sm">
                                            Ausente
                                        </span>
                                    )}
                                </td>

                                <td className="px-6 py-4 text-center">
                                    <div className="font-bold text-slate-800 flex items-center justify-center gap-2">
                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (worker.totalTrabalhoEfetivo / 480) * 100)}%` }}></div>
                                        </div>
                                        {worker.totalTrabalhoEfetivo}m
                                    </div>
                                </td>

                                <td className="px-6 py-4 text-center">
                                    {worker.totalPausas > 0 ? (
                                        <div className="font-bold text-rose-600 flex items-center justify-center gap-1">
                                            <AlertCircle size={14} className="opacity-70" /> {worker.totalPausas}m
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 font-medium hidden sm:inline">--</span>
                                    )}
                                </td>

                                <td className="px-6 py-4 text-center text-blue-900 font-extrabold text-lg">
                                    {worker.valueRation.toFixed(0)}%
                                </td>

                                <td className="px-6 py-4 text-center font-mono opacity-80 text-xs text-slate-700">
                                    {worker.numEstacoesDiferentes} <span className="hidden sm:inline">Stations</span>
                                </td>
                            </tr>
                        ))}
                        {filteredWorkers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">
                                    Nenhum Operador Ativo encontrado com estes Filtros M.E.S.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Único Otimizado */}
            {selectedOperador && (
                <ColaboradorRaioXModal
                    isOpen={!!selectedOperador}
                    onClose={() => setSelectedOperador(null)}
                    operadorId={selectedOperador.id}
                    operadorRfid={selectedOperador.tag_rfid_operador}
                    nomeOperador={selectedOperador.nome_operador}
                    funcaoArea={selectedOperador.area_nome}
                />
            )}
        </Card>
    );
}

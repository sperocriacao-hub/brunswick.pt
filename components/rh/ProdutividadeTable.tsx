"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Activity, AlertCircle, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ColaboradorRaioXModal } from './ColaboradorRaioXModal';
import { ExportRHButton } from './ExportRHButton';

interface ProdutividadeTableProps {
    statsOperador: any[];
    mesIso: string;
    areasCatalog?: any[];
    estacoesCatalog?: any[];
    isLeader?: boolean;
}

export function ProdutividadeTable({ statsOperador, mesIso, areasCatalog = [], estacoesCatalog = [], isLeader = false }: ProdutividadeTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterArea, setFilterArea] = useState('Todas');
    const [filterEstacao, setFilterEstacao] = useState('Todas');
    const [selectedOperador, setSelectedOperador] = useState<any | null>(null);

    // Scroll Fix Issue
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const filteredWorkers = useMemo(() => {
        let result = statsOperador;

        if (filterArea !== 'Todas') {
            result = result.filter(w => w.area_base_id === filterArea);
        }

        if (filterEstacao !== 'Todas') {
            // Verifica posto base OU se trabalhou nesta estacao
            result = result.filter(w => w.posto_base_id === filterEstacao);
        }

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(w =>
                w.nome_operador?.toLowerCase().includes(lower) ||
                w.tag_rfid_operador?.toLowerCase().includes(lower) ||
                w.area_nome?.toLowerCase().includes(lower) ||
                (w.estacao_nome && w.estacao_nome.toLowerCase().includes(lower))
            );
        }

        return result;
    }, [statsOperador, searchTerm, filterArea, filterEstacao]);

    return (
        <Card className="border-none shadow-xl bg-white overflow-hidden rounded-2xl ring-1 ring-slate-100">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                        <Activity size={20} className="text-blue-600" /> Rendimento Humano Mensal ({mesIso})
                    </CardTitle>
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="flex w-full md:w-auto gap-2">
                            <select
                                value={filterArea}
                                onChange={(e) => {
                                    setFilterArea(e.target.value);
                                    setFilterEstacao('Todas');
                                }}
                                className="w-full md:w-[160px] py-2 pl-3 pr-8 border border-slate-200 rounded-md text-sm text-slate-700 focus:ring-blue-500/20 bg-white"
                            >
                                <option value="Todas">Todas Áreas</option>
                                {areasCatalog.map(a => <option key={a.id} value={a.id}>{a.nome_area}</option>)}
                            </select>

                            <select
                                value={filterEstacao}
                                onChange={(e) => setFilterEstacao(e.target.value)}
                                className="w-full md:w-[180px] py-2 pl-3 pr-8 border border-slate-200 rounded-md text-sm text-slate-700 focus:ring-blue-500/20 bg-white"
                            >
                                <option value="Todas">Todas Estações</option>
                                {estacoesCatalog
                                    .filter(e => filterArea === 'Todas' || e.area_id === filterArea)
                                    .map(e => <option key={e.id} value={e.id}>{e.nome_estacao}</option>)}
                            </select>
                        </div>

                        <div className="relative w-full md:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Pesquisar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-white border-slate-300 w-full"
                            />
                        </div>
                        <ExportRHButton data={filteredWorkers} filename={`Relatorio_Assiduidade_${mesIso}.csv`} />
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
                                    {worker.diasPresentes > 0 ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-widest shadow-sm">
                                            {worker.diasPresentes} Dia(s) In-Loco
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-widest shadow-sm">
                                            0 Dias Ausente
                                        </span>
                                    )}
                                </td>

                                <td className="px-6 py-4 text-center">
                                    <div className="font-bold text-slate-800 flex items-center justify-center gap-2">
                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (worker.totalTrabalhoEfetivo / (worker.diasPresentes > 0 ? worker.diasPresentes * 480 : 480)) * 100)}%` }}></div>
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
                    isLeader={isLeader}
                />
            )}
        </Card>
    );
}

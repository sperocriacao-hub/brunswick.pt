'use client';

import React, { useState } from 'react';
import { Search, DownloadCloud, Fingerprint, Ship, Hammer, Box, AlertTriangle, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { exportToExcel } from '@/utils/excelExport';
import { procurarGenealogiaLote } from './actions';

export default function GenealogiaAdminPage() {
    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query || query.length < 3) return;

        setIsLoading(true);
        setSearched(true);
        const res = await procurarGenealogiaLote(query.trim());
        if (res.success && res.resultados) {
            setResultados(res.resultados);
        } else {
            setResultados([]);
            alert(res.error || "Erro. Nada encontrado.");
        }
        setIsLoading(false);
    };

    const handleGenRecallReport = () => {
        if (resultados.length === 0) return;
        exportToExcel(resultados, `Recall_Lote_Genealogia_${query}`);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Fingerprint className="text-indigo-600" size={32} />
                        Motor de Genealogia B.O.M.
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Rastreabilidade Indústria 4.0: Pesquise um Lote/Série para encontrar o Barco (HIN).
                    </p>
                </div>

                <Button
                    onClick={handleGenRecallReport}
                    disabled={resultados.length === 0}
                    variant={resultados.length > 0 ? 'default' : 'outline'}
                    className={`h-12 px-6 font-bold ${resultados.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                >
                    <DownloadCloud className="mr-2" /> Gerar Relatório de Recall (Excel)
                </Button>
            </div>

            <Card className="shadow-sm border-2 border-slate-200">
                <CardContent className="p-6 md:p-10">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Digite o Lote do Fornecedor ou Lote Interno (Mín: 3 letras) ..."
                            className="h-16 text-2xl font-mono border-2 border-indigo-200 focus-visible:ring-indigo-600 bg-slate-50 rounded-xl"
                            autoFocus
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || query.length < 3}
                            className="h-16 px-10 text-xl font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
                        >
                            {isLoading ? 'A pesquisar...' : <><Search className="mr-3" size={24} /> Investigar</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {searched && (
                <div className="mt-4">
                    <h2 className="text-xl font-bold text-slate-700 mb-6 border-b border-slate-200 pb-2">
                        {resultados.length} Peças Encontradas contendo "{query}"
                    </h2>

                    {resultados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                            <AlertTriangle size={64} className="text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-600">Beco Sem Saída</h3>
                            <p className="text-slate-500 max-w-md mt-2">Nenhum registo logístico da Brunswick consumiu este lote ou numero de série até à data.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {resultados.map((row, index) => (
                                <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-indigo-500">
                                    <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">HIN da Embarcação</span>
                                            <span className="text-lg font-black text-slate-800 flex items-center gap-2">
                                                <Ship size={18} className="text-indigo-400" /> {row.barco_hin}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">O.P. Semanal</span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                S.{row.semana_producao || '?'} - OP:{row.barco_op}
                                            </span>
                                        </div>
                                    </div>

                                    <CardContent className="p-5 flex flex-col gap-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-sm font-bold text-slate-700">{row.nome_peca}</div>
                                                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                                    <Building2 size={13} /> {row.fornecedor}
                                                </div>
                                            </div>
                                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded text-xs font-mono font-bold">
                                                LOTE: {row.numero_serie_lote}
                                            </span>
                                        </div>

                                        <div className="w-full h-px bg-slate-100 my-1"></div>

                                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Hammer size={14} /> {row.estacao_instalacao}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-right justify-end">
                                                <User size={14} /> {row.operador}
                                            </div>
                                        </div>

                                        <div className="text-right mt-1">
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                Instalado a: {new Date(row.data_instalacao).toLocaleString('pt-PT')}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

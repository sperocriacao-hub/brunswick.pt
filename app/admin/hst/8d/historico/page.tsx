'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ShieldAlert, History, FileText, ArrowRight, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getHstOcorrenciasWith8D } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

export default function Hst8DHistoricoPage() {
    const router = useRouter();
    const [ocorrencias, setOcorrencias] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        setLoading(true);
        const res = await getHstOcorrenciasWith8D();
        if (res.success) {
            setOcorrencias(res.data || []);
        }
        setLoading(false);
    }

    const filteredList = ocorrencias.filter(occ => {
        const d8Exists = occ.hst_8d && occ.hst_8d.length > 0;
        const status8D = d8Exists ? occ.hst_8d[0].status : 'Sem Relatório';

        const matchesStatus = filterStatus === 'ALL' ||
            (filterStatus === 'Sem Relatório' && !d8Exists) ||
            (filterStatus === status8D);

        const searchUpper = searchTerm.toUpperCase();
        const matchesTerm = !searchTerm ||
            (occ.tipo_ocorrencia || '').toUpperCase().includes(searchUpper) ||
            (occ.descricao || '').toUpperCase().includes(searchUpper) ||
            (occ.areas_fabrica?.nome_area || '').toUpperCase().includes(searchUpper);

        return matchesStatus && matchesTerm;
    });

    return (
        <div className="p-8 space-y-8 pb-32 max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500 bg-slate-50/50 min-h-screen">
            <header className="flex justify-between items-end border-b pb-4 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <History className="text-rose-600" size={36} /> Investigação 8D HST
                    </h1>
                    <p className="text-lg text-slate-500 mt-1">Metodologia 8D para identificação de Causas Raiz de Acidentes/Incidentes</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => router.push('/admin/hst/ocorrencias')} className="bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 font-bold">
                        Central de Ocorrências
                    </Button>
                </div>
            </header>

            <div className="space-y-4">
                {/* BARRA DE FILTROS */}
                <Card className="border-slate-200 shadow-sm bg-white">
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                placeholder="Pesquisar por área, tipo de ocorrência ou descrição..."
                                className="bg-slate-50 pl-9 font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="w-full sm:w-[250px] flex items-center gap-2">
                            <Filter className="text-slate-400 w-4 h-4" />
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Estado do 8D" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="ALL">Todas as Ocorrências</SelectItem>
                                    <SelectItem value="Sem Relatório">Sem Relatório 8D</SelectItem>
                                    <SelectItem value="Rascunho">Rascunho</SelectItem>
                                    <SelectItem value="Em Investigacao">Em Investigação</SelectItem>
                                    <SelectItem value="Concluido">Concluído</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* LISTAGEM GRID */}
                {loading ? (
                    <div className="p-12 text-center text-slate-500 font-medium animate-pulse border-2 border-dashed border-slate-200 rounded-xl bg-white">
                        A carregar histórico...
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white flex flex-col items-center justify-center">
                        <ShieldAlert className="w-16 h-16 text-slate-300 mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-slate-700">Sem resultados</h3>
                        <p className="text-sm text-slate-500 mt-1">Nenhuma ocorrência encontrada para estes filtros.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500">
                                    <th className="px-6 py-4 font-bold">Data / Tipo Ocorrência</th>
                                    <th className="px-6 py-4 font-bold">Descrição Base</th>
                                    <th className="px-6 py-4 font-bold text-center">Estado 8D</th>
                                    <th className="px-6 py-4 font-bold text-center">Causa Raiz D4</th>
                                    <th className="px-6 py-4 font-bold text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredList.map(occ => {
                                    const d8Exists = occ.hst_8d && occ.hst_8d.length > 0;
                                    const relatorio8d = d8Exists ? occ.hst_8d[0] : null;

                                    return (
                                        <tr key={occ.id} className="hover:bg-slate-50/70 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-black text-slate-800 text-sm tracking-tight">{occ.tipo_ocorrencia}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-1 uppercase">
                                                    {format(new Date(occ.data_hora_ocorrencia), 'dd/MM/yyyy HH:mm')} • {occ.areas_fabrica?.nome_area}
                                                </div>
                                                <div className={`mt-2 text-[10px] px-2 py-0.5 rounded border flex gap-2 w-max font-bold uppercase ${occ.gravidade === 'Crítica' || occ.gravidade === 'Elevada' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                    Grau: {occ.gravidade}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 max-w-sm truncate" title={occ.descricao}>
                                                {occ.descricao || '-'}
                                                <div className="text-xs text-slate-400 mt-1">
                                                    Colaborador: {occ.operadores?.nome_operador || 'N/A'}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                {!d8Exists ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-500 text-xs font-bold ring-1 ring-inset ring-slate-200">
                                                        S/ Relatório
                                                    </span>
                                                ) : relatorio8d?.status === 'Concluido' ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold ring-1 ring-inset ring-emerald-200/50">
                                                        Concluído
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold ring-1 ring-inset ring-blue-200/50">
                                                        {relatorio8d?.status}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                {d8Exists && relatorio8d?.d4_causa_raiz ? (
                                                    <span className="text-xs italic text-slate-600 font-medium">Preenchida</span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    size="sm"
                                                    variant={d8Exists ? "secondary" : "outline"}
                                                    className={d8Exists ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-sm font-semibold" : "border-slate-300 text-slate-600 hover:bg-slate-50"}
                                                    onClick={() => router.push(`/admin/hst/8d/novo/${occ.id}`)}
                                                >
                                                    {d8Exists ? (
                                                        <>Abrir 8D <ArrowRight size={14} className="ml-1.5 opacity-70" /></>
                                                    ) : (
                                                        <><Plus size={14} className="mr-1.5 opacity-70" /> Iniciar 8D</>
                                                    )}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

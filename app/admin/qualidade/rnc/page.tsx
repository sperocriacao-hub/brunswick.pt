"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, FileWarning, Eye, FileText, LayoutTemplate, CopyPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getRncs } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function GestaoRncPage() {
    const router = useRouter();
    const [rncs, setRncs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        carregarRncs();
    }, []);

    async function carregarRncs() {
        setLoading(true);
        const res = await getRncs();
        if (res.success) {
            setRncs(res.data || []);
        } else {
            console.error("Falha a carregar RNCs:", res.error);
        }
        setLoading(false);
    }

    const filteredRncs = rncs.filter(rnc => {
        const matchesStatus = filterStatus === 'ALL' || rnc.status === filterStatus;
        const searchUpper = searchTerm.toUpperCase();
        const matchesTerm = !searchTerm ||
            rnc.numero_rnc.toUpperCase().includes(searchUpper) ||
            rnc.descricao_problema.toUpperCase().includes(searchUpper) ||
            rnc.detetado_por_nome.toUpperCase().includes(searchUpper);

        return matchesStatus && matchesTerm;
    });

    return (
        <div className="p-8 space-y-8 pb-32 max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500 bg-slate-50/50 min-h-screen">
            <header className="flex justify-between items-end border-b pb-4 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <FileWarning className="text-rose-600" size={36} /> Central de Não-Conformidades (RNC)
                    </h1>
                    <p className="text-lg text-slate-500 mt-1">Registo de Anomalias de Qualidade e delegação Lean (8D / A3)</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => router.push('/admin/qualidade/rnc/nova')} className="bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 font-bold">
                        <Plus className="w-5 h-5 mr-2" /> Emitir RNC
                    </Button>
                </div>
            </header>

            {/* BARRA DE FILTROS */}
            <Card className="border-slate-200 shadow-sm bg-white">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                            placeholder="Pesquisar nº relatorio (Ex: RNC-2026), defeito ou pessoa..."
                            className="bg-slate-50 pl-9 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="w-full sm:w-[250px] flex items-center gap-2">
                        <Filter className="text-slate-400 w-4 h-4" />
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Estado: Todos" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="ALL">Todo o Histórico</SelectItem>
                                <SelectItem value="Aberto">Abertas / Por Tratar</SelectItem>
                                <SelectItem value="Em Investigacao">Em Investigação (8D/A3 ativos)</SelectItem>
                                <SelectItem value="Concluido">Casos Encerrados (Concluído)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* LISTAGEM GRID */}
            {loading ? (
                <div className="p-12 text-center text-slate-500 font-medium animate-pulse border-2 border-dashed border-slate-200 rounded-xl">A sincronizar sistema M.E.S...</div>
            ) : filteredRncs.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white flex flex-col items-center justify-center">
                    <FileWarning className="w-16 h-16 text-slate-300 mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-slate-700">A Fábrica está Controlada</h3>
                    <p className="text-sm text-slate-500 mt-1">Nenhuma RNC identificada com estes filtros na Data Base.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500">
                                <th className="px-6 py-4 font-bold">Identificação Diária</th>
                                <th className="px-6 py-4 font-bold">Descrição do Defeito Detectado</th>
                                <th className="px-6 py-4 font-bold text-center">Estado / Fase</th>
                                <th className="px-6 py-4 font-bold text-center">Delegado p/ Tratar</th>
                                <th className="px-6 py-4 font-bold text-right">Ação / Tratamento</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRncs.map(rnc => {
                                const isCritical = rnc.gravidade === 'Critica' || rnc.gravidade === 'Bloqueante';
                                const isOpen = rnc.status === 'Aberto';

                                // Checking what methodology was requested/is active
                                const has8d = rnc.qualidade_8d && rnc.qualidade_8d.length > 0;
                                const hasA3 = rnc.qualidade_a3 && rnc.qualidade_a3.length > 0;

                                return (
                                    <tr key={rnc.id} className="hover:bg-slate-50/70 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-black text-slate-800 text-sm tracking-tight">{rnc.numero_rnc}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-1 uppercase">
                                                {new Date(rnc.data_deteccao).toLocaleDateString()} • {rnc.detetado_por_nome}
                                            </div>
                                            {(rnc.ordens_producao || rnc.estacoes) && (
                                                <div className="mt-2 text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex gap-2 w-max text-slate-600 font-bold uppercase">
                                                    {rnc.ordens_producao ? `O.P. ${rnc.ordens_producao?.id?.split('-')[0]}` : ''}
                                                    {rnc.estacoes ? ` • ST: ${rnc.estacoes?.nome_estacao}` : ''}
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-black tracking-widest uppercase border ${isCritical ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                    {rnc.tipo_defeito} ({rnc.gravidade})
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium line-clamp-2 pr-4">{rnc.descricao_problema}</p>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${isOpen ? 'bg-rose-500 text-white border-rose-600 shadow-sm' :
                                                    rnc.status === 'Concluido' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                        'bg-blue-100 text-blue-700 border-blue-200'
                                                }`}>
                                                {rnc.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            {/* Representação Visual da Metodologia Adotada */}
                                            {has8d ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded shadow-sm">Método 8D</span>
                                                    <span className="text-[10px] text-slate-500 uppercase">{rnc.qualidade_8d[0].status}</span>
                                                </div>
                                            ) : hasA3 ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shadow-sm">Canvas A3</span>
                                                    <span className="text-[10px] text-slate-500 uppercase">{rnc.qualidade_a3[0].status}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium italic">Sem Metodologia<br />Atribuída</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {!has8d && !hasA3 && (
                                                    <>
                                                        <Button variant="outline" size="sm" className="h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs" onClick={() => router.push(`/admin/qualidade/rnc/8d/novo/${rnc.id}`)}>
                                                            <CopyPlus className="w-3 h-3 mr-1" /> Gerar 8D
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs" onClick={() => router.push(`/admin/qualidade/rnc/a3/novo/${rnc.id}`)}>
                                                            <LayoutTemplate className="w-3 h-3 mr-1" /> Gerar A3
                                                        </Button>
                                                    </>
                                                )}

                                                {has8d && (
                                                    <Button variant="default" size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => router.push(`/admin/qualidade/rnc/8d/${rnc.qualidade_8d[0].id}`)}>
                                                        <FileText className="w-3 h-3 mr-1" /> Editar 8D
                                                    </Button>
                                                )}

                                                {hasA3 && (
                                                    <Button variant="default" size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => router.push(`/admin/qualidade/rnc/a3/${rnc.qualidade_a3[0].id}`)}>
                                                        <LayoutTemplate className="w-3 h-3 mr-1" /> Editar A3
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

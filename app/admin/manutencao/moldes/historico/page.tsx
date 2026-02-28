'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buscarHistoricoIntervencoes } from './actions';
import { Search, Loader2, CalendarClock, ShieldAlert, Cpu, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HistoricoTPMPage() {
    const router = useRouter();
    const [historico, setHistorico] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        carregarHistorico();
    }, []);

    async function carregarHistorico() {
        setLoading(true);
        const res = await buscarHistoricoIntervencoes();
        if (res.success) {
            setHistorico(res.data || []);
        } else {
            console.error(res.error);
        }
        setLoading(false);
    }

    const logsFiltrados = historico.filter(h => {
        const p1 = (h.status || '').toLowerCase().includes(searchTerm.toLowerCase());
        const p2 = (h.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
        const p3 = (h.moldes?.nome_parte || '').toLowerCase().includes(searchTerm.toLowerCase());
        const p4 = (h.id || '').toLowerCase().includes(searchTerm.toLowerCase());
        return p1 || p2 || p3 || p4;
    });

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">A carregar registos arquitetivos de manutenção...</div>;

    return (
        <div className="p-8 space-y-8 pb-32 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500">
            <header className="flex justify-between items-end border-b pb-4 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Arquivos Manutenção TPM</h1>
                    <p className="text-lg text-slate-500 mt-1">Registo Histórico Global de todas as Ordens de Serviço (Intervenções) do Estaleiro.</p>
                </div>
                <Button variant="outline" onClick={() => router.push('/admin/manutencao/moldes')}>
                    Regressar à Grelha TPM
                </Button>
            </header>

            <div className="flex gap-4 items-center w-full max-w-xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                        placeholder="Pesquisar por Categoria, Molde, Status ou ID O.S. ..."
                        className="pl-10 h-12 text-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-slate-700 font-bold"><CalendarClock className="w-5 h-5" /> Arquivo Cronológico O.S.</CardTitle>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-white border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                <th className="px-6 py-4 font-bold">Identificação O.S.</th>
                                <th className="px-6 py-4 font-bold">Molde Intervencionado</th>
                                <th className="px-6 py-4 font-bold">Relatório (Motivo / Avaria)</th>
                                <th className="px-6 py-4 font-bold">Data Abertura</th>
                                <th className="px-6 py-4 font-bold">Estado / Fecho</th>
                                <th className="px-6 py-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {logsFiltrados.map((log) => {
                                const isFechado = log.status === 'Concluída';
                                return (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-xs text-slate-500">#{log.id.split('-')[0]}...</div>
                                            <div className="text-xs font-bold mt-1 text-slate-800 uppercase">OS-TPM</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800 text-sm uppercase">{log.moldes?.nome_parte || 'Desconhecido'}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                                                <Cpu size={10} /> {log.moldes?.rfid || 'S/ TAG'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-[300px]">
                                            <p className="text-xs text-slate-600 truncate font-medium bg-slate-100 px-2 py-1 rounded inline-block" title={log.descricao || 'Fim de Ciclo Standard'}>
                                                {log.descricao || 'Intervenção Standard Fim de Ciclo'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-700">{new Date(log.data_abertura).toLocaleDateString('pt-PT')}</div>
                                            <div className="text-xs text-slate-400">{new Date(log.data_abertura).toLocaleTimeString('pt-PT')}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest ${isFechado ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                                                {log.status}
                                            </span>
                                            {log.data_conclusao && (
                                                <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold">
                                                    Resolvido a: {new Date(log.data_conclusao).toLocaleDateString('pt-PT')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {/* Users can view the cockpit even if closed to generate the PDF again or revisit the visual map */}
                                            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/manutencao/moldes/${log.moldes?.id}`)}>
                                                <Wrench className="w-4 h-4 mr-2" /> Auditar
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {logsFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                                        Nenhum histórico de manutenção encontrado para esta pesquisa.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

'use client';

import React, { useEffect, useState } from 'react';
import { getAndonHistory, fecharAlertaAndon } from './actions';
import { AlertCircle, Clock, CheckCircle2, Factory, Hammer } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, differenceInMinutes } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function AndonDashPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [alertas, setAlertas] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        const res = await getAndonHistory();
        if (res.success) {
            setAlertas(res.data);
        }
        setIsLoading(false);
    }

    async function handleResolver(id: string) {
        if (!window.confirm("Confirmar que este problema na Estação foi superado e a produção retomou?")) return;

        setIsLoading(true);
        await fecharAlertaAndon(id);
        await loadData();
    }

    // Calcula tempo perdido OEE
    const calcularTempoPerdido = (start: string, end: string | null) => {
        if (!end) {
            const minutes = differenceInMinutes(new Date(), new Date(start));
            return `${minutes} min (Aberto)`;
        }
        return `${differenceInMinutes(new Date(end), new Date(start))} min`;
    };

    return (
        <div className="p-8 pb-32 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={36} />
                    Gestão Pós-Venda Fabril (Andon & KPIs)
                </h1>
                <p className="text-slate-500 mt-2 text-lg">
                    Monitorize a saúde da linha de produção e feche incidentes para medir tempos perdidos de OEE.
                </p>
            </header>

            <Card className="shadow-xl border-slate-200">
                <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-slate-800 flex items-center gap-2">
                            <Factory size={20} className="text-blue-500" /> Histórico de Paragens
                        </CardTitle>
                    </div>
                    <Button variant="outline" onClick={loadData} disabled={isLoading}>
                        Atualizar
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Data/Hora</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4">Área / Estação</th>
                                    <th className="px-6 py-4">Contexto O.P.</th>
                                    <th className="px-6 py-4">Causa Principal</th>
                                    <th className="px-6 py-4 text-center">T. Perdido (OEE)</th>
                                    <th className="px-6 py-4 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr><td colSpan={7} className="text-center p-8 text-slate-400">A carregar métricas...</td></tr>
                                ) : alertas.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center p-8 text-slate-400">Nenhum incidente Andon registado na fábrica.</td></tr>
                                ) : (
                                    alertas.map((al) => (
                                        <tr key={al.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-slate-500 whitespace-nowrap">
                                                {format(new Date(al.created_at), 'dd/MM/yy HH:mm')}
                                            </td>
                                            <td className="px-6 py-4">
                                                {al.resolvido ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                        <CheckCircle2 size={14} /> Solucionado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">
                                                        <AlertCircle size={14} /> Em Alerta
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-700">{al.estacoes?.nome_estacao || 'N/A'}</div>
                                                <div className="text-xs text-slate-500">{al.estacoes?.areas_fabrica?.nome_area || 'Área Desconhecida'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-indigo-600">{al.ordens_producao?.hin_hull_id || al.ordens_producao?.op_numero || 'Genérico'}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-[150px]">{al.ordens_producao?.modelos?.nome_modelo}</div>
                                            </td>
                                            <td className="px-6 py-4 max-w-sm">
                                                <div className="font-bold text-slate-800">{al.tipo_alerta}</div>
                                                <div className="text-xs text-slate-500 mt-1 italic truncate">{al.descricao_alerta || '- Sem notas adicionais -'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono font-bold">
                                                <span className={al.resolvido ? "text-slate-600" : "text-red-500"}>
                                                    {calcularTempoPerdido(al.created_at, al.resolvido_at)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {!al.resolvido && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                                                        onClick={() => handleResolver(al.id)}
                                                    >
                                                        <Hammer size={16} className="mr-2" />
                                                        Resolver
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

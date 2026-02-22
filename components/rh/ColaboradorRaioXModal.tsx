"use client";

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Activity, XCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { RadarClientChart } from '@/components/rh/RadarClientChart';
import { LineClientChart } from '@/components/rh/LineClientChart';
import { createClient } from '@/utils/supabase/client';

interface ColaboradorRaioXModalProps {
    operadorId: string;
    operadorRfid: string;
    nomeOperador: string;
    funcaoArea: string;
    children: React.ReactNode;
}

export function ColaboradorRaioXModal({ operadorId, operadorRfid, nomeOperador, funcaoArea, children }: ColaboradorRaioXModalProps) {
    const supabase = createClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Data Holders
    const [historicoRadar, setHistoricoRadar] = useState<any[]>([]);
    const [historicoLinha, setHistoricoLinha] = useState<any[]>([]);
    const [apontamentosNegativos, setApontamentosNegativos] = useState<any[]>([]);

    const carregarDadosIndividuais = async (open: boolean) => {
        setIsOpen(open);
        if (!open || isLoading) return;

        setIsLoading(true);

        const dataLimiar = new Date();
        dataLimiar.setDate(dataLimiar.getDate() - 30);
        const trintaDiasStr = dataLimiar.toISOString().split('T')[0];

        // 1. Fetch Médias dos 7 Pilares (Radar)
        const { data: radarMedias } = await supabase.rpc('get_medias_operador_v2', { target_rfid: operadorRfid });

        const formattedRadar = [
            { subject: 'EPI & Fardamento', A: radarMedias?.[0]?.med_epi || 0 },
            { subject: 'Assiduidade (HST)', A: radarMedias?.[0]?.med_hst || 0 },
            { subject: 'Auditoria Qualidade', A: radarMedias?.[0]?.med_qualidade || 0 },
            { subject: 'Metodologia 5S', A: radarMedias?.[0]?.med_5s || 0 },
            { subject: 'Rendimento OEE', A: radarMedias?.[0]?.med_rendimento || 0 },
            { subject: 'Polivalência', A: radarMedias?.[0]?.med_polivalencia || 0 },
            { subject: 'Inovação / Kaisen', A: radarMedias?.[0]?.med_kaisen || 0 },
        ];
        setHistoricoRadar(formattedRadar);

        // 2. Fetch OEE Timeline (Linha de Progressão) Últimos 30 Dias
        const { data: linhasRaw } = await supabase.from('avaliacoes_diarias')
            .select('data_avaliacao, pilar_rendimento_oee')
            .eq('operador_rfid', operadorRfid)
            .gte('data_avaliacao', trintaDiasStr)
            .order('data_avaliacao', { ascending: true });

        const formattedLinha = linhasRaw?.map(row => ({
            date: new Date(row.data_avaliacao).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }),
            score: row.pilar_rendimento_oee
        })) || [];
        setHistoricoLinha(formattedLinha);

        // 3. Fetch Apontamentos Negativos Recentes (Abaixo de 2)
        const { data: anotacoesRaw } = await supabase.from('apontamentos_negativos')
            .select('data_registo, pilar_afetado, nota_atribuida, justificacao, avaliador_nome')
            .eq('operador_id', operadorId)
            .order('data_registo', { ascending: false })
            .limit(10);

        setApontamentosNegativos(anotacoesRaw || []);
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={carregarDadosIndividuais}>
            <DialogTrigger asChild>
                {/* O trigger é a própria `tr` ou botão envolvente vindo do Parent */}
                <div className="cursor-pointer">{children}</div>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 border-none bg-slate-50 shadow-2xl">
                <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-6 shadow-sm">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xl flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-slate-200">
                                {nomeOperador.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-extrabold text-slate-800 tracking-tight">{nomeOperador}</DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium text-sm mt-1 whitespace-nowrap">
                                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 mr-2 border border-slate-200">{operadorRfid}</span>
                                    {funcaoArea}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-20 animate-pulse text-slate-400">
                            <Activity className="animate-bounce mb-4 text-blue-300" size={32} />
                            <p className="font-semibold text-sm uppercase tracking-widest">A carregar métricas M.E.S...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* COL 1: O Perfil Estático (Radar Recharts) */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-[400px]">
                                    <h3 className="text-xs uppercase tracking-widest font-extrabold text-slate-500 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                                        <TrendingUp size={16} className="text-indigo-500" /> Perfil Competências
                                    </h3>
                                    <div className="h-[300px] -mx-4">
                                        <RadarClientChart data={historicoRadar} />
                                    </div>
                                </div>
                            </div>

                            {/* COL 2: Trajetória Temporal & Feedbacks (Linear + Lista) */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-[400px]">
                                    <h3 className="text-xs uppercase tracking-widest font-extrabold text-slate-500 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                                        <Activity size={16} className="text-blue-500" /> Tendência Produtividade (30 Dias)
                                    </h3>
                                    <div className="h-[280px]">
                                        <LineClientChart data={historicoLinha} />
                                    </div>
                                </div>

                                <div className="bg-rose-50/30 rounded-xl shadow-sm border border-rose-100 p-6">
                                    <h3 className="text-xs uppercase tracking-widest font-extrabold text-rose-800 mb-6 flex items-center gap-2 border-b border-rose-100 pb-3">
                                        <AlertTriangle size={16} className="text-rose-600" /> Diário de Inconformidades (Feedback Mode)
                                    </h3>

                                    {apontamentosNegativos.length === 0 ? (
                                        <div className="text-center py-8 text-emerald-600 font-medium bg-emerald-50 rounded-lg border border-emerald-100">
                                            🎉 Nenhuma infração ou nota inferior a 2.0 foi registada nos últimos tempos. Desempenho Impecável!
                                        </div>
                                    ) : (
                                        <ul className="space-y-4">
                                            {apontamentosNegativos.map((incidente, i) => (
                                                <li key={i} className="bg-white p-4 rounded-lg shadow-sm border border-rose-100 relative overflow-hidden group">
                                                    <div className="absolute left-0 top-0 w-1 h-full bg-rose-400"></div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <XCircle size={14} className="text-rose-500" />
                                                            <span className="font-bold text-slate-800 text-sm">Problema de {incidente.pilar_afetado}</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold tracking-wider text-rose-500 bg-rose-50 px-2 py-1 rounded">Nota: {incidente.nota_atribuida}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-md border border-slate-100 my-3">
                                                        "{incidente.justificacao}"
                                                    </p>
                                                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                        <span>Registado a {new Date(incidente.data_registo).toLocaleDateString('pt-PT')}</span>
                                                        <span>Auditor: {incidente.avaliador_nome}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

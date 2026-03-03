import React from 'react';
import { getAuditoriaById, getDetalheAuditoria } from '../actions';
import { ArrowLeft, CheckCircle, XCircle, FileText, UserCircle2, MapPin, CalendarDays, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;

    // Fetch Header Info
    const { success: okAudit, data: audit } = await getAuditoriaById(resolvedParams.id);

    // Fetch Answers
    const { success: okResp, data: respostas } = await getDetalheAuditoria(resolvedParams.id);

    if (!okAudit || !audit) {
        return notFound();
    }

    const auditDate = new Date(audit.data_auditoria);
    const score = Number(audit.score_percentual);

    // Grouping logic for rendering UI
    const respostasArray = respostas || [];
    const grouped = respostasArray.reduce((acc: any, r: any) => {
        const cat = r.hst_auditorias_topicos?.categoria || "Outros";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
    }, {});

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500 pb-20">
            {/* Header Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200">
                <div className="flex items-center gap-4">
                    <a href="/admin/hst/auditorias" className="p-2 border rounded-full hover:bg-slate-100 transition-colors text-slate-500">
                        <ArrowLeft size={20} />
                    </a>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            Relatório de Inspeção
                        </h1>
                        <p className="text-slate-500 font-medium text-sm flex items-center gap-2 mt-1">
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">ID: {audit.id.split('-')[0]}</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    {/* Score Highlight */}
                    <div className="bg-white border rounded-xl p-3 px-6 shadow-sm flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score Final</div>
                            <div className={`text-2xl font-black ${score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {score.toFixed(1)}%
                            </div>
                        </div>
                        <Activity className={`w-8 h-8 opacity-20 ${score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600'}`} />
                    </div>
                </div>
            </div>

            {/* Context Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-sm border-slate-200 bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-500 uppercase tracking-wider">
                            <CalendarDays className="w-4 h-4 text-blue-500" />
                            Data e Hora
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold text-slate-800">
                            {format(auditDate, "d 'de' MMMM, yyyy", { locale: pt })}
                        </p>
                        <p className="text-sm text-slate-400 font-medium">
                            {format(auditDate, "HH:mm")}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200 bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-500 uppercase tracking-wider">
                            <MapPin className="w-4 h-4 text-rose-500" />
                            Área Inspecionada
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold text-slate-800">
                            {audit.areas_fabrica?.nome_area || 'Desconhecida'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200 bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-500 uppercase tracking-wider">
                            <UserCircle2 className="w-4 h-4 text-indigo-500" />
                            Auditor Responsável
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold text-slate-800">
                            {audit.operadores?.nome_operador || 'Desconhecido'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* General Observations */}
            {audit.observacoes_gerais && (
                <Card className="shadow-sm border-amber-200 bg-amber-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700 uppercase tracking-wider">
                            <FileText className="w-4 h-4" />
                            Parecer Geral do Auditor
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-amber-900 leading-relaxed">
                            {audit.observacoes_gerais}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Detailed Answers Section */}
            <div className="space-y-8 mt-10">
                <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Detalhes da Inspeção</h2>

                {Object.keys(grouped).map(catName => (
                    <div key={catName} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="font-bold text-slate-700">{catName}</h3>
                            <Badge variant="outline" className="bg-white text-slate-500">
                                {grouped[catName].length} Itens
                            </Badge>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {grouped[catName].map((resp: any) => (
                                <div key={resp.id} className="p-6 transition-colors hover:bg-slate-50/50 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800">
                                            {resp.hst_auditorias_topicos?.topico || "Tópico Desconhecido"}
                                        </p>
                                        {resp.observacao && (
                                            <div className="mt-2 bg-slate-100 rounded-md p-3 text-sm text-slate-600 italic border-l-2 border-slate-300">
                                                "{resp.observacao}"
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:w-48 flex justify-end">
                                        {resp.conforme ? (
                                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100 font-medium text-sm">
                                                <CheckCircle size={16} /> Conforme
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-md border border-rose-100 font-medium text-sm">
                                                <XCircle size={16} /> Não Conforme
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {Object.keys(grouped).length === 0 && (
                    <div className="text-center p-12 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 italic">
                        Não foram encontradas respostas detalhadas para esta auditoria.
                    </div>
                )}
            </div>

        </div>
    );
}

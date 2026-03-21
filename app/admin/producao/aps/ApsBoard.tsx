"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Play, Pause, CheckCircle, AlertTriangle, ChevronRight, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export default function ApsBoard({ inicialOrdens = [], historicoAps = [] }: { inicialOrdens: any[], historicoAps: any[] }) {
    const [viewMode, setViewMode] = useState<"timeline" | "workcenter" | "analytics">("timeline");

    const activeOrders = inicialOrdens;
    const bottlenecks = historicoAps.sort((a, b) => b.tempo_medio_real_minutos - a.tempo_medio_real_minutos);

    const today = new Date();
    const daysArray = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return d;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-blue-900">Control Tower (APS)</h1>
                    <p className="text-slate-500">Planeamento Avançado e Motor Preditivo de Produção.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", viewMode === "timeline" ? "bg-blue-900 text-white" : "bg-white border text-slate-700 hover:bg-slate-50")}
                        onClick={() => setViewMode("timeline")}
                    >
                        Gantt / Timeline
                    </button>
                    <button
                        className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", viewMode === "workcenter" ? "bg-blue-900 text-white" : "bg-white border text-slate-700 hover:bg-slate-50")}
                        onClick={() => setViewMode("workcenter")}
                    >
                        Workcenters
                    </button>
                    <button
                        className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center", viewMode === "analytics" ? "bg-orange-600 text-white border-orange-600" : "bg-white border-orange-200 text-orange-700 hover:bg-orange-50")}
                        onClick={() => setViewMode("analytics")}
                    >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Gargalos & IA
                    </button>
                </div>
            </div>

            {viewMode === "timeline" ? (
                <Card className="overflow-hidden border-blue-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b pb-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg text-blue-900">Timeline de Ordens de Produção</CardTitle>
                            <div className="flex space-x-4 text-sm text-slate-500 hidden md:flex">
                                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-400 mr-2"></span> No Prazo</span>
                                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-400 mr-2"></span> Risco de Atraso</span>
                                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> Atrasado</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <div className="min-w-[800px]">
                            {/* Gantt Header */}
                            <div className="flex border-b bg-slate-50">
                                <div className="w-1/4 p-3 font-semibold text-slate-600 border-r flex items-center shrink-0">
                                    Ordem & Produto
                                </div>
                                <div className="w-3/4 flex">
                                    {daysArray.map((day, i) => (
                                        <div key={i} className="flex-1 border-r text-center py-2 text-xs text-slate-500 flex flex-col justify-center">
                                            <span className="font-bold">{day.getDate()}</span>
                                            <span>{day.toLocaleDateString('pt-PT', { weekday: 'short' })}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Gantt Rows */}
                            <div className="divide-y relative">
                                {activeOrders.map(order => {
                                    const productName = order.modelos?.nome_modelo || "Produto Desconhecido";
                                    const orderStart = new Date(order.data_prevista_inicio || today);
                                    
                                    let startOffsetDays = Math.floor((orderStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                    if (startOffsetDays < 0) startOffsetDays = 0;
                                    
                                    const durationDays = 5; // Placeholder temporário até termos o roteiro real mapeado
                                    let barColor = "bg-blue-400 border-blue-500";
                                    if (order.status === 'IN_PROGRESS') barColor = "bg-orange-400 border-orange-500"; 

                                    return (
                                        <div key={order.id} className="flex group hover:bg-slate-50 transition-colors">
                                            <div className="w-1/4 p-3 border-r relative z-10 bg-white group-hover:bg-slate-50 flex items-center justify-between shrink-0">
                                                <div>
                                                    <div className="font-bold text-sm text-blue-900 truncate" title={productName}>
                                                        {productName}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        <span>{order.op_numero}</span>
                                                        <span className="mx-1">•</span>
                                                        <span className={order.status === 'IN_PROGRESS' ? "text-orange-600 font-semibold" : ""}>
                                                            {order.status === 'IN_PROGRESS' ? 'Em Progresso' : 'Planeado'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button className="p-1 hover:bg-slate-200 rounded">
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="w-3/4 flex relative">
                                                {daysArray.map((_, i) => (
                                                    <div key={i} className="flex-1 border-r h-full"></div>
                                                ))}

                                                {startOffsetDays < daysArray.length && (
                                                    <div 
                                                        className={cn(
                                                            "absolute top-2 bottom-2 rounded cursor-pointer shadow-sm border flex items-center px-2 z-10 transition-transform hover:scale-[1.01]",
                                                            barColor
                                                        )}
                                                        style={{ 
                                                            left: ((startOffsetDays / daysArray.length) * 100) + "%",
                                                            width: ((Math.min(durationDays, daysArray.length - startOffsetDays) / daysArray.length) * 100) + "%"
                                                        }}
                                                        title={"Início: " + orderStart.toLocaleDateString() + " | Duração Prev.: " + durationDays + " dias"}
                                                    >
                                                        <span className="text-[10px] font-bold text-white truncate drop-shadow-md">
                                                            {order.op_tipo === 'Sub-OP' ? `Componente filho de ${order.parent_op_id?.substring(0,4)}` : "Montagem Principal"}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {activeOrders.length === 0 && (
                                    <div className="p-8 text-center text-slate-500">
                                        Nenhuma ordem ativa.
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : viewMode === "workcenter" ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="bg-blue-50/50 pb-4 border-b">
                            <CardTitle className="text-lg flex justify-between items-center">
                                Estação: Laminação
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Ativa</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="border rounded-lg p-3 bg-white shadow-sm flex flex-col space-y-3">
                                <div className="flex justify-between">
                                    <span className="font-bold text-sm">Interceptor 40 (PO-1001)</span>
                                    <span className="text-xs text-orange-600 font-bold bg-orange-100 px-2 rounded-full flex items-center">Em Atraso</span>
                                </div>
                                <div className="text-xs text-slate-500 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Tempo Previsto (Padrão):</span>
                                        <span className="font-mono">08h 30m</span>
                                    </div>
                                    <div className="flex justify-between font-medium text-orange-700">
                                        <span>Tempo Previsto (IA):</span>
                                        <span className="font-mono text-orange-700">10h 15m (+1h 45m)</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button className="w-full flex items-center justify-center h-8 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition">
                                        <CheckCircle className="w-3 h-3 mr-1"/> Concluir
                                    </button>
                                    <button className="w-full flex items-center justify-center h-8 text-xs text-orange-600 border border-orange-200 rounded hover:bg-orange-50 transition">
                                        <Pause className="w-3 h-3 mr-1"/>Pausa
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : viewMode === "analytics" ? (
                <div className="space-y-6">
                    <Card className="border-orange-200 bg-orange-50/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl flex items-center text-orange-800">
                                <AlertTriangle className="mr-2 h-5 w-5" /> Motor Preditivo de Gargalos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 mb-6 font-medium">Análise histórica dos desvios de tempo real vs padrão (Últimos 30 dias)</p>
                            
                            <div className="grid gap-4 md:grid-cols-3">
                                {bottlenecks.map((b, i) => (
                                    <div key={b.nome_estacao} className="bg-white border p-4 rounded-lg shadow-sm border-orange-200">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-bold text-slate-800">{b.nome_estacao}</h4>
                                                <p className="text-xs text-slate-500 mt-1">{b.nome_modelo} ({b.amostras_coletadas} amostras)</p>
                                            </div>
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold text-xs">
                                                #{i + 1}
                                            </span>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Média (Padrão: {b.sla_teorico_cadastrado}):</span>
                                                <span className="font-bold text-red-600">{b.tempo_medio_real_minutos} min</span>
                                            </div>
                                            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5" title={`Pior tempo absoluto: ${b.pior_tempo_minutos} min`}>
                                                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: Math.min(100, (b.tempo_medio_real_minutos / Math.max(1, b.sla_teorico_cadastrado)) * 50) + "%" }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : null}
        </div>
    );
}

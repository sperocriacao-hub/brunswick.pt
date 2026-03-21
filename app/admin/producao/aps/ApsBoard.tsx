"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Play, Pause, CheckCircle, AlertTriangle, ChevronRight, Filter, GripVertical } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DndContext, useDraggable, useDroppable, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { salvarPlaneamentoAPS } from "./actions";

// --- Custom Draggable for Orders ---
function DraggableOrder({ order, children, className }: { order: any, children: React.ReactNode, className?: string }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: order.id,
        data: { order }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.8 : 1
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn("cursor-grab active:cursor-grabbing", className)}>
            {children}
        </div>
    );
}

// --- Custom Droppable for Dates ---
function DroppableDate({ dateStr, children, className }: { dateStr: string, children?: React.ReactNode, className?: string }) {
    const { isOver, setNodeRef } = useDroppable({
        id: `date-${dateStr}`,
        data: { dateStr }
    });

    return (
        <div ref={setNodeRef} className={cn(className, isOver && "bg-blue-50 ring-2 ring-inset ring-blue-400")}>
            {children}
        </div>
    );
}

export default function ApsBoard({ inicialOrdens = [], historicoAps = [], moldesPlan = [] }: { inicialOrdens: any[], historicoAps: any[], moldesPlan?: any[] }) {
    const [viewMode, setViewMode] = useState<"timeline" | "workcenter" | "analytics">("timeline");
    const [ordersState, setOrdersState] = useState(inicialOrdens);

    const bottlenecks = historicoAps.sort((a, b) => b.tempo_medio_real_minutos - a.tempo_medio_real_minutos);
    const moldesEmRisco = moldesPlan.filter(m => m.status === 'Em Manutenção' || m.ciclos_estimados >= m.manutenir_em - 5);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to local midnight
    
    const daysArray = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return d;
    });

    // Split orders
    const scheduledOrders = ordersState.filter(o => o.data_prevista_inicio);
    const backlogOrders = ordersState.filter(o => !o.data_prevista_inicio);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const orderId = active.id as string;
        const droppableId = over.id as string;

        if (droppableId.startsWith('date-')) {
            const novaDataStr = over.data.current?.dateStr;
            if (novaDataStr) {
                // Optimistic update
                setOrdersState(prev => prev.map(o => o.id === orderId ? { ...o, data_prevista_inicio: novaDataStr, status: 'PLANNED' } : o));
                
                // Server persist
                await salvarPlaneamentoAPS(orderId, novaDataStr);
            }
        }
    };

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
                <div className="space-y-4">
                    {moldesEmRisco.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3 shadow-sm">
                            <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
                            <div className="flex-1">
                                <h4 className="font-bold text-red-900 text-sm">Alerta de Manutenções Preventivas de Moldes!</h4>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {moldesEmRisco.map(m => (
                                        <div key={m.id} className="text-xs font-semibold bg-white border border-red-200 text-red-800 px-2 py-1 rounded">
                                            {m.nome_parte} <span className="opacity-75 font-normal ml-1">({m.ciclos_estimados}/{m.manutenir_em} ciclos) - {m.status}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-red-700 mt-2">
                                    Não arraste novas Ordens de Produção que dependam destes Moldes para os dias agendados sem validação do departamento de Manutenção.
                                </p>
                            </div>
                        </div>
                    )}
                <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                <div className="flex flex-col xl:flex-row gap-6 items-start">
                    {/* BACKLOG COLUMN */}
                    <div className="w-full xl:w-64 shrink-0 space-y-3">
                        <div className="bg-slate-100 rounded-lg p-3 border shadow-sm">
                            <h3 className="font-bold text-slate-700 text-sm mb-3 flex items-center justify-between">
                                Por Planear (Backlog)
                                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{backlogOrders.length}</span>
                            </h3>
                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                                {backlogOrders.map(order => (
                                    <DraggableOrder key={order.id} order={order} className="bg-white border rounded p-2 shadow-sm relative group flex items-start gap-2">
                                        <GripVertical className="h-4 w-4 text-slate-300 mt-1 cursor-grab" />
                                        <div>
                                            <div className="text-xs font-bold text-blue-900 leading-tight">
                                                {order.modelos?.nome_modelo || "Produto"}
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                {order.op_numero}
                                            </div>
                                            {order.op_tipo === 'Sub-OP' && (
                                                <div className="text-[9px] mt-1 bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded w-max">
                                                    Sub-OP de {order.parent_op_id?.substring(0,4)}
                                                </div>
                                            )}
                                        </div>
                                    </DraggableOrder>
                                ))}
                                {backlogOrders.length === 0 && (
                                    <div className="text-xs text-center text-slate-500 py-4 opacity-60">
                                        Nenhuma OP pendente.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* GANTT AREA */}
                    <Card className="flex-1 overflow-hidden border-blue-200 shadow-sm w-full">
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg text-blue-900">Programação Gantt</CardTitle>
                                <div className="flex space-x-4 text-sm text-slate-500 hidden xl:flex">
                                    <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-400 mr-2"></span> No Prazo</span>
                                    <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-400 mr-2"></span> Risco de Atraso</span>
                                    <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> Atrasado</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <div className="min-w-[800px] lg:min-w-0">
                                {/* Gantt Header */}
                                <div className="flex border-b bg-slate-50">
                                    <div className="w-1/4 p-3 font-semibold text-slate-600 border-r flex items-center shrink-0">
                                        Ordem Escalonada
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
                                    {/* Mapeamento das Ordens já planeadas */}
                                    {scheduledOrders.map((order, orderIndex) => {
                                        const productName = order.modelos?.nome_modelo || "Produto Desconhecido";
                                        const orderStart = new Date(order.data_prevista_inicio);
                                        orderStart.setHours(0,0,0,0);
                                        
                                        let startOffsetDays = Math.floor((orderStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                        
                                        const durationDays = 5; // Placeholder
                                        let barColor = "bg-blue-400 border-blue-500";
                                        if (order.status === 'IN_PROGRESS') barColor = "bg-orange-400 border-orange-500"; 

                                        return (
                                            <div key={order.id} className="flex group hover:bg-slate-50 transition-colors h-14 relative">
                                                <DraggableOrder order={order} className="w-1/4 p-2 border-r relative z-20 bg-white group-hover:bg-slate-50 flex items-center justify-between shrink-0 h-full">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <GripVertical className="h-4 w-4 text-slate-200 shrink-0" />
                                                        <div className="overflow-hidden">
                                                            <div className="font-bold text-sm text-blue-900 truncate" title={productName}>
                                                                {productName}
                                                            </div>
                                                            <div className="text-xs text-slate-500 truncate">
                                                                <span>{order.op_numero}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </DraggableOrder>

                                                <div className="w-3/4 flex relative z-10">
                                                    {daysArray.map((day, i) => (
                                                        <DroppableDate key={i} dateStr={day.toISOString()} className="flex-1 border-r h-full relative" />
                                                    ))}

                                                    {startOffsetDays < daysArray.length && startOffsetDays >= -durationDays && (
                                                        <div 
                                                            className={cn(
                                                                "absolute top-1.5 bottom-1.5 rounded cursor-pointer shadow-sm border flex items-center px-2 z-10 transition-transform hover:scale-[1.01] pointer-events-none",
                                                                barColor
                                                            )}
                                                            style={{ 
                                                                left: `${Math.max(0, (startOffsetDays / daysArray.length) * 100)}%`,
                                                                width: `${Math.min((durationDays - (startOffsetDays < 0 ? Math.abs(startOffsetDays) : 0)) / daysArray.length, 1) * 100}%`
                                                            }}
                                                            title={`Início: ${orderStart.toLocaleDateString()}`}
                                                        >
                                                            <span className="text-[10px] font-bold text-white truncate drop-shadow-md">
                                                                {order.op_tipo === 'Sub-OP' ? `Cmp ${order.parent_op_id?.substring(0,4)}` : "Montagem"}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Empty Track row that functions as a wide droppable zone to schedule new backlog items on the first available empty line */}
                                    <div className="flex h-14 relative opacity-50 bg-slate-50 border-t-2 border-dashed">
                                        <div className="w-1/4 p-2 border-r flex flex-col justify-center items-center text-slate-400 text-xs text-center px-4 font-medium shrink-0">
                                            Arraste uma OP do Backlog aqui
                                        </div>
                                        <div className="w-3/4 flex">
                                            {daysArray.map((day, i) => (
                                                <DroppableDate key={i} dateStr={day.toISOString()} className="flex-1 border-r h-full relative" />
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {scheduledOrders.length === 0 && (
                                        <div className="p-8 text-center text-slate-500 absolute inset-0 flex items-center justify-center bg-white/50 z-0">
                                            Nenhuma ordem programada no Gantt.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                </DndContext>
                </div>
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

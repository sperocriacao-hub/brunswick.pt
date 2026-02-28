'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PackageOpen, CheckCircle, PackageCheck, Package, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { createClient } from "@supabase/supabase-js";
import { getPedidosLive, updateStatusPedido } from './actions';

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supaUrl, supaKey);

export default function ArmazemPickingPage() {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadOrders = async () => {
        setLoading(true);
        const res = await getPedidosLive();
        if (res.success) setPedidos(res.data || []);
        else console.error("Falha a carregar fila de picking:", res.error);
        setLoading(false);
    };

    useEffect(() => {
        loadOrders();

        // Realtime Subscription para novos pedidos caindo da fábrica
        const sub = supabase.channel('picking_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'logistica_pedidos' }, (payload) => {
                console.log("WebSocket M.E.S Kitting Novo Evento:", payload);
                loadOrders(); // Re-fetch para reconstruir joins
            })
            .subscribe();

        return () => { supabase.removeChannel(sub); };
    }, []);

    const handleAcao = async (id: string, currentStatus: string) => {
        if (currentStatus === 'Pendente') {
            await updateStatusPedido(id, 'Em Picking');
        } else if (currentStatus === 'Em Picking') {
            // Em produção o Operador logado é guardado; para o MVP Tablet, 'Operador Armazém'.
            await updateStatusPedido(id, 'Entregue', 'Operador Logística HUB');
        }
        loadOrders();
    };

    const pendentes = pedidos.filter(p => p.status === 'Pendente');
    const picking = pedidos.filter(p => p.status === 'Em Picking');
    const entregues = pedidos.filter(p => p.status === 'Entregue');

    if (loading && pedidos.length === 0) {
        return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-500" size={64} /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500 selection:bg-blue-100">
            <header className="mb-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-800 uppercase flex items-center gap-3">
                        <Package className="h-10 w-10 text-blue-600" />
                        HUB Logístico J.I.T.
                    </h1>
                    <p className="text-lg text-slate-500 font-medium mt-1">Grelha de Picking Automático Interligado ao M.E.S.</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center bg-white p-3 rounded-xl border border-rose-200 shadow-sm min-w[100px]">
                        <p className="text-xs uppercase font-bold text-rose-500">Pendentes</p>
                        <p className="text-2xl font-black text-rose-700">{pendentes.length}</p>
                    </div>
                    <div className="text-center bg-white p-3 rounded-xl border border-blue-200 shadow-sm min-w[100px]">
                        <p className="text-xs uppercase font-bold text-blue-500">Em Picking</p>
                        <p className="text-2xl font-black text-blue-700">{picking.length}</p>
                    </div>
                </div>
            </header>

            {/* Quadro Kanban Linear */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Coluna 1: PENDENTE */}
                <div className="bg-rose-50/40 rounded-2xl p-4 border border-rose-100 h-fit">
                    <h2 className="text-rose-800 font-black uppercase mb-4 flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5" /> Requisições Frescas ({pendentes.length})
                    </h2>
                    <div className="space-y-4">
                        {pendentes.map(p => (
                            <PedidoCard key={p.id} pedido={p} onAction={() => handleAcao(p.id, p.status)} />
                        ))}
                        {pendentes.length === 0 && <div className="text-center p-6 border-2 border-dashed border-rose-200 rounded-xl text-rose-300 font-semibold">Sem pedidos pendentes.</div>}
                    </div>
                </div>

                {/* Coluna 2: EM PICKING */}
                <div className="bg-blue-50/40 rounded-2xl p-4 border border-blue-100 h-fit">
                    <h2 className="text-blue-800 font-black uppercase mb-4 flex items-center gap-2">
                        <PackageOpen className="h-5 w-5" /> A Ser Coletado ({picking.length})
                    </h2>
                    <div className="space-y-4">
                        {picking.map(p => (
                            <PedidoCard key={p.id} pedido={p} onAction={() => handleAcao(p.id, p.status)} />
                        ))}
                        {picking.length === 0 && <div className="text-center p-6 border-2 border-dashed border-blue-200 rounded-xl text-blue-300 font-semibold">Nenhuma movimentação em curso.</div>}
                    </div>
                </div>

                {/* Coluna 3: ENTREGUE */}
                <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100 h-fit">
                    <h2 className="text-emerald-800 font-black uppercase mb-4 flex items-center gap-2">
                        <PackageCheck className="h-5 w-5" /> Entregues na Linha (Recentes)
                    </h2>
                    <div className="space-y-4">
                        {entregues.slice(0, 10).map(p => (
                            <PedidoCard key={p.id} pedido={p} onAction={() => { }} />
                        ))}
                        {entregues.length === 0 && <div className="text-center p-6 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-300 font-semibold">Sem entregas hoje.</div>}
                    </div>
                </div>

            </div>
        </div>
    );
}

function PedidoCard({ pedido, onAction }: { pedido: any, onAction: () => void }) {
    const isPendente = pedido.status === 'Pendente';
    const isPicking = pedido.status === 'Em Picking';

    // Fallback safe rendering 
    const barcoId = pedido.ordens_producao?.hin_hull_id || 'BARCO N/A';
    const modeloNome = pedido.ordens_producao?.modelos?.nome || 'Modelo N/A';
    const estacaoNome = pedido.estacoes?.nome_estacao || 'Estação Desconhecida';
    const areaNome = pedido.estacoes?.areas_fabrica?.nome_area || '';

    const timeSince = Math.floor((new Date().getTime() - new Date(pedido.created_at).getTime()) / 60000);

    return (
        <Card className={`overflow-hidden shadow-sm transition-all hover:shadow-md border-l-4 ${isPendente ? 'border-l-rose-500' : isPicking ? 'border-l-blue-500' : 'border-l-emerald-500 bg-emerald-50/20 opacity-80'}`}>
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <Badge variant="outline" className={`${isPendente ? 'bg-rose-100 text-rose-800 border-rose-200' : isPicking ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'} font-bold`}>
                            {pedido.status}
                        </Badge>
                        {pedido.prioridade === 'Urgente' && <Badge variant="destructive" className="ml-2 bg-red-600 animate-pulse">URGENTE</Badge>}
                    </div>
                    {isPendente && (
                        <div className="flex items-center text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded">
                            <Clock className="w-3 h-3 mr-1" /> {timeSince}min à espera
                        </div>
                    )}
                </div>
                <CardTitle className="mt-3 text-lg font-black text-slate-800 tracking-tight">{barcoId}</CardTitle>
                <CardDescription className="text-slate-500 font-medium">{modeloNome}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1">
                <div className="bg-slate-100 rounded-lg p-3 text-sm my-3 border border-slate-200 shadow-inner">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Entregar Para:</p>
                    <p className="font-semibold text-slate-800 flex items-center gap-2">
                        {areaNome} <ArrowRight className="w-3 h-3 text-slate-400" /> {estacaoNome}
                    </p>
                    {pedido.peca_solicitada && (
                        <div className="mt-2 text-xs border-t border-slate-200 pt-2 font-mono text-cyan-700">
                            <strong>PEÇA:</strong> {pedido.peca_solicitada}
                        </div>
                    )}
                </div>

                {isPendente && (
                    <Button onClick={onAction} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-md">
                        <PackageOpen className="mr-2 h-5 w-5" /> Iniciar Separação (Picking)
                    </Button>
                )}
                {isPicking && (
                    <Button onClick={onAction} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow-md">
                        <CheckCircle className="mr-2 h-5 w-5" /> Confirmar Entrega na Linha
                    </Button>
                )}
                {!isPendente && !isPicking && pedido.delivered_at && (
                    <div className="text-center text-xs font-bold text-emerald-600 uppercase mt-2">
                        Entregue a: {new Date(pedido.delivered_at).toLocaleTimeString('pt-PT')}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

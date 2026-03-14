'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers, PlusCircle, Search, MoreHorizontal, Eye, XCircle, AlertCircle, CalendarDays, Activity } from 'lucide-react';
import { getProductionOrders, inactivateProductionOrder } from './actions';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";

export default function GeneralOrdersDashboard() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const checkOrders = async () => {
        setIsLoading(true);
        const res = await getProductionOrders();
        if (res.success && res.data) {
            setOrders(res.data);
            setFilteredOrders(res.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        checkOrders();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredOrders(orders);
            return;
        }
        const lower = searchTerm.toLowerCase();
        setFilteredOrders(orders.filter(o =>
            (o.op_numero || '').toLowerCase().includes(lower) ||
            (o.display_nome || '').toLowerCase().includes(lower) ||
            (o.rfid_token || '').toLowerCase().includes(lower) ||
            (o.modelos?.nome_modelo || '').toLowerCase().includes(lower) ||
            (o.status || '').toLowerCase().includes(lower)
        ));
    }, [searchTerm, orders]);

    const handleCancelOrder = async (orderId: string, orderNumber: string) => {
        if (!window.confirm(`Tem a certeza absoluta de que quer CANCELAR a Ordem de Produção ${orderNumber}? Ela será removida dos postos da fábrica imediatamente.`)) return;

        const res = await inactivateProductionOrder(orderId);
        if (res.success) {
            checkOrders();
        } else {
            alert(res.error);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Planeada': return 'bg-amber-100 text-amber-700 hover:bg-amber-200';
            case 'Em Producao': return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
            case 'Concluida': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200';
            case 'Cancelada': return 'bg-rose-100 text-rose-700 hover:bg-rose-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Cabecalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <Layers className="text-blue-600" size={32} />
                        Gestão de Ordens de Produção
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">
                        Consulte o histórico, gira o status e emita novas Ordens de Fabrico para o Shopfloor.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                    <Link href="/admin/producao/nova">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full sm:w-auto h-11 px-6 shadow-sm">
                            <PlusCircle className="mr-2 h-5 w-5" /> Emitir Nova OP
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metricas Rapidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total OTs</p>
                        <p className="text-2xl font-black text-slate-800">{orders.length}</p>
                    </div>
                </Card>
                <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <CalendarDays size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Planeadas</p>
                        <p className="text-2xl font-black text-amber-600">
                            {orders.filter(o => o.status === 'Planeada').length}
                        </p>
                    </div>
                </Card>
                <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Layers size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Em Produção</p>
                        <p className="text-2xl font-black text-emerald-600">
                            {orders.filter(o => o.status === 'Em Producao').length}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Painel Principal */}
            <div className="bg-white border text-card-foreground shadow-sm rounded-xl overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Pesquisar NOP, Barco ou RFID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 w-full bg-white border-slate-200 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold text-slate-600">Barco</TableHead>
                                <TableHead className="font-bold text-slate-600">Nº Ordem</TableHead>
                                <TableHead className="font-bold text-slate-600">Modelo</TableHead>
                                <TableHead className="font-bold text-slate-600">Status M.E.S</TableHead>
                                <TableHead className="font-bold text-slate-600">Início Mestre</TableHead>
                                <TableHead className="font-bold text-slate-600">Fim Mestre</TableHead>
                                <TableHead className="text-right font-bold text-slate-600">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-slate-500 bg-slate-50 mt-10 p-10 animate-pulse">
                                        <Layers className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                        A sincronizar livro-razão da Produção...
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-slate-500 bg-slate-50 font-medium">
                                        <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                        Nenhuma Ordem de Produção encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-blue-50/30 transition-colors">
                                        <TableCell className="font-bold text-blue-900 border-l-2 border-transparent">
                                            {order.display_nome || '--'}
                                            {order.rfid_token && (
                                                <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase font-mono tracking-wider translate-y-[-1px]">
                                                    <Activity className="inline w-3 h-3 mr-1" />{order.rfid_token}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-700">
                                            {order.op_numero}
                                            {order.prioridade === 'Urgente' && (
                                                <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0 h-4 uppercase translate-y-[-2px]">🔥 Hot</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-600">{order.modelos?.nome_modelo || '--'}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={getStatusStyle(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-500 font-mono text-sm">
                                            {order.data_inicio ? new Date(order.data_inicio).toLocaleDateString() : '--'}
                                        </TableCell>
                                        <TableCell className="text-slate-500 font-mono text-sm">
                                            {order.data_fim ? new Date(order.data_fim).toLocaleDateString() : '--'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 border border-slate-200">
                                                        <span className="sr-only">Abrir menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 font-medium">
                                                    <DropdownMenuLabel className="text-xs uppercase text-slate-500 tracking-wider">Ações Documentais</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer font-bold text-blue-600 focus:bg-blue-50 focus:text-blue-700"
                                                        onClick={() => router.push('/admin/producao/live')}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Ver Rastreamento Live
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer font-bold text-amber-600 focus:bg-amber-50 focus:text-amber-700"
                                                        onClick={() => router.push(`/admin/producao/editar/${order.id}`)}
                                                    >
                                                        <Activity className="mr-2 h-4 w-4" /> {/* Or Pencil/Edit icon if available */}
                                                        Editar Ordem / Tracker
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {order.status !== 'Cancelada' && order.status !== 'Concluida' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleCancelOrder(order.id, order.numero)}
                                                            className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer font-bold"
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Inativar / Cancelar Esta OP
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

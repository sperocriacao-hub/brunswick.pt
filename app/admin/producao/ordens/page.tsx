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
    const [linhas, setLinhas] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [wips, setWips] = useState<any[]>([]);
    const [feriados, setFeriados] = useState<any[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterMes, setFilterMes] = useState(() => new Date().toISOString().slice(0, 7));
    const [filterPeriodoInicio, setFilterPeriodoInicio] = useState('');
    const [filterPeriodoFim, setFilterPeriodoFim] = useState('');
    const [filterLinha, setFilterLinha] = useState('all');
    const [filterArea, setFilterArea] = useState('all');

    const [isLoading, setIsLoading] = useState(true);

    const checkOrders = async () => {
        setIsLoading(true);
        const res = await getProductionOrders();
        if (res.success && res.data) {
            setOrders(res.data);
            setFilteredOrders(res.data);
            setLinhas(res.linhas || []);
            setAreas(res.areas || []);
            setWips(res.wips || []);
            setFeriados(res.feriados || []);
        } else {
            alert('🚨 ERRO DB: ' + res.error);
        }
        setIsLoading(false);
    };
    useEffect(() => {
        checkOrders();
    }, []);

    useEffect(() => {
        let result = orders;

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(o =>
                (o.op_numero || '').toLowerCase().includes(lower) ||
                (o.display_nome || '').toLowerCase().includes(lower) ||
                (o.rfid_token || '').toLowerCase().includes(lower) ||
                (o.modelos?.nome_modelo || '').toLowerCase().includes(lower) ||
                (o.status || '').toLowerCase().includes(lower)
            );
        }

        if (filterMes) {
            result = result.filter(o => {
                if (!o.data_fim) return false;
                const d = new Date(o.data_fim);
                const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                return monthStr === filterMes;
            });
        }

        if (filterPeriodoInicio) {
            result = result.filter(o => o.data_inicio && new Date(o.data_inicio) >= new Date(filterPeriodoInicio));
        }
        if (filterPeriodoFim) {
            result = result.filter(o => o.data_inicio && new Date(o.data_inicio) <= new Date(filterPeriodoFim));
        }

        if (filterLinha && filterLinha !== 'all') {
            result = result.filter(o => o.linha_id === filterLinha);
        }

        if (filterArea && filterArea !== 'all') {
            result = result.filter(o => {
                const activeRfid = wips.find(w => w.op_id === o.id);
                return activeRfid?.estacoes?.area_id === filterArea;
            });
        }

        // Sort ascending by data_fim
        result.sort((a, b) => {
            if (!a.data_fim) return 1;
            if (!b.data_fim) return -1;
            return new Date(a.data_fim).getTime() - new Date(b.data_fim).getTime();
        });

        setFilteredOrders(result);
    }, [searchTerm, filterMes, filterPeriodoInicio, filterPeriodoFim, filterLinha, filterArea, orders, wips]);

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

    const today = new Date();
    today.setHours(0,0,0,0);

    const overdueOrders = filteredOrders.filter(o => {
        if (o.status === 'Concluida' || o.status === 'Cancelada') return false;
        if (!o.data_fim) return false;
        return new Date(o.data_fim) < today;
    }).length;

    const riskOrders = filteredOrders.filter(o => {
        if (o.status === 'Concluida' || o.status === 'Cancelada') return false;
        if (!o.data_fim || !o.edt_estimado) return false;
        return new Date(o.edt_estimado) > new Date(o.data_fim);
    }).length;

    const calcPerc = (concl: number, tot: number) => tot === 0 ? 0 : Math.round((concl / tot) * 100);

    const activeOrdersMonth = filteredOrders.filter(o => o.status !== 'Cancelada');
    const totalThisMonth = activeOrdersMonth.length;
    const concluidasThisMonth = activeOrdersMonth.filter(o => o.status === 'Concluida').length;
    const percentConcluidoFabrica = calcPerc(concluidasThisMonth, totalThisMonth);

    const calculateTakt = (linhaId?: string) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        let startCalcDate = new Date(today);
        let year = today.getFullYear();
        let month = today.getMonth();

        if (filterMes) {
            const [fY, fM] = filterMes.split('-');
            year = parseInt(fY);
            month = parseInt(fM) - 1;
            // Se o mes selecionado for no passado ou futuro, contamos dias inteiros
            if (year !== today.getFullYear() || month !== today.getMonth()) {
                startCalcDate = new Date(year, month, 1);
            }
        }
        
        const lastDayOfMonth = new Date(year, month + 1, 0);
        if (startCalcDate > lastDayOfMonth) {
            // Histórico
            startCalcDate = new Date(year, month, 1);
        }

        let remainingWorkingDays = 0;
        let d = new Date(startCalcDate);

        while (d <= lastDayOfMonth) {
            const dayOfWeek = d.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                const isHoliday = feriados.some(f => {
                    if (!f.data_feriado) return false;
                    const ds = f.data_feriado.split('-'); // ISO YYYY-MM-DD
                    const fM = parseInt(ds[1]) - 1;
                    const fD = parseInt(ds[2]);
                    if (f.recorrente_anualmente) return fM === d.getMonth() && fD === d.getDate();
                    return parseInt(ds[0]) === d.getFullYear() && fM === d.getMonth() && fD === d.getDate();
                });
                if (!isHoliday) remainingWorkingDays++;
            }
            d.setDate(d.getDate() + 1);
        }

        let boatsToFinish = filteredOrders.filter(o => {
            if (linhaId && o.linha_id !== linhaId) return false;
            // Nao conta barcos que estao concluidos ou cancelados (ja nao exigem dias de trabalho)
            if (o.status === 'Cancelada' || o.status === 'Concluida') return false;
            
            // Se nao preencher o filterMes, deve contar apenas OPs planeadas para acabar este mes alvo
            if (!filterMes) {
                if (!o.data_fim) return false;
                const ed = new Date(o.data_fim);
                if (ed.getFullYear() !== year || ed.getMonth() !== month) return false;
            }
            return true;
        }).length;

        if (remainingWorkingDays === 0) return boatsToFinish > 0 ? "⚠️" : "0.0";
        return (boatsToFinish / remainingWorkingDays).toFixed(1);
    };

    const opsCountByLinha = linhas.map(l => {
        const opsLinha = filteredOrders.filter(o => o.linha_id === l.id && o.status !== 'Cancelada');
        const concls = opsLinha.filter(o => o.status === 'Concluida').length;
        return {
            nome: "Linha " + l.letra_linha,
            id: l.id,
            count: opsLinha.length,
            concluidas: concls,
            perc: calcPerc(concls, opsLinha.length),
            takt: calculateTakt(l.id)
        };
    }).filter(x => x.count > 0 || parseFloat(x.takt) > 0);

    const opsCountByArea = areas.map(a => ({
        nome: a.nome_area,
        count: filteredOrders.filter(o => {
            const activeRfid = wips.find(w => w.op_id === o.id);
            return activeRfid?.estacoes?.area_id === a.id;
        }).length
    })).filter(x => x.count > 0);

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

            {/* Metricas Rapidas Avancadas */}
            <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
                <Card className="p-4 border-slate-200 shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total OTs</p>
                    <p className="text-2xl font-black text-slate-800">{totalThisMonth}</p>
                </Card>
                <Card className="p-4 border-rose-200 bg-rose-50 shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1"><AlertCircle size={14}/>Atrasadas</p>
                    <p className="text-2xl font-black text-rose-700">{overdueOrders}</p>
                </Card>
                <Card className="p-4 border-amber-200 bg-amber-50 shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1"><Activity size={14}/>Risco Falhar</p>
                    <p className="text-2xl font-black text-amber-700">{riskOrders}</p>
                </Card>
                <Card className="p-4 border-slate-200 shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Takt Alvo Fábrica</p>
                    <p className="text-2xl font-black text-blue-600">{calculateTakt()}/dia</p>
                </Card>
                <Card className="p-4 border-slate-200 shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Conclusão</p>
                    <div className="flex items-center gap-3">
                        <p className="text-2xl font-black text-emerald-600">{percentConcluidoFabrica}%</p>
                        <span className="text-xs text-slate-400 font-medium pt-1">({concluidasThisMonth}/{totalThisMonth})</span>
                    </div>
                </Card>
                <Card className="p-4 border-slate-200 shadow-sm bg-slate-50 relative overflow-hidden flex flex-col justify-center col-span-2 xl:col-span-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">WIP Por Área</p>
                    <div className="space-y-1 z-10 w-full">
                        {opsCountByArea.length > 0 ? opsCountByArea.slice(0, 3).map(a => (
                            <div key={a.nome} className="flex justify-between text-xs w-full">
                                <span className="text-slate-600 truncate mr-1">{a.nome}</span>
                                <span className="font-bold text-emerald-700">{a.count}</span>
                            </div>
                        )) : <span className="text-xs text-slate-400">Sem WIP</span>}
                    </div>
                </Card>
            </div>

            {/* Metricas por Linha */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {opsCountByLinha.map(l => (
                    <Card key={l.id} className="p-4 border-slate-200 shadow-sm relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-blue-900 border-b-2 border-blue-200 pb-1">{l.nome}</h3>
                            <Badge variant="outline" className="text-[10px] bg-slate-50">{l.concluidas}/{l.count} OTs</Badge>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-500 font-semibold uppercase">Progresso</span>
                                    <span className="font-bold text-slate-700">{l.perc}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${l.perc}%` }}></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Takt Alvo Diário:</span>
                                <span className="font-black text-blue-600 text-lg">{l.takt}</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Painel Principal */}
            <div className="bg-white border text-card-foreground shadow-sm rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
                    {/* Linha de Pesquisa Livre */}
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Pesquisar livremente por NOP, Barco ou RFID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 w-full bg-white border-slate-200 focus:border-blue-500"
                        />
                    </div>
                    {/* Segunda Linha de Filtros Formais */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500">Mês Início:</label>
                            <input 
                                type="month" 
                                value={filterMes}
                                onChange={e => setFilterMes(e.target.value)}
                                className="h-9 border border-slate-200 rounded-md px-3 text-sm focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500">Período Início:</label>
                            <input 
                                type="date" 
                                value={filterPeriodoInicio}
                                onChange={e => setFilterPeriodoInicio(e.target.value)}
                                className="h-9 border border-slate-200 rounded-md px-2 text-sm focus:border-blue-500 outline-none"
                            />
                            <span className="text-slate-400 text-xs">até</span>
                            <input 
                                type="date" 
                                value={filterPeriodoFim}
                                onChange={e => setFilterPeriodoFim(e.target.value)}
                                className="h-9 border border-slate-200 rounded-md px-2 text-sm focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500">Linha:</label>
                            <select 
                                value={filterLinha}
                                onChange={e => setFilterLinha(e.target.value)}
                                className="h-9 border border-slate-200 rounded-md px-3 text-sm focus:border-blue-500 outline-none min-w-[140px]"
                            >
                                <option value="all">Todas as Linhas</option>
                                {linhas.map(l => <option key={l.id} value={l.id}>Linha {l.letra_linha}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500">WIP Área Atual:</label>
                            <select 
                                value={filterArea}
                                onChange={e => setFilterArea(e.target.value)}
                                className="h-9 border border-slate-200 rounded-md px-3 text-sm focus:border-blue-500 outline-none min-w-[140px]"
                            >
                                <option value="all">Todas as Áreas</option>
                                {areas.map(a => <option key={a.id} value={a.id}>{a.nome_area}</option>)}
                            </select>
                        </div>
                        {(filterMes || filterPeriodoInicio || filterPeriodoFim || filterLinha !== 'all' || filterArea !== 'all') && (
                            <Button 
                                variant="ghost" 
                                className="h-9 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3"
                                onClick={() => {
                                    setFilterMes('');
                                    setFilterPeriodoInicio('');
                                    setFilterPeriodoFim('');
                                    setFilterLinha('all');
                                    setFilterArea('all');
                                    setSearchTerm('');
                                }}
                            >
                                Limpar Filtros
                            </Button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold text-slate-600">Barco</TableHead>
                                <TableHead className="font-bold text-slate-600">Nº Ordem</TableHead>
                                <TableHead className="font-bold text-slate-600">RFID Token</TableHead>
                                <TableHead className="font-bold text-slate-600">Nº Série</TableHead>
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
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-700">
                                            {order.op_numero}
                                            {order.prioridade === 'Urgente' && (
                                                <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0 h-4 uppercase translate-y-[-2px]">🔥 Hot</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-emerald-700 tracking-wider text-xs">
                                            {order.rfid_token ? order.rfid_token : <span className="text-slate-300">N/A</span>}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-600">
                                            {order.num_serie || '--'}
                                        </TableCell>
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

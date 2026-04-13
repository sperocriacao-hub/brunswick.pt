'use client';

import React, { useState, useMemo } from 'react';
import { Network, Users, UserCheck, UserX, Repeat, MapPin, Search, ChevronRight, Activity, Zap, Factory } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from 'next/link';

type RadarDashboardProps = {
    areas: any[];
    linhas: any[];
    estacoes: any[];
    operadores: any[];
    presencasRfid: string[];
};

export default function RadarDashboardClient({ areas, linhas, estacoes, operadores, presencasRfid }: RadarDashboardProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEstacao, setSelectedEstacao] = useState<any | null>(null);
    const [isStationModalOpen, setIsStationModalOpen] = useState(false);

    // ---------------------------------------------------------
    // ENGINE MATEMÁTICO: ALOCAÇÕES E PRESENÇAS
    // ---------------------------------------------------------
    
    // Função Auxiliar: Verifica Presença
    const isPresent = (rfid: string) => presencasRfid.includes(rfid);

    // Mapeamentos Base da Estação
    const getOperatorsForStation = (stationId: string) => {
        // 1. Quem tem isto como Base e NÃO FOI realocado
        const baseResidentes = operadores.filter(op => op.posto_base_id === stationId && !op.em_realocacao);
        // 2. Quem tem isto como Base mas FOI realocado para fora (Desempenhou func noutro lado hoje)
        const baseEmprestadosOut = operadores.filter(op => op.posto_base_id === stationId && op.em_realocacao);
        // 3. Quem veio de fora para assumir lugar nesta estação temporariamente
        const recebidosIn = operadores.filter(op => op.em_realocacao && op.estacao_alocada_temporaria === stationId);

        // Quem está efetivamente ao serviço nesta estação HOJE: Residentes + Recebidos In
        const workingHereHoje = [...baseResidentes, ...recebidosIn];
        
        // Quantos destes presentes bateram o ponto no ESP32:
        const presentCount = workingHereHoje.filter(op => isPresent(op.tag_rfid_operador)).length;
        
        // Headcount Teórico da Estação (Lotação Padrão)
        const headCountBase = baseResidentes.length + baseEmprestadosOut.length;
        // Headcount Prático da Estação (Com flexibilidade alocada)
        const headCountTatital = workingHereHoje.length;

        // Absenteísmo da estação: (Apenas entre os que aqui deveriam estar a trabalhar hoje)
        const workingButAbsentCount = workingHereHoje.length - presentCount;

        return {
            baseResidentes,
            baseEmprestadosOut,
            recebidosIn,
            workingHereHoje,
            presentCount,
            headCountBase,
            headCountTatital,
            workingButAbsentCount
        };
    };

    // ---------------------------------------------------------
    // INDICADORES MACRO GLOBAIS (FÁBRICA STARTUP)
    // ---------------------------------------------------------
    const globalHeadcount = operadores.length;
    let globalPresentes = 0;
    let globalFaltas = 0;
    let globalRealocacoes = 0;

    operadores.forEach(op => {
        if (isPresent(op.tag_rfid_operador)) globalPresentes++;
        else globalFaltas++;
        if (op.em_realocacao) globalRealocacoes++;
    });

    const taxaAbsenteismo = globalHeadcount > 0 ? ((globalFaltas / globalHeadcount) * 100).toFixed(1) : '0.0';

    // ---------------------------------------------------------
    // RENDER: GRID POR ÁREA
    // ---------------------------------------------------------
    
    // Filtragem Geral de Ocultar Vazias e Search
    const visibleAreas = areas.map(area => {
        const estacoesArea = estacoes.filter(e => e.area_id === area.id);
        const filteredEstacoes = estacoesArea.filter(est => {
            const termo = searchQuery.toLowerCase();
            return est.nome_estacao.toLowerCase().includes(termo) || 
                   operadores.some(op => (op.posto_base_id === est.id || op.estacao_alocada_temporaria === est.id) && 
                   op.nome_operador.toLowerCase().includes(termo));
        });

        return {
            ...area,
            filteredEstacoes
        };
    }).filter(a => a.filteredEstacoes.length > 0);

    const openModal = (estacao: any) => {
        setSelectedEstacao({
            ...estacao,
            metrics: getOperatorsForStation(estacao.id)
        });
        setIsStationModalOpen(true);
    };

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in zoom-in duration-500 bg-slate-50 min-h-screen">
            
            {/* CABEÇALHO NASA */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-indigo-200 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold flex items-center gap-3 text-indigo-950 tracking-tight uppercase">
                        <Network size={36} className="text-indigo-600" />
                        Live Shopfloor Radar
                    </h1>
                    <p className="text-indigo-600/80 font-bold tracking-widest text-sm flex items-center gap-2 uppercase mt-2">
                        <Activity size={16} /> Matriz de Recursos Humanos & Ocupação
                    </p>
                </div>

                <div className="flex bg-white p-2 rounded-lg border border-indigo-100 shadow-sm">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar Estação ou Operário Ativo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border-0 bg-transparent text-sm font-semibold text-indigo-900 placeholder:text-indigo-300 focus:outline-none focus:ring-0"
                        />
                    </div>
                </div>
            </header>

            {/* KPIS MACRO ESTILO COCKPIT */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-white border-0 shadow-sm ring-1 ring-slate-200 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
                    <CardContent className="p-5 relative z-10 flex flex-col">
                        <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1 flex justify-between items-center">
                            Força de Trabalho
                            <Users size={14} className="text-slate-400" />
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-slate-800">{globalHeadcount}</span>
                            <span className="text-xs font-bold text-slate-400">ativos</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-md overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
                    <CardContent className="p-5 relative z-10 flex flex-col text-white">
                        <span className="text-emerald-100 font-bold text-[10px] uppercase tracking-widest mb-1 flex justify-between items-center">
                            Picaram Ponto Hoje
                            <UserCheck size={14} className="text-emerald-200" />
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black">{globalPresentes}</span>
                            <span className="text-xs font-bold text-emerald-200">em turnos</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm ring-1 ring-slate-200 overflow-hidden relative group">
                    <CardContent className="p-5 relative z-10 flex flex-col">
                        <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1 flex justify-between items-center">
                            Absenteísmo Tático
                            <UserX size={14} className="text-rose-400" />
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-rose-600">{taxaAbsenteismo}%</span>
                            <span className="text-xs font-bold text-slate-400">{globalFaltas} Ausências</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm ring-1 ring-slate-200 overflow-hidden relative group">
                    <CardContent className="p-5 relative z-10 flex flex-col">
                        <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1 flex justify-between items-center">
                            Flexibilidade (Realocados)
                            <Repeat size={14} className="text-indigo-400" />
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-indigo-600">{globalRealocacoes}</span>
                            <span className="text-xs font-bold text-slate-400">cruzamentos</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* HEATMAP / GRELHA DAS ÁREAS */}
            <div className="space-y-6">
                {visibleAreas.map(area => {
                    let areaContratados = 0;
                    let areaPresentesHoje = 0;

                    area.filteredEstacoes.forEach((est: any) => {
                        const m = getOperatorsForStation(est.id);
                        areaContratados += m.headCountBase;
                        areaPresentesHoje += m.presentCount;
                    });

                    return (
                    <div key={area.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-100 gap-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 uppercase tracking-wider">
                                <Factory size={20} className="text-slate-400" />
                                {area.nome_area}
                            </h2>
                            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-center md:text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Contratos Base</span>
                                    <span className="text-lg font-black text-slate-700">{areaContratados}</span>
                                </div>
                                <div className="h-6 w-px bg-slate-300"></div>
                                <div className="text-center md:text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Força Presente</span>
                                    <span className="text-lg font-black text-emerald-600">{areaPresentesHoje}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {area.filteredEstacoes.map((est: any) => {
                                const metrics = getOperatorsForStation(est.id);
                                
                                // Progress Bar Color Logic
                                let progressColor = "bg-emerald-500";
                                if (metrics.workingHereHoje.length === 0) progressColor = "bg-slate-200";
                                else if (metrics.presentCount < metrics.workingHereHoje.length) progressColor = "bg-amber-400";
                                if (metrics.presentCount === 0 && metrics.workingHereHoje.length > 0) progressColor = "bg-rose-500";

                                const percentage = metrics.workingHereHoje.length > 0 
                                    ? Math.round((metrics.presentCount / metrics.workingHereHoje.length) * 100)
                                    : 0;

                                return (
                                    <div 
                                        key={est.id} 
                                        onClick={() => openModal(est)}
                                        className="border border-slate-100 bg-slate-50 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-sm text-slate-700 leading-tight pr-4 group-hover:text-indigo-600 transition-colors">
                                                {est.nome_estacao}
                                            </h3>
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500" />
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                                                <span>Presença Ocupacional</span>
                                                <span className={percentage === 100 ? 'text-emerald-600' : 'text-slate-500'}>
                                                    {metrics.presentCount} / {metrics.headCountTatital}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                                                {metrics.workingHereHoje.map((_, i) => (
                                                    <div 
                                                        key={i} 
                                                        className={`h-full border-r border-white/40 flex-1 ${i < metrics.presentCount ? progressColor : 'bg-transparent'}`}
                                                    ></div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-[2px] mt-2 h-8 items-center bg-slate-100 rounded-lg p-1.5 min-h-[32px]">
                                            {metrics.workingHereHoje.length === 0 && <span className="text-[10px] text-slate-400 italic px-1">Posto Fantasma (0 Obreiros)</span>}
                                            
                                            {/* Bolinhas dos Operadores */}
                                            {metrics.baseResidentes.map(op => (
                                                <div 
                                                    key={op.id} 
                                                    title={`${op.nome_operador} (Base)`} 
                                                    className={`w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center
                                                        ${isPresent(op.tag_rfid_operador) ? 'bg-emerald-500' : 'bg-rose-400 opacity-50'}`}
                                                ></div>
                                            ))}
                                            {metrics.recebidosIn.map(op => (
                                                <div 
                                                    key={op.id} 
                                                    title={`${op.nome_operador} (Reforço/Recebido)`} 
                                                    className={`w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center
                                                        ${isPresent(op.tag_rfid_operador) ? 'bg-indigo-500' : 'bg-rose-400 opacity-50'}`}
                                                ><Zap size={8} className="text-white" /></div>
                                            ))}
                                        </div>

                                        {metrics.baseEmprestadosOut.length > 0 && (
                                            <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1 font-semibold flex items-center gap-1 border border-amber-100">
                                                <Repeat size={10} /> {metrics.baseEmprestadosOut.length} trabalhador(es) emprestados fora 
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            </div>

            {/* ZOOM MODAL - MANIFESTO DA ESTAÇÃO */}
            <Dialog open={isStationModalOpen} onOpenChange={setIsStationModalOpen}>
                <DialogContent className="sm:max-w-[600px] bg-slate-50 border-slate-200">
                    <DialogHeader className="border-b border-slate-200 pb-4 mb-4">
                        <DialogTitle className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="text-indigo-500" />
                            {selectedEstacao?.nome_estacao}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Raios-X de Alocação Diária
                        </DialogDescription>
                    </DialogHeader>

                    {selectedEstacao && (
                        <div className="space-y-6">
                            {/* Titulares Presentes/Faltosos */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">
                                    Corpo Principal (Residentes)
                                </h4>
                                {selectedEstacao.metrics.baseResidentes.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">Ninguém assinado a este posto.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {selectedEstacao.metrics.baseResidentes.map((op: any) => (
                                            <li key={op.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-slate-800">{op.nome_operador}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase">{op.funcao}</span>
                                                </div>
                                                {isPresent(op.tag_rfid_operador) ? (
                                                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold uppercase text-[10px]">Ponto Passado</Badge>
                                                ) : (
                                                    <Badge className="bg-rose-100 text-rose-800 border-rose-200 font-bold uppercase text-[10px]">Falta / Ausente</Badge>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Emprestados - Saíram daqui */}
                            {selectedEstacao.metrics.baseEmprestadosOut.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3 border-b border-amber-200 pb-1">
                                        Perdas Táticas (Trabalhadores Cedidos)
                                    </h4>
                                    <ul className="space-y-2">
                                        {selectedEstacao.metrics.baseEmprestadosOut.map((op: any) => {
                                            const destinoId = op.estacao_alocada_temporaria;
                                            const nomeDestino = estacoes.find(e => e.id === destinoId)?.nome_estacao || 'Desconhecido';
                                            return (
                                                <li key={op.id} className="flex justify-between items-center bg-amber-50 p-2 rounded-lg border border-amber-100">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-amber-900">{op.nome_operador}</span>
                                                        <span className="text-[10px] text-amber-700 font-medium">➡️ A operar em: {nomeDestino}</span>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                            {/* Recebidos - Ganho Tático */}
                            {selectedEstacao.metrics.recebidosIn.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3 border-b border-indigo-200 pb-1 flex items-center gap-2">
                                        <Zap size={14} /> Ganhos Táticos (Reforços)
                                    </h4>
                                    <ul className="space-y-2">
                                        {selectedEstacao.metrics.recebidosIn.map((op: any) => {
                                            const origemId = op.posto_base_id;
                                            const nomeOrigem = estacoes.find(e => e.id === origemId)?.nome_estacao || 'Desconhecido';
                                            return (
                                                <li key={op.id} className="flex justify-between items-center bg-indigo-50 p-2 rounded-lg border border-indigo-100 shadow-sm">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-indigo-900">{op.nome_operador}</span>
                                                        <span className="text-[10px] text-indigo-700">Origem base: {nomeOrigem}</span>
                                                    </div>
                                                    {isPresent(op.tag_rfid_operador) ? (
                                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Presente</Badge>
                                                    ) : (
                                                        <Badge className="bg-rose-100 text-rose-800 border-rose-200">Falta Reforço</Badge>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ClipboardList, Search, Calendar as CalendarIcon, Filter, ExternalLink, Download } from 'lucide-react';
import Link from 'next/link';
import { exportToExcel } from '@/utils/excelExport';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type AvaliacaoHistorica = {
    id: string;
    data_avaliacao: string;
    funcionario_id: string;
    supervisor_nome: string;
    nota_hst: number;
    nota_epi: number;
    nota_5s: number;
    nota_qualidade: number;
    nota_eficiencia: number;
    nota_objetivos: number;
    nota_atitude: number;
    operadores: {
        nome_operador: string;
        numero_operador: string;
        areas_fabrica: {
            nome_area: string;
        }
    }
}

export default function HistoricoAvaliacoesRH() {
    const supabase = createClient();
    const [registos, setRegistos] = useState<AvaliacaoHistorica[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [buscaGlobal, setBuscaGlobal] = useState("");
    const [filtroArea, setFiltroArea] = useState("TODAS");

    useEffect(() => {
        carregarHistorico();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const carregarHistorico = async () => {
        setIsLoading(true);
        // Trazemos os ultimos 1000 registos por padrão
        const { data, error } = await supabase
            .from('avaliacoes_diarias')
            .select(`
                id, data_avaliacao, supervisor_nome, funcionario_id,
                nota_hst, nota_epi, nota_5s, nota_qualidade, nota_eficiencia, nota_objetivos, nota_atitude,
                operadores (
                    nome_operador, numero_operador, areas_fabrica (nome_area)
                )
            `)
            .order('data_avaliacao', { ascending: false })
            .limit(1000);

        if (data) {
            setRegistos(data as unknown as AvaliacaoHistorica[]);
        }
        setIsLoading(false);
    };

    const areasUnicas = useMemo(() => {
        const setAreas = new Set<string>();
        registos.forEach(r => {
            const area = (r.operadores?.areas_fabrica as any)?.nome_area || 'Geral';
            setAreas.add(area);
        });
        return Array.from(setAreas).sort();
    }, [registos]);

    const registosFiltrados = useMemo(() => {
        return registos.filter(r => {
            const area = (r.operadores?.areas_fabrica as any)?.nome_area || 'Geral';
            const nomeOp = r.operadores?.nome_operador || '';

            const matchArea = filtroArea === "TODAS" || area === filtroArea;
            const matchBusca = buscaGlobal === "" ||
                nomeOp.toLowerCase().includes(buscaGlobal.toLowerCase()) ||
                r.supervisor_nome?.toLowerCase().includes(buscaGlobal.toLowerCase());

            return matchArea && matchBusca;
        });
    }, [registos, filtroArea, buscaGlobal]);

    const getScoreColor = (score: number) => {
        if (score >= 3.5) return "text-green-600 font-bold bg-green-50";
        if (score >= 2.5) return "text-yellow-600 font-bold bg-yellow-50";
        return "text-red-600 font-bold bg-red-50";
    };

    const handleExport = () => {
        if (registosFiltrados.length === 0) return;

        const dataExp = registosFiltrados.map(r => {
            const op = r.operadores;
            const area = (op?.areas_fabrica as any)?.nome_area || 'Geral';
            const med = (r.nota_hst + r.nota_epi + r.nota_5s + r.nota_qualidade + r.nota_eficiencia + r.nota_objetivos + r.nota_atitude) / 7;

            return {
                'Data Avaliação': new Date(r.data_avaliacao).toLocaleDateString('pt-PT'),
                'Colaborador': op?.nome_operador || 'Desconhecido',
                'Área Fabril': area,
                'Pilar HST': r.nota_hst.toFixed(1),
                'Pilar EPI': r.nota_epi.toFixed(1),
                'Pilar 5S': r.nota_5s.toFixed(1),
                'Pilar Qualidade': r.nota_qualidade.toFixed(1),
                'Pilar Eficiência': r.nota_eficiencia.toFixed(1),
                'Pilar Objetivos': r.nota_objetivos.toFixed(1),
                'Pilar Atitude': r.nota_atitude.toFixed(1),
                'Média Global': med.toFixed(2),
                'Avaliador / Líder': r.supervisor_nome || 'N/A'
            };
        });
        exportToExcel(dataExp, `Historico_Avaliacoes_RH_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="p-6 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between md:items-end gap-4 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
                        <ClipboardList className="text-blue-600" size={32} />
                        Arquivo de Avaliações
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Consulta Global e Auditoria (M.E.S.) de perfomance do chão de fábrica.
                    </p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                            placeholder="Buscar Colaborador..."
                            className="pl-9 bg-white"
                            value={buscaGlobal}
                            onChange={(e) => setBuscaGlobal(e.target.value)}
                        />
                    </div>
                    <Select value={filtroArea} onValueChange={setFiltroArea}>
                        <SelectTrigger className="w-[180px] bg-white">
                            <SelectValue placeholder="Filtrar Área" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TODAS">Todas as Áreas</SelectItem>
                            {areasUnicas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </header>

            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b pb-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-sm text-slate-700 uppercase tracking-widest flex items-center gap-2">
                            <Filter size={16} /> Grelha Cronológica ({registosFiltrados.length} registos)
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                                disabled={registosFiltrados.length === 0}
                                className="h-8 shadow-sm bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200 transition-colors"
                            >
                                <Download size={14} className="mr-1.5" /> Exportar Lista (XLSX)
                            </Button>
                            <Button variant="outline" size="sm" onClick={carregarHistorico} disabled={isLoading} className="h-8 shadow-sm">
                                Atualizar Dados
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-400 font-mono animate-pulse">A varrer arquivo de avaliações...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="text-sm">
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead className="w-[120px] font-semibold">Data</TableHead>
                                        <TableHead className="font-semibold">Colaborador</TableHead>
                                        <TableHead className="font-semibold">Área Fabril</TableHead>
                                        <TableHead className="text-center" title="HST">HST</TableHead>
                                        <TableHead className="text-center" title="EPI">EPI</TableHead>
                                        <TableHead className="text-center" title="Limpeza (5S)">5S</TableHead>
                                        <TableHead className="text-center" title="Qualidade">QLD</TableHead>
                                        <TableHead className="text-center" title="Eficiência">EFC</TableHead>
                                        <TableHead className="text-center" title="Objetivos">OBJ</TableHead>
                                        <TableHead className="text-center" title="Atitude">ATT</TableHead>
                                        <TableHead className="text-center font-bold text-blue-900 border-l border-slate-200">MÉDIA</TableHead>
                                        <TableHead className="text-right">Dossier</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-100">
                                    {registosFiltrados.map(reg => {
                                        const op = reg.operadores;
                                        const area = (op?.areas_fabrica as any)?.nome_area || 'Geral';

                                        const med = (reg.nota_hst + reg.nota_epi + reg.nota_5s + reg.nota_qualidade + reg.nota_eficiencia + reg.nota_objetivos + reg.nota_atitude) / 7;

                                        return (
                                            <TableRow key={reg.id} className="hover:bg-blue-50/30 transition-colors">
                                                <TableCell className="font-mono text-slate-500 text-xs">
                                                    {new Date(reg.data_avaliacao).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="font-bold text-slate-800">
                                                    {op?.nome_operador || 'Desconhecido'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-normal text-[10px] tracking-wider bg-slate-100">
                                                        {area}
                                                    </Badge>
                                                </TableCell>

                                                {/* Pilares */}
                                                <TableCell className={`text-center font-mono text-xs ${getScoreColor(reg.nota_hst)}`}>{reg.nota_hst.toFixed(1)}</TableCell>
                                                <TableCell className={`text-center font-mono text-xs ${getScoreColor(reg.nota_epi)}`}>{reg.nota_epi.toFixed(1)}</TableCell>
                                                <TableCell className={`text-center font-mono text-xs ${getScoreColor(reg.nota_5s)}`}>{reg.nota_5s.toFixed(1)}</TableCell>
                                                <TableCell className={`text-center font-mono text-xs ${getScoreColor(reg.nota_qualidade)}`}>{reg.nota_qualidade.toFixed(1)}</TableCell>
                                                <TableCell className={`text-center font-mono text-xs ${getScoreColor(reg.nota_eficiencia)}`}>{reg.nota_eficiencia.toFixed(1)}</TableCell>
                                                <TableCell className={`text-center font-mono text-xs ${getScoreColor(reg.nota_objetivos)}`}>{reg.nota_objetivos.toFixed(1)}</TableCell>
                                                <TableCell className={`text-center font-mono text-xs ${getScoreColor(reg.nota_atitude)}`}>{reg.nota_atitude.toFixed(1)}</TableCell>

                                                <TableCell className={`text-center border-l border-slate-200 text-sm ${getScoreColor(med)}`}>
                                                    {med.toFixed(1)}
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <Link href={`/admin/rh/avaliacoes/${reg.funcionario_id}`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                                            <ExternalLink size={16} />
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                    {registosFiltrados.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={12} className="text-center py-10 text-slate-400 italic">
                                                Nenhum registo de avaliação encontrado para os filtros selecionados.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Activity, TrendingUp, TrendingDown, Settings2, ClipboardCheck, Trophy, Target, AlertTriangle, Crosshair, Eye, CheckCircle2, XCircle, MinusCircle, Edit, Trash2, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getAuditoriasRecentes, getAuditoriaDetalhes, getAcoes5S, updateAcao5S, deleteAcao5S, getOperadores, getDadosDashboard5S } from './actions';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart, AreaChart, Area } from 'recharts';
import Link from 'next/link';

export default function Dashboard5SPage() {
    const [auditorias, setAuditorias] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAuditoria, setSelectedAuditoria] = useState<any>(null);
    const [auditoriaDetalhes, setAuditoriaDetalhes] = useState<any[]>([]);
    const [loadingDetalhes, setLoadingDetalhes] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [acoes, setAcoes] = useState<any[]>([]);
    const [operadores, setOperadores] = useState<any[]>([]);
    const [dadosDash, setDadosDash] = useState<any[]>([]);
    
    // Comitê State
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [selectedAcao, setSelectedAcao] = useState<any | null>(null);
    const [effort, setEffort] = useState(5);
    const [impact, setImpact] = useState(5);
    const [procedendo, setProcedendo] = useState(false);

    // Scrum Board & 8D A3 State
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [isA3Open, setIsA3Open] = useState(false);
    const [isSavingA3, setIsSavingA3] = useState(false);
    
    const [equipa, setEquipa] = useState("");
    const [indicadores, setIndicadores] = useState("");
    const [validacao, setValidacao] = useState("Pendente");
    const [whys, setWhys] = useState<string[]>(['', '', '', '', '']);
    const [tipoAnalise, setTipoAnalise] = useState<'5-Whys' | 'Ishikawa'>('5-Whys');
    const [ishikawa, setIshikawa] = useState({ man: '', machine: '', material: '', method: '', measurement: '', environment: '' });
    const [tasks5w, setTasks5w] = useState<any[]>([]);

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        setLoading(true);
        const res = await getAuditoriasRecentes();
        const resAcoes = await getAcoes5S();
        const resOp = await getOperadores();
        const resDash = await getDadosDashboard5S();
        
        if (res.success) setAuditorias(res.data || []);
        if (resAcoes.success) setAcoes(resAcoes.data || []);
        if (resOp.success) setOperadores(resOp.data || []);
        if (resDash.success) setDadosDash(resDash.data || []);
        
        setLoading(false);
    }

    // --- COMITÊ 5S HANDLERS ---
    const openEvaluationModal = (acao: any) => {
        setSelectedAcao(acao);
        setEffort(acao.esforco_estimado || 5);
        setImpact(acao.impacto_estimado || 5);
        setIsEvaluating(true);
    };

    const handleAprovarParaAcao = async () => {
        setProcedendo(true);
        await updateAcao5S(selectedAcao.id, {
            esforco_estimado: effort,
            impacto_estimado: impact,
            avaliado_por: "Comitê 5S",
            status: "Aberto" // Envia para o Scrum Board!
        });
        setIsEvaluating(false);
        carregarDados();
        setProcedendo(false);
    };

    const handleRejeitar = async () => {
        setProcedendo(true);
        await updateAcao5S(selectedAcao.id, { status: "Rejeitado", data_avaliacao: new Date().toISOString() });
        setIsEvaluating(false);
        carregarDados();
        setProcedendo(false);
    };

    const getMatrixQuadrant = (eff: number, imp: number) => {
        if (eff <= 5 && imp >= 6) return { label: "Quick Win (Fazer Já)", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
        if (eff > 5 && imp >= 6) return { label: "Projeto Importante", color: "bg-blue-100 text-blue-800 border-blue-300" };
        if (eff <= 5 && imp < 6) return { label: "Tarefa Cosmética", color: "bg-amber-100 text-amber-800 border-amber-300" };
        return { label: "Desperdício de Tempo", color: "bg-rose-100 text-rose-800 border-rose-300" };
    };

    // --- SCRUM BOARD 5S HANDLERS ---
    const moveCard = async (id: string, status: string) => {
        const originalStatus = acoes.find(a => a.id === id)?.status;
        if (originalStatus === status) return;
        setAcoes(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        await updateAcao5S(id, { status });
    };

    const openA3Modal = (action: any) => {
        setSelectedAcao(action);
        setEquipa(action.equipa_trabalho || "");
        setIndicadores(action.indicadores_sucesso || "");
        setValidacao(action.validacao_eficacia || "Pendente");

        const ishiDef = { man: '', machine: '', material: '', method: '', measurement: '', environment: '' };
        setTipoAnalise(action.tipo_analise_causa || '5-Whys');
        
        if (action.tipo_analise_causa === 'Ishikawa') {
            try {
                const parsed = typeof action.causa_raiz_5w === 'string' ? JSON.parse(action.causa_raiz_5w) : action.causa_raiz_5w;
                setIshikawa({ ...ishiDef, ...parsed });
            } catch (e) {
                setIshikawa(ishiDef);
            }
            setWhys(['', '', '', '', '']);
        } else {
            const loadedWhys = Array.isArray(action.causa_raiz_5w) && action.causa_raiz_5w.length > 0
                ? action.causa_raiz_5w
                : ['', '', '', '', ''];
            setWhys(loadedWhys);
            setIshikawa(ishiDef);
        }

        const loadedTasks = Array.isArray(action.plano_acao_5w2h) ? action.plano_acao_5w2h : [];
        setTasks5w(loadedTasks);
        setIsA3Open(true);
    };

    const handleSalvarA3 = async () => {
        if (!selectedAcao) return;
        setIsSavingA3(true);
        const payload = {
            equipa_trabalho: equipa,
            tipo_analise_causa: tipoAnalise,
            causa_raiz_5w: tipoAnalise === 'Ishikawa' ? ishikawa : whys,
            plano_acao_5w2h: tasks5w,
            indicadores_sucesso: indicadores,
            validacao_eficacia: validacao
        };
        await updateAcao5S(selectedAcao.id, payload);
        setIsA3Open(false);
        carregarDados();
        setIsSavingA3(false);
    };

    const handleAddTask5w = () => setTasks5w([...tasks5w, { o_que: '', quem: '', quando: '', status: 'Pendente' }]);
    const updateTask5w = (index: number, field: string, value: string) => {
        const nf = [...tasks5w];
        nf[index][field] = value;
        setTasks5w(nf);
    };
    const removeTask5w = (index: number) => setTasks5w(tasks5w.filter((_, i) => i !== index));
    const StatusColumns = ["Aberto", "Em Investigacao", "Validacao", "Concluido"];

    async function handleDeleteAcao(id: string) {
        if (!confirm("Tem a certeza que deseja eliminar esta ação?")) return;
        setLoading(true);
        await deleteAcao5S(id);
        await carregarDados();
    }

    async function abrirDetalhes(auditoria: any) {
        setSelectedAuditoria(auditoria);
        setIsDialogOpen(true);
        setLoadingDetalhes(true);
        const res = await getAuditoriaDetalhes(auditoria.id);
        if (res.success) {
            setAuditoriaDetalhes(res.data || []);
        }
        setLoadingDetalhes(false);
    }

    // Processamento de KPIs
    const dadosEvolucao = dadosDash.reduce((acc: any[], aud) => {
        const dia = new Date(aud.data_auditoria).toLocaleDateString([], { month: 'short', day: 'numeric' });
        const existente = acc.find(a => a.dia === dia);
        if (existente) {
            existente.soma += Number(aud.percentagem);
            existente.qtd += 1;
            existente.score = Math.round(existente.soma / existente.qtd);
        } else {
            acc.push({ dia, soma: Number(aud.percentagem), qtd: 1, score: Number(aud.percentagem) });
        }
        return acc;
    }, []).reverse();

    const estacoesPareto = dadosDash.reduce((acc: any[], aud) => {
        if (!aud.estacoes?.nome_estacao) return acc;
        const existente = acc.find(a => a.nome === aud.estacoes.nome_estacao);
        if (existente) {
            existente.soma += Number(aud.percentagem);
            existente.qtd += 1;
            existente.score = Math.round(existente.soma / existente.qtd);
        } else {
            acc.push({ nome: aud.estacoes.nome_estacao, soma: Number(aud.percentagem), qtd: 1, score: Number(aud.percentagem) });
        }
        return acc;
    }, []).sort((a: any, b: any) => b.score - a.score).slice(0, 10);

    const dadosCategorias = dadosDash.reduce((acc: any[], aud) => {
        const area = aud.areas_fabrica?.nome_area || 'Geral';
        const existente = acc.find(a => a.area === area);
        
        let localObj = existente;
        if (!localObj) {
            localObj = { area, '1S': {p:0, f:0}, '2S': {p:0, f:0}, '3S': {p:0, f:0}, '4S': {p:0, f:0}, '5S': {p:0, f:0} };
            acc.push(localObj);
        }

        aud.lean_5s_respostas?.forEach((resp: any) => {
            const cat = resp.lean_5s_perguntas?.categoria?.substring(0, 2);
            if (cat && localObj[cat]) {
                if (resp.resultado === 'Pass') localObj[cat].p += 1;
                else if (resp.resultado === 'Fail') localObj[cat].f += 1;
            }
        });
        return acc;
    }, []).map((a: any) => {
        return {
            area: a.area,
            '1S - Utilização': a['1S'].p + a['1S'].f > 0 ? Math.round((a['1S'].p / (a['1S'].p + a['1S'].f)) * 100) : 0,
            '2S - Arrumação': a['2S'].p + a['2S'].f > 0 ? Math.round((a['2S'].p / (a['2S'].p + a['2S'].f)) * 100) : 0,
            '3S - Limpeza': a['3S'].p + a['3S'].f > 0 ? Math.round((a['3S'].p / (a['3S'].p + a['3S'].f)) * 100) : 0,
            '4S - Normalização': a['4S'].p + a['4S'].f > 0 ? Math.round((a['4S'].p / (a['4S'].p + a['4S'].f)) * 100) : 0,
            '5S - Disciplina': a['5S'].p + a['5S'].f > 0 ? Math.round((a['5S'].p / (a['5S'].p + a['5S'].f)) * 100) : 0,
        };
    });

    return (
        <div className="p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500 pb-32">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-6 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <Activity className="text-blue-600" size={36} /> Comando Central 5S
                    </h1>
                    <p className="text-lg text-slate-500 mt-1">Monitorização de Cultura Fabril, Disciplina e Limpeza.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/lean/5s/setup">
                        <Button variant="outline" className="font-bold border-blue-200 text-blue-700 hover:bg-blue-50">
                            <Settings2 className="w-5 h-5 mr-2" /> Motor de Checklists
                        </Button>
                    </Link>
                    <Link href="/operador/5s" target="_blank">
                        <Button className="bg-teal-600 hover:bg-teal-700 font-bold shadow-lg shadow-teal-200">
                            <Crosshair className="w-5 h-5 mr-2" /> Abrir Quiosque 5S
                        </Button>
                    </Link>
                </div>
            </header>

            <Tabs defaultValue="historico" className="w-full">
                <TabsList className="mb-6 grid w-full max-w-4xl grid-cols-4">
                    <TabsTrigger value="historico" className="font-bold">Histórico de Rondas</TabsTrigger>
                    <TabsTrigger value="comite" className="font-bold text-indigo-600 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Comitê 5S (Triagem)</TabsTrigger>
                    <TabsTrigger value="kanban" className="font-bold text-emerald-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Scrum Board (8D)</TabsTrigger>
                    <TabsTrigger value="kpis" className="font-bold text-amber-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white">KPIs & Gincana</TabsTrigger>
                </TabsList>

                <TabsContent value="historico">

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : auditorias.length === 0 ? (
                <div className="p-16 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center">
                    <ClipboardCheck className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Fábrica Sem Avaliações</h3>
                    <p>Inicie a primeira ronda na fábrica para mapear a situação de referência (Baserate).</p>
                    <Link href="/operador/5s" target="_blank" className="mt-6">
                        <Button className="bg-teal-600 hover:bg-teal-700">Abrir Quiosque 5S</Button>
                    </Link>
                </div>
            ) : (
                <Card className="border-0 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b">
                            <TableRow>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs h-12">Auditor</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs">Área</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs">Estação</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs">Data</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs text-center">Score / Média</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {auditorias.map(aud => {
                                const score = Number(aud.percentagem);
                                let colorClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
                                if (score < 80 && score >= 60) colorClass = "bg-amber-100 text-amber-800 border-amber-200";
                                else if (score < 60) colorClass = "bg-rose-100 text-rose-800 border-rose-200";

                                return (
                                    <TableRow key={aud.id} className="hover:bg-slate-50/80 cursor-pointer transition-colors border-b" onClick={() => abrirDetalhes(aud)}>
                                        <TableCell className="font-medium text-slate-700 py-4">{aud.operadores?.nome_operador || 'Sistema'}</TableCell>
                                        <TableCell className="font-bold text-slate-800">{aud.areas_fabrica?.nome_area}</TableCell>
                                        <TableCell className="text-slate-500 uppercase text-xs tracking-widest font-bold">{aud.estacoes?.nome_estacao || 'Geral'}</TableCell>
                                        <TableCell className="text-slate-500 text-sm">{new Date(aud.data_auditoria).toLocaleDateString()} {new Date(aud.data_auditoria).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</TableCell>
                                        <TableCell className="text-center">
                                            <span className={`px-4 py-1.5 rounded-full font-black text-xs border ${colorClass}`}>
                                                {score.toFixed(0)}%
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                                <Eye size={18} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </Card>
            )}
            </TabsContent>

            <TabsContent value="comite" className="space-y-6">
                <Card className="border-0 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b pb-4">
                        <CardTitle className="flex justify-between items-center text-lg">
                            <span className="flex items-center gap-2"><Target className="text-indigo-500"/> Comitê 5S (Avaliação de Apontamentos)</span>
                        </CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader className="bg-slate-50 border-b">
                            <TableRow>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs h-12">Falha / Apontamento</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs">Local</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs">Auditor</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs">Status</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {acoes.filter(a => a.status === 'Em Analise').length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-500 font-medium tracking-wide">Nenhum apontamento a aguardar análise do Comitê.</TableCell>
                                </TableRow>
                            ) : acoes.filter(a => a.status === 'Em Analise').map(acao => (
                                <TableRow key={acao.id} className="hover:bg-slate-50 transition-colors border-b">
                                    <TableCell className="font-bold text-slate-800 py-4 max-w-sm" title={acao.descricao_acao}>{acao.descricao_acao}</TableCell>
                                    <TableCell className="text-slate-600">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-xs uppercase">{acao.areas_fabrica?.nome_area || 'Universal'}</span>
                                            {acao.linhas_producao && <span className="text-xs text-slate-400">Linha {acao.linhas_producao.letra_linha}</span>}
                                            {acao.estacoes && <span className="text-xs text-slate-400">{acao.estacoes.nome_estacao}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium text-slate-700">{acao.operadores?.nome_operador || 'Sistema'}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest bg-indigo-100 text-indigo-700">
                                            {acao.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button onClick={() => openEvaluationModal(acao)} className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold h-8 shadow">
                                            Avaliar Impacto
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </TabsContent>

            <TabsContent value="kanban">
                <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
                    {StatusColumns.map(columnId => {
                        const colItems = acoes.filter(a => a.status === columnId);
                        
                        let headerTheme = "bg-rose-50 text-rose-800 border-rose-200";
                        if (columnId === 'Em Investigacao') headerTheme = "bg-indigo-100 text-indigo-800 border-indigo-200";
                        if (columnId === 'Validacao') headerTheme = "bg-amber-100 text-amber-800 border-amber-200";
                        if (columnId === 'Concluido') headerTheme = "bg-emerald-100 text-emerald-800 border-emerald-200";

                        return (
                            <div 
                                key={columnId} 
                                className="flex-1 w-full flex flex-col gap-4 rounded-2xl transition-all"
                                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-rose-400', 'ring-offset-4'); }}
                                onDragLeave={e => e.currentTarget.classList.remove('ring-2', 'ring-rose-400', 'ring-offset-4')}
                                onDrop={e => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('ring-2', 'ring-rose-400', 'ring-offset-4');
                                    if (draggedItem) moveCard(draggedItem, columnId);
                                }}
                            >
                                <div className={`px-4 py-3 rounded-xl border flex justify-between items-center font-black uppercase tracking-widest ${headerTheme}`}>
                                    <div className="flex items-center gap-2">{columnId}</div>
                                    <span className="bg-white/50 text-black/60 px-2 py-0.5 rounded text-xs leading-none">{colItems.length}</span>
                                </div>

                                <div className="flex flex-col gap-3 min-h-[500px] border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-100/30">
                                    {colItems.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold uppercase tracking-widest p-8 text-center italic">Vazio</div>
                                    ) : (
                                        colItems.map(task => (
                                            <Card
                                                key={task.id}
                                                draggable
                                                onDragStart={() => setDraggedItem(task.id)}
                                                onDragEnd={() => setDraggedItem(null)}
                                                onClick={() => openA3Modal(task)}
                                                className="cursor-grab active:cursor-grabbing border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group relative bg-white overflow-hidden"
                                            >
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                                                <CardContent className="p-4 pl-5">
                                                    <div className="text-[10px] font-mono text-slate-400 mb-2">
                                                        {new Date(task.created_at).toLocaleDateString()}
                                                    </div>
                                                    <h3 className="font-bold text-slate-800 leading-tight mb-2 text-sm">{task.descricao_acao}</h3>
                                                    <div className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">
                                                        {task.areas_fabrica?.nome_area || 'Global'}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </TabsContent>

            <TabsContent value="kpis" className="space-y-6">
                {auditorias.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-blue-100 font-medium uppercase tracking-widest text-xs mb-1">Média Global 5S</p>
                                            <h3 className="text-5xl font-black">{(auditorias.reduce((a, b) => a + Number(b.percentagem), 0) / auditorias.length).toFixed(0)}%</h3>
                                        </div>
                                        <Activity size={32} className="text-blue-300 opacity-50" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-amber-400 to-amber-600 text-white border-0 shadow-lg relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 opacity-20"><Trophy size={100} /></div>
                                <CardContent className="p-6 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-amber-100 font-medium uppercase tracking-widest text-xs mb-1">Campeão da Gincana</p>
                                            <h3 className="text-2xl font-black leading-tight">
                                                {auditorias.reduce((max, obj) => Number(obj.percentagem) > Number(max.percentagem) ? obj : max, auditorias[0])?.areas_fabrica?.nome_area}
                                            </h3>
                                            <p className="text-amber-100 font-bold mt-2 text-lg">{Math.max(...auditorias.map(a => Number(a.percentagem))).toFixed(0)}% Score</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-rose-500 to-rose-700 text-white border-0 shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-rose-100 font-medium uppercase tracking-widest text-xs mb-1">Maior Foco de Atenção</p>
                                            <h3 className="text-2xl font-black leading-tight">
                                                {auditorias.reduce((min, obj) => Number(obj.percentagem) < Number(min.percentagem) ? obj : min, auditorias[0])?.areas_fabrica?.nome_area}
                                            </h3>
                                            <p className="text-rose-100 font-bold mt-2 text-lg flex items-center gap-2">
                                                <AlertTriangle size={16}/>
                                                {Math.min(...auditorias.map(a => Number(a.percentagem))).toFixed(0)}% Score
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="bg-slate-50 border-b pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="text-blue-500"/> Evolução do Score 5S Diário</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dadosEvolucao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" name="Score Médio (%)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm">
                                <CardHeader className="bg-slate-50 border-b pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2"><Target className="text-emerald-500"/> Pareto: Top 10 Estações (Score)</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={estacoesPareto} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} interval={0} angle={-15} textAnchor="end" />
                                            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} name="Score 5S (%)" />
                                            <Line type="monotone" dataKey="score" stroke="#047857" strokeWidth={2} dot={{ r: 4 }} name="Tendência" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="mt-6 border-0 shadow-sm">
                            <CardHeader className="bg-slate-50 border-b pb-4">
                                <CardTitle className="text-lg flex items-center gap-2"><Crosshair className="text-rose-500"/> Heatmap da Fábrica (Score por Categoria S)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead className="font-black text-slate-700">Área Fabril</TableHead>
                                            <TableHead className="font-bold text-center">1S - Utilização</TableHead>
                                            <TableHead className="font-bold text-center">2S - Arrumação</TableHead>
                                            <TableHead className="font-bold text-center">3S - Limpeza</TableHead>
                                            <TableHead className="font-bold text-center">4S - Normalização</TableHead>
                                            <TableHead className="font-bold text-center">5S - Disciplina</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dadosCategorias.map((d: any, i: number) => (
                                            <TableRow key={i} className="border-b">
                                                <TableCell className="font-bold text-slate-800">{d.area}</TableCell>
                                                {['1S - Utilização', '2S - Arrumação', '3S - Limpeza', '4S - Normalização', '5S - Disciplina'].map((k) => {
                                                    const val = d[k];
                                                    let bg = "bg-emerald-100 text-emerald-800 border-emerald-200";
                                                    if (val < 80 && val >= 60) bg = "bg-amber-100 text-amber-800 border-amber-200";
                                                    else if (val < 60) bg = "bg-rose-100 text-rose-800 border-rose-200";
                                                    return (
                                                        <TableCell key={k} className="text-center p-2">
                                                            <div className={`w-full h-12 flex items-center justify-center font-black rounded-md border \${bg}`}>
                                                                {val}%
                                                            </div>
                                                        </TableCell>
                                                    )
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <div className="p-12 text-center text-slate-500">Sem dados suficientes para calcular KPIs.</div>
                )}
            </TabsContent>
            </Tabs>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0 border-0 shadow-2xl rounded-2xl">
                    <DialogHeader className="p-6 md:p-8 border-b bg-white sticky top-0 z-10">
                        <DialogTitle className="text-2xl font-black flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <span className="text-slate-800 tracking-tight">Relatório de Auditoria 5S</span>
                            <span className={`text-lg px-5 py-1.5 rounded-full border \${
                                selectedAuditoria && Number(selectedAuditoria.percentagem) >= 80 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                selectedAuditoria && Number(selectedAuditoria.percentagem) >= 60 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                'bg-rose-100 text-rose-800 border-rose-200'
                            }`}>
                                Score Global: {selectedAuditoria ? Number(selectedAuditoria.percentagem).toFixed(0) : 0}%
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="p-6 md:p-8 bg-slate-50/50">
                        <div className="bg-white p-6 rounded-2xl border shadow-sm mb-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Auditor</p>
                                <p className="font-bold text-slate-800 text-lg">{selectedAuditoria?.operadores?.nome_operador || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Área Fabril</p>
                                <p className="font-bold text-slate-800 text-lg">{selectedAuditoria?.areas_fabrica?.nome_area || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estação</p>
                                <p className="font-bold text-slate-800 text-lg">{selectedAuditoria?.estacoes?.nome_estacao || 'Geral'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Data / Hora</p>
                                <p className="font-bold text-slate-800 text-lg">{selectedAuditoria ? new Date(selectedAuditoria.data_auditoria).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'}) : ''}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="font-black text-xl text-slate-800 mb-4">Detalhamento por 5S</h3>
                            {loadingDetalhes ? (
                                <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>
                            ) : (
                                ['1S - Utilização', '2S - Arrumação', '3S - Limpeza', '4S - Normalização', '5S - Disciplina'].map((cat) => {
                                    const itensCat = auditoriaDetalhes.filter(d => d.lean_5s_perguntas?.categoria === cat);
                                    if (itensCat.length === 0) return null;
                                    
                                    return (
                                        <div key={cat} className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                                            <div className="bg-slate-100 px-6 py-3 font-black text-slate-800 tracking-tight border-b">{cat}</div>
                                            <div className="divide-y">
                                                {itensCat.map((item, idx) => (
                                                    <div key={item.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center">
                                                        <div className="flex-1">
                                                            <p className="font-bold text-slate-700 text-base leading-snug">{idx + 1}. {item.lean_5s_perguntas?.pergunta}</p>
                                                            {item.observacoes && (
                                                                <div className="mt-3 p-4 bg-rose-50/50 text-rose-800 text-sm rounded-xl border border-rose-100 italic">
                                                                    <span className="font-black uppercase tracking-widest not-italic text-xs mr-2">Obrigatório / Ação:</span> {item.observacoes}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="shrink-0 w-32 flex md:justify-end">
                                                            {item.resultado === 'Pass' && <span className="flex items-center text-emerald-700 font-bold bg-emerald-100 px-4 py-1.5 rounded-full text-sm border border-emerald-200"><CheckCircle2 className="w-4 h-4 mr-2"/> OK</span>}
                                                            {item.resultado === 'Fail' && <span className="flex items-center text-rose-700 font-bold bg-rose-100 px-4 py-1.5 rounded-full text-sm border border-rose-200"><XCircle className="w-4 h-4 mr-2"/> FALHA</span>}
                                                            {item.resultado === 'N/A' && <span className="flex items-center text-slate-600 font-bold bg-slate-100 px-4 py-1.5 rounded-full text-sm border border-slate-200"><MinusCircle className="w-4 h-4 mr-2"/> N/A</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isEvaluating} onOpenChange={setIsEvaluating}>
                <DialogContent className="sm:max-w-[600px] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="bg-slate-50 border-b px-6 py-4">
                        <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-800">
                            <Target className="text-indigo-600" /> Avaliação do Comitê 5S
                        </DialogTitle>
                    </DialogHeader>
                    {selectedAcao && (
                        <div className="p-6 space-y-8 bg-white">
                            <div className="p-4 bg-slate-50 border rounded-xl border-slate-200">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Apontamento Registado</p>
                                <p className="font-bold text-slate-700">{selectedAcao.descricao_acao}</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-bold text-slate-700">Esforço de Implementação</label>
                                        <span className="font-black text-indigo-600">{effort}/10</span>
                                    </div>
                                    <input type="range" min="1" max="10" value={effort} onChange={(e) => setEffort(Number(e.target.value))} className="w-full accent-indigo-600" />
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mt-1">
                                        <span>Fácil/Rápido</span><span>Muito Difícil/Longo</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-bold text-slate-700">Impacto na Cultura/Limpeza</label>
                                        <span className="font-black text-emerald-600">{impact}/10</span>
                                    </div>
                                    <input type="range" min="1" max="10" value={impact} onChange={(e) => setImpact(Number(e.target.value))} className="w-full accent-emerald-600" />
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mt-1">
                                        <span>Insignificante</span><span>Transformador</span>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-4 rounded-xl border-2 \${getMatrixQuadrant(effort, impact).color} flex items-center justify-between`}>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Decisão Sugerida (Matriz)</p>
                                    <p className="font-black text-lg">{getMatrixQuadrant(effort, impact).label}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="bg-slate-50 px-6 py-4 border-t gap-2 flex-col sm:flex-row">
                        <Button variant="ghost" className="text-slate-500 font-bold" onClick={() => setIsEvaluating(false)}>Cancelar</Button>
                        <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" disabled={procedendo} onClick={handleRejeitar}>
                            <Trash2 size={16} className="mr-2" /> Rejeitar/Descartar
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200" disabled={procedendo} onClick={handleAprovarParaAcao}>
                            {procedendo ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                            Aprovar para Scrum Board
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isA3Open} onOpenChange={setIsA3Open}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl rounded-2xl">
                    <DialogHeader className="bg-emerald-600 text-white border-b-0 px-8 py-6 sticky top-0 z-10 flex flex-row justify-between items-center">
                        <div>
                            <p className="text-emerald-200 font-bold text-xs uppercase tracking-widest mb-1">Relatório 8D / A3 de Problema 5S</p>
                            <DialogTitle className="text-2xl font-black text-white">{selectedAcao?.descricao_acao}</DialogTitle>
                        </div>
                    </DialogHeader>

                    {selectedAcao && (
                        <div className="p-8 bg-slate-50 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="border-0 shadow-sm">
                                    <CardHeader className="bg-white border-b pb-4"><CardTitle className="text-base text-slate-700 flex items-center gap-2"><Target className="text-blue-500"/> Contexto do Problema</CardTitle></CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-3 rounded-lg border">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Local</p>
                                                <p className="font-bold text-slate-700">{selectedAcao.areas_fabrica?.nome_area} {selectedAcao.estacoes ? \`(\${selectedAcao.estacoes.nome_estacao})\` : ''}</p>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-lg border">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Origem</p>
                                                <p className="font-bold text-slate-700">Auditoria 5S</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Equipa de Trabalho (D1)</label>
                                            <input type="text" value={equipa} onChange={e => setEquipa(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="Ex: João, Maria, Manutenção..." />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-sm">
                                    <CardHeader className="bg-white border-b pb-4">
                                        <CardTitle className="text-base text-slate-700 flex items-center justify-between">
                                            <span className="flex items-center gap-2"><Settings2 className="text-amber-500"/> Análise de Causa Raiz (D4)</span>
                                            <select className="text-sm border rounded px-2 py-1 font-normal bg-slate-50" value={tipoAnalise} onChange={(e) => setTipoAnalise(e.target.value as any)}>
                                                <option value="5-Whys">5 Porquês</option>
                                                <option value="Ishikawa">Ishikawa (6M)</option>
                                            </select>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        {tipoAnalise === '5-Whys' ? (
                                            <div className="space-y-3">
                                                {whys.map((why, index) => (
                                                    <div key={index} className="flex gap-3 items-start">
                                                        <span className="bg-amber-100 text-amber-800 font-black rounded w-8 h-8 flex items-center justify-center shrink-0">W{index+1}</span>
                                                        <input type="text" value={why} onChange={(e) => { const nw = [...whys]; nw[index] = e.target.value; setWhys(nw); }} className="flex-1 px-3 py-1.5 border rounded-md text-sm" placeholder={`Porquê \${index+1}?`} />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                                {Object.entries({ man: "Mão de Obra", machine: "Máquina", material: "Material", method: "Método", measurement: "Medição", environment: "Meio Ambiente" }).map(([key, label]) => (
                                                    <div key={key}>
                                                        <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
                                                        <input type="text" value={(ishikawa as any)[key]} onChange={(e) => setIshikawa({...ishikawa, [key]: e.target.value})} className="w-full mt-1 px-3 py-1.5 border rounded-md text-sm" placeholder="..." />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="border-0 shadow-sm border-t-4 border-t-emerald-500">
                                <CardHeader className="bg-white border-b pb-4 flex flex-row justify-between items-center">
                                    <CardTitle className="text-base text-slate-700 flex items-center gap-2"><CheckCircle2 className="text-emerald-500"/> Plano de Ação (5W2H) - D5/D6</CardTitle>
                                    <Button size="sm" onClick={handleAddTask5w} className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold"><Activity size={14} className="mr-2"/> Adicionar Tarefa</Button>
                                </CardHeader>
                                <CardContent className="pt-0 p-0">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="font-bold text-xs uppercase text-slate-500">O Quê (What)</TableHead>
                                                <TableHead className="font-bold text-xs uppercase text-slate-500">Quem (Who)</TableHead>
                                                <TableHead className="font-bold text-xs uppercase text-slate-500">Quando (When)</TableHead>
                                                <TableHead className="font-bold text-xs uppercase text-slate-500">Status</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tasks5w.map((task, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><input type="text" value={task.o_que} onChange={e => updateTask5w(i, 'o_que', e.target.value)} className="w-full px-2 py-1 text-sm border rounded" placeholder="Ação..."/></TableCell>
                                                    <TableCell><input type="text" value={task.quem} onChange={e => updateTask5w(i, 'quem', e.target.value)} className="w-full px-2 py-1 text-sm border rounded" placeholder="Responsável"/></TableCell>
                                                    <TableCell><input type="date" value={task.quando} onChange={e => updateTask5w(i, 'quando', e.target.value)} className="w-full px-2 py-1 text-sm border rounded"/></TableCell>
                                                    <TableCell>
                                                        <select value={task.status} onChange={e => updateTask5w(i, 'status', e.target.value)} className="w-full px-2 py-1 text-sm border rounded bg-white">
                                                            <option value="Pendente">Pendente</option>
                                                            <option value="Em Andamento">Em Andamento</option>
                                                            <option value="Concluido">Concluído</option>
                                                        </select>
                                                    </TableCell>
                                                    <TableCell><Button variant="ghost" size="icon" onClick={() => removeTask5w(i)} className="text-rose-500"><Trash2 size={14}/></Button></TableCell>
                                                </TableRow>
                                            ))}
                                            {tasks5w.length === 0 && (
                                                <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-8 text-sm italic">Nenhuma ação definida no plano 5W2H.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Métrica / Indicador de Sucesso</label>
                                    <textarea value={indicadores} onChange={e => setIndicadores(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md text-sm h-24" placeholder="Como vamos medir se o problema foi resolvido?" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Validação de Eficácia (D8)</label>
                                    <select value={validacao} onChange={e => setValidacao(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md text-sm h-10 font-bold bg-white">
                                        <option value="Pendente">Aguardando Implementação</option>
                                        <option value="Em Observação">Ação Implementada - Em Observação</option>
                                        <option value="Eficaz">Problema Resolvido (Eficaz)</option>
                                        <option value="Ineficaz">Ação Ineficaz - Reabrir</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="bg-slate-100 px-8 py-4 border-t border-slate-200 gap-2 flex flex-col sm:flex-row">
                        <Button variant="outline" onClick={() => setIsA3Open(false)} className="font-bold border-slate-300">Fechar sem Salvar</Button>
                        <Button onClick={handleSalvarA3} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg" disabled={isSavingA3}>
                            {isSavingA3 ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings2 className="w-4 h-4 mr-2" />}
                            Salvar Relatório 8D / A3
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

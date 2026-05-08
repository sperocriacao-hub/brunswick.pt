"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Activity, TrendingUp, TrendingDown, Settings2, ClipboardCheck, Trophy, Target, AlertTriangle, Crosshair, Eye, CheckCircle2, XCircle, MinusCircle, Edit, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getAuditoriasRecentes, getAuditoriaDetalhes, getAcoes5S, updateAcao5S, deleteAcao5S, getOperadores } from './actions';
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
    
    const [isEditAcaoOpen, setIsEditAcaoOpen] = useState(false);
    const [selectedAcao, setSelectedAcao] = useState<any>(null);
    const [editStatus, setEditStatus] = useState("");
    const [editResponsavel, setEditResponsavel] = useState("");
    const [editDataLimite, setEditDataLimite] = useState("");

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        setLoading(true);
        const res = await getAuditoriasRecentes();
        const resAcoes = await getAcoes5S();
        const resOp = await getOperadores();
        
        if (res.success) setAuditorias(res.data || []);
        if (resAcoes.success) setAcoes(resAcoes.data || []);
        if (resOp.success) setOperadores(resOp.data || []);
        
        setLoading(false);
    }

    function openEditAcao(acao: any) {
        setSelectedAcao(acao);
        setEditStatus(acao.status || 'Aberto');
        setEditResponsavel(acao.responsavel_id || "");
        setEditDataLimite(acao.data_limite ? new Date(acao.data_limite).toISOString().split('T')[0] : "");
        setIsEditAcaoOpen(true);
    }
    
    async function saveAcao() {
        if (!selectedAcao) return;
        setLoading(true);
        const updates = {
            status: editStatus,
            responsavel_id: editResponsavel || null,
            data_limite: editDataLimite ? new Date(editDataLimite).toISOString() : null
        };
        await updateAcao5S(selectedAcao.id, updates);
        await carregarDados();
        setIsEditAcaoOpen(false);
    }

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
                <TabsList className="mb-6 grid w-full max-w-2xl grid-cols-3">
                    <TabsTrigger value="historico" className="font-bold">Histórico de Rondas</TabsTrigger>
                    <TabsTrigger value="acoes" className="font-bold text-rose-600 data-[state=active]:bg-rose-600 data-[state=active]:text-white">Planos de Ação (A3)</TabsTrigger>
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

            <TabsContent value="acoes">
                <Card className="border-0 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b pb-4">
                        <CardTitle className="flex justify-between items-center text-lg">
                            <span className="flex items-center gap-2"><AlertTriangle className="text-rose-500"/> Ações de Melhoria Exigidas (Smart Action Hub)</span>
                        </CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader className="bg-slate-50 border-b">
                            <TableRow>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs h-12">Descrição da Ação</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs">Local</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs">Responsável</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs">Prazo</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs">Status</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {acoes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">Nenhuma ação de melhoria aberta pelas Rondas 5S.</TableCell>
                                </TableRow>
                            ) : acoes.map(acao => (
                                <TableRow key={acao.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="font-bold text-slate-800 py-4 max-w-sm" title={acao.descricao_acao}>{acao.descricao_acao}</TableCell>
                                    <TableCell className="text-slate-600">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-xs uppercase">{acao.areas_fabrica?.nome_area || 'Universal'}</span>
                                            {acao.linhas_producao && <span className="text-xs text-slate-400">Linha {acao.linhas_producao.letra_linha}</span>}
                                            {acao.estacoes && <span className="text-xs text-slate-400">{acao.estacoes.nome_estacao}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {acao.operadores ? (
                                            <span className="text-sm font-medium text-slate-700">{acao.operadores.nome_operador}</span>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Não atribuído</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {acao.data_limite ? (
                                            <span className="text-sm text-slate-600">{new Date(acao.data_limite).toLocaleDateString()}</span>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Sem prazo</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold \${
                                            acao.status === 'Aberto' ? 'bg-rose-100 text-rose-700' : 
                                            acao.status === 'Em Andamento' ? 'bg-amber-100 text-amber-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {acao.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEditAcao(acao)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                                <Edit size={18} />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAcao(acao.id)} className="text-rose-600 hover:text-rose-800 hover:bg-rose-50">
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
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
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                    <Target className="text-blue-500" size={20} /> Roadmap & Metas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-800">Meta Fabril: 85%</h4>
                                            <p className="text-sm text-slate-500">Objetivo de conformidade global 5S até ao fim do trimestre.</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-blue-600">
                                                {((auditorias.reduce((a, b) => a + Number(b.percentagem), 0) / auditorias.length) >= 85) ? 'Atingido!' : 'Em Curso'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
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

            <Dialog open={isEditAcaoOpen} onOpenChange={setIsEditAcaoOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Ação de Melhoria (5S)</DialogTitle>
                    </DialogHeader>
                    {selectedAcao && (
                        <div className="space-y-4 py-4">
                            <div>
                                <p className="text-xs font-bold text-slate-500 mb-1">Ação</p>
                                <p className="text-sm font-medium p-3 bg-slate-50 rounded-md border">{selectedAcao.descricao_acao}</p>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Responsável</label>
                                <select 
                                    value={editResponsavel} 
                                    onChange={e => setEditResponsavel(e.target.value)}
                                    className="w-full h-10 border border-slate-200 rounded-md px-3 text-sm font-medium bg-white"
                                >
                                    <option value="">-- Não Atribuído --</option>
                                    {operadores.map(op => (
                                        <option key={op.id} value={op.id}>{op.nome_operador}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Data Limite</label>
                                <input 
                                    type="date" 
                                    value={editDataLimite} 
                                    onChange={e => setEditDataLimite(e.target.value)}
                                    className="w-full h-10 border border-slate-200 rounded-md px-3 text-sm font-medium bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Status</label>
                                <select 
                                    value={editStatus} 
                                    onChange={e => setEditStatus(e.target.value)}
                                    className="w-full h-10 border border-slate-200 rounded-md px-3 text-sm font-medium bg-white"
                                >
                                    <option value="Aberto">Aberto</option>
                                    <option value="Em Andamento">Em Andamento</option>
                                    <option value="Concluido">Concluído</option>
                                </select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditAcaoOpen(false)}>Cancelar</Button>
                        <Button onClick={saveAcao} className="bg-blue-600 hover:bg-blue-700">Guardar Alterações</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

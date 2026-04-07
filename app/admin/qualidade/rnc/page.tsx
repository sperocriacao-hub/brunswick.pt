"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, FileWarning, History, FileText, LayoutTemplate, CopyPlus, Printer, Loader2, Edit, Save, Send, Ban, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getRncs, getQualityActions, updateRnc, updateRncStatus } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"; 
import { Label } from "@/components/ui/label";

export default function GestaoRncPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'ativos' | 'historico'>('ativos');

    const [rncs, setRncs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // History Data
    const [history8d, setHistory8d] = useState<any[]>([]);
    const [historyA3, setHistoryA3] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historySearchTerm, setHistorySearchTerm] = useState('');

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editRncId, setEditRncId] = useState<string | null>(null);
    const [editPayload, setEditPayload] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    // Fotos Modal State
    const [isFotosOpen, setIsFotosOpen] = useState(false);
    const [fotosAtuais, setFotosAtuais] = useState<string[]>([]);

    // Triage Encerrar State
    const [isEncerrarModalOpen, setIsEncerrarModalOpen] = useState(false);
    const [encerrarRncId, setEncerrarRncId] = useState<string | null>(null);
    const [justificativaFecho, setJustificativaFecho] = useState('');

    const openEditModal = (rnc: any) => {
        setEditRncId(rnc.id);
        
        let fotos: string[] = [];
        try {
            if (rnc.anexos_url) {
                const parsed = JSON.parse(rnc.anexos_url);
                if (Array.isArray(parsed)) {
                    fotos = parsed.filter(u => u && u.trim() !== '');
                }
            }
        } catch(e) {}

        setEditPayload({
            descricao_problema: rnc.descricao_problema || '',
            contexto_producao: rnc.contexto_producao || '',
            fotos: fotos
        });
        setIsEditModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + (editPayload.fotos?.length || 0) > 2) {
            alert("Apenas pode anexar no máximo 2 fotos no total.");
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max_size = 1000;

                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/webp', 0.7);
                    
                    setEditPayload((prev: any) => ({
                        ...prev,
                        fotos: [...(prev.fotos || []), dataUrl]
                    }));
                };
                img.src = ev.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
        e.target.value = ''; // Reset
    };

    const removeFoto = (index: number) => {
        setEditPayload((prev: any) => ({
            ...prev,
            fotos: prev.fotos.filter((_: any, i: number) => i !== index)
        }));
    };

    const handleSaveRnc = async () => {
        if (!editRncId) return;
        setIsSaving(true);

        const arrURLs = editPayload.fotos || [];

        const res = await updateRnc(editRncId, {
            descricao_problema: editPayload.descricao_problema,
            contexto_producao: editPayload.contexto_producao,
            anexos_url: arrURLs.length > 0 ? JSON.stringify(arrURLs) : null
        });
        if (res.success) {
            setIsEditModalOpen(false);
            carregarRncs();
        } else {
            alert("Erro ao atualizar: " + res.error);
        }
        setIsSaving(false);
    };

    const handleEncerrar = async () => {
        if (!encerrarRncId || justificativaFecho.trim().length < 5) {
            alert("Por favor escreva uma Justificativa Técnica com pelo menos 5 caracteres.");
            return;
        }
        setIsSaving(true);
        const res = await updateRnc(encerrarRncId, { status: 'Encerrado', justificativa_fecho: justificativaFecho });
        if (res.success) {
            setIsEncerrarModalOpen(false);
            carregarRncs();
        } else {
            alert("Erro ao encerrar: " + res.error);
        }
        setIsSaving(false);
    };

    const handleEnviarAnalise = async (id: string) => {
        if (confirm("Isto vai enviar definitivamente a ocorrência para a War Room do Kanban para avaliação A3/8D. Deseja prosseguir?")) {
            setLoading(true);
            await updateRncStatus(id, 'Aberto');
            carregarRncs();
        }
    };


    useEffect(() => {
        carregarRncs();
    }, []);

    useEffect(() => {
        if (activeTab === 'historico') {
            carregarHistorico();
        }
    }, [activeTab]);

    async function carregarRncs() {
        setLoading(true);
        const res = await getRncs();
        if (res.success) {
            setRncs(res.data || []);
        } else {
            console.error("Falha a carregar RNCs:", res.error);
        }
        setLoading(false);
    }

    async function carregarHistorico() {
        setLoadingHistory(true);
        const res = await getQualityActions();
        if (res.success) {
            setHistory8d(res.historico8d || []);
            setHistoryA3(res.historicoA3 || []);
        }
        setLoadingHistory(false);
    }

    const filteredRncs = rncs.filter(rnc => {
        const matchesStatus = filterStatus === 'ALL' || rnc.status === filterStatus;
        const searchUpper = searchTerm.toUpperCase();
        const matchesTerm = !searchTerm ||
            rnc.numero_rnc.toUpperCase().includes(searchUpper) ||
            rnc.descricao_problema.toUpperCase().includes(searchUpper) ||
            rnc.detetado_por_nome.toUpperCase().includes(searchUpper);

        return matchesStatus && matchesTerm;
    });

    // Merge and Filter History Actions
    const combinedHistory = [
        ...history8d.map(h => ({
            id: h.id, type: '8D', ref: h.numero_8d, rnc: h.qualidade_rnc?.numero_rnc,
            desc: h.qualidade_rnc?.descricao_problema,
            action: h.d5_acao_corretiva || 'Sem Ação Preenchida',
            date: new Date(h.created_at).toLocaleDateString()
        })),
        ...historyA3.map(h => ({
            id: h.id, type: 'A3', ref: h.titulo, rnc: h.qualidade_rnc?.numero_rnc,
            desc: h.qualidade_rnc?.descricao_problema,
            action: h.contramedidas || 'Sem Contramedida',
            date: new Date(h.created_at).toLocaleDateString()
        }))
    ];

    const filteredHistory = combinedHistory.filter(item =>
        (item.rnc || '').toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        (item.desc || '').toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        (item.action || '').toLowerCase().includes(historySearchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 pb-32 max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500 bg-slate-50/50 min-h-screen">
            <header className="flex justify-between items-end border-b pb-4 border-slate-200 print:hidden">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <FileWarning className="text-rose-600" size={36} /> Central de Qualidade (RNC)
                    </h1>
                    <p className="text-lg text-slate-500 mt-1">Gestão de Anomalias de Qualidade e delegação Lean (8D / A3)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/admin/qualidade/rnc/quadro')} className="bg-white hover:bg-slate-50 border-slate-200 font-bold text-slate-700">
                        <LayoutTemplate className="w-4 h-4 mr-2 text-rose-500" /> Modo Quadro Kanban
                    </Button>
                    <Button onClick={() => router.push('/admin/qualidade/rnc/nova')} className="bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 font-bold">
                        <Plus className="w-5 h-5 mr-2" /> Emitir RNC
                    </Button>
                </div>
            </header>

            {/* Custom Tabs Navigation */}
            <div className="flex space-x-2 border-b border-slate-200 print:hidden">
                <button
                    onClick={() => setActiveTab('ativos')}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'ativos' ? 'border-rose-600 text-rose-700 bg-rose-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white'}`}
                >
                    <FileWarning size={16} /> Base de Dados Ativa
                </button>
                <button
                    onClick={() => setActiveTab('historico')}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'historico' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white'}`}
                >
                    <History size={16} /> Histórico de Ações (8D / A3)
                </button>
            </div>


            {/* TAB: ACTIVOS RNC */}
            {activeTab === 'ativos' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* BARRA DE FILTROS */}
                    <Card className="border-slate-200 shadow-sm bg-white print:hidden">
                        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    placeholder="Pesquisar nº relatorio (Ex: RNC-2026), defeito ou pessoa..."
                                    className="bg-slate-50 pl-9 font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="w-full sm:w-[250px] flex items-center gap-2">
                                <Filter className="text-slate-400 w-4 h-4" />
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Estado: Todos" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="ALL">Todo o Histórico</SelectItem>
                                        <SelectItem value="Aberto">Abertas / Por Tratar</SelectItem>
                                        <SelectItem value="Em Investigacao">Em Investigação (8D/A3 ativos)</SelectItem>
                                        <SelectItem value="Concluido">Casos Encerrados (Concluído)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* LISTAGEM GRID */}
                    {loading ? (
                        <div className="p-12 text-center text-slate-500 font-medium animate-pulse border-2 border-dashed border-slate-200 rounded-xl">A sincronizar sistema M.E.S...</div>
                    ) : filteredRncs.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white flex flex-col items-center justify-center">
                            <FileWarning className="w-16 h-16 text-slate-300 mb-4 opacity-50" />
                            <h3 className="text-lg font-bold text-slate-700">A Fábrica está Controlada</h3>
                            <p className="text-sm text-slate-500 mt-1">Nenhuma RNC identificada com estes filtros na Data Base.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500">
                                        <th className="px-6 py-4 font-bold">Identificação Diária</th>
                                        <th className="px-6 py-4 font-bold">Descrição do Defeito Detectado</th>
                                        <th className="px-6 py-4 font-bold text-center">Estado / Fase</th>
                                        <th className="px-6 py-4 font-bold text-center">Delegado p/ Tratar</th>
                                        <th className="px-6 py-4 font-bold text-right print:hidden">Ação / Tratamento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredRncs.map(rnc => {
                                        const isCritical = rnc.gravidade === 'Critica' || rnc.gravidade === 'Bloqueante';
                                        const isOpen = rnc.status === 'Aberto';

                                        // Checking what methodology was requested/is active
                                        const has8d = rnc.qualidade_8d && rnc.qualidade_8d.length > 0;
                                        const hasA3 = rnc.qualidade_a3 && rnc.qualidade_a3.length > 0;

                                        return (
                                            <tr key={rnc.id} className="hover:bg-slate-50/70 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-slate-800 text-sm tracking-tight">{rnc.numero_rnc}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-1 uppercase">
                                                        {new Date(rnc.data_deteccao).toLocaleDateString()} • {rnc.detetado_por_nome}
                                                    </div>
                                                    {(rnc.contexto_producao || rnc.estacoes) && (
                                                        <div className="mt-2 text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex gap-2 w-max text-slate-600 font-bold uppercase">
                                                            {rnc.contexto_producao ? `${rnc.contexto_producao}` : ''}
                                                            {rnc.estacoes ? `${rnc.contexto_producao ? ' • ' : ''}ST: ${rnc.estacoes?.nome_estacao}` : ''}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-black tracking-widest uppercase border ${isCritical ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                            {rnc.tipo_defeito} ({rnc.gravidade})
                                                        </span>
                                                        {rnc.anexos_url && rnc.anexos_url.length > 5 && (
                                                            <Button
                                                                variant="ghost" size="sm"
                                                                onClick={() => {
                                                                    try {
                                                                        const parsed = JSON.parse(rnc.anexos_url);
                                                                        if (Array.isArray(parsed) && parsed.length > 0) {
                                                                            setFotosAtuais(parsed);
                                                                            setIsFotosOpen(true);
                                                                        }
                                                                    } catch(e) {}
                                                                }}
                                                                className="h-6 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] rounded"
                                                            >
                                                                <ImageIcon size={12} className="mr-1" /> Provas
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600 font-medium line-clamp-2 pr-4">{rnc.descricao_problema}</p>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${isOpen ? 'bg-rose-500 text-white border-rose-600 shadow-sm' :
                                                        rnc.status === 'Concluido' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                            'bg-blue-100 text-blue-700 border-blue-200'
                                                        }`}>
                                                        {rnc.status}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    {/* Representação Visual da Metodologia Adotada */}
                                                    {has8d ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded shadow-sm">Método 8D</span>
                                                            <span className="text-[10px] text-slate-500 uppercase">{rnc.qualidade_8d[0].status}</span>
                                                        </div>
                                                    ) : hasA3 ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shadow-sm">Canvas A3</span>
                                                            <span className="text-[10px] text-slate-500 uppercase">{rnc.qualidade_a3[0].status}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-medium italic">Sem Metodologia<br />Atribuída</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-right print:hidden">
                                                    <div className="flex justify-end gap-2">
                                                        {rnc.status === 'Pendente' && !has8d && !hasA3 && (
                                                            <>
                                                                <Button variant="outline" size="sm" className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs" onClick={() => { setEncerrarRncId(rnc.id); setIsEncerrarModalOpen(true); }}>
                                                                    <Ban className="w-3 h-3 mr-1" /> Encerrar Caso
                                                                </Button>
                                                                <Button variant="default" size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs" onClick={() => handleEnviarAnalise(rnc.id)}>
                                                                    <Send className="w-3 h-3 mr-1" /> Enviar para Análise
                                                                </Button>
                                                            </>
                                                        )}

                                                        {rnc.status !== 'Pendente' && !has8d && !hasA3 && rnc.status !== 'Encerrado' && (
                                                            <>
                                                                <Button variant="outline" size="sm" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs" onClick={() => router.push(`/admin/qualidade/rnc/a3/novo/${rnc.id}`)}>
                                                                    <LayoutTemplate className="w-3 h-3 mr-1" /> Gerar A3
                                                                </Button>
                                                            </>
                                                        )}

                                                        <Button variant="outline" size="sm" className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs" onClick={() => openEditModal(rnc)}>
                                                            <Edit className="w-3 h-3 mr-1" /> Editar
                                                        </Button>

                                                        {has8d && (
                                                            <Button variant="default" size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => router.push(`/admin/qualidade/rnc/8d/${rnc.qualidade_8d[0].id}`)}>
                                                                <FileText className="w-3 h-3 mr-1" /> Abrir 8D
                                                            </Button>
                                                        )}

                                                        {hasA3 && (
                                                            <Button variant="default" size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => router.push(`/admin/qualidade/rnc/a3/${rnc.qualidade_a3[0].id}`)}>
                                                                <LayoutTemplate className="w-3 h-3 mr-1" /> Abrir A3
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: HISTORICO */}
            {activeTab === 'historico' && (
                <Card className="border-slate-200 shadow-sm bg-white animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="print:hidden">
                            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">Registo de Lições Aprendidas</CardTitle>
                            <CardDescription>Consulte as ações e contramedidas tomadas nas Ocorrências Históricas.</CardDescription>
                        </div>
                        <div className="hidden print:block mb-4">
                            <h2 className="text-2xl font-black">Histórico de Ações RNC (Metodologias 8D e A3)</h2>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto print:hidden">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    className="pl-9 bg-white"
                                    placeholder="RNC, Problema ou Ação..."
                                    value={historySearchTerm}
                                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" onClick={() => window.print()} className="print:hidden">
                                <Printer className="w-4 h-4 mr-2" /> Imprimir
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingHistory ? (
                            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                                A carregar a base de dados de ações...
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3 border-b">Data</th>
                                            <th className="px-4 py-3 border-b">Documento</th>
                                            <th className="px-4 py-3 border-b">RNC Base</th>
                                            <th className="px-4 py-3 border-b">Problema Relatado</th>
                                            <th className="px-4 py-3 border-b">Ação Corretiva / Contramedida</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 bg-white">
                                                    Nenhum histórico encontrado.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredHistory.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors bg-white">
                                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.date}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.type === '8D' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-rose-600 whitespace-nowrap">{item.rnc || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-slate-800 break-words max-w-[250px] font-medium">{item.desc || 'N/A'}</td>
                                                    <td className="px-4 py-3 font-semibold text-slate-700 break-words max-w-[300px]">{item.action}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Print Styles Global Override */}
            <style jsx global>{`
                @media print {
                    @page { size: landscape; margin: 1cm; }
                    body { background: white !important; font-family: sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                    
                    /* Tabela Print Only */
                    table { border: 1px solid #cbd5e1 !important; width: 100% !important; border-collapse: collapse !important; }
                    th, td { border: 1px solid #cbd5e1 !important; padding: 12px !important; font-size: 10pt !important; color: #000 !important; }
                    th { background-color: #f1f5f9 !important; font-weight: bold !important; font-size: 9pt !important; }
                    tr { page-break-inside: avoid; }
                    
                    /* Hide unnecessary wrappers */
                    .max-w-\\[1400px\\] { max-width: none !important; margin: 0 !important; padding: 0 !important; }
                    .shadow-sm { box-shadow: none !important; }
                    .border-slate-200 { border-color: transparent !important; }
                    .bg-slate-50\\/50 { background: white !important; }
                }
            `}</style>

            {/* MODAL EDITAR RNC BASE */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2"><Edit size={20} className="text-indigo-600"/> Editar Detalhes RNC Base</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Atualize a descrição original do problema ou o contexto para melhor compreensão na War Room.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Descrição do Defeito / Problema</Label>
                            <Textarea
                                value={editPayload.descricao_problema || ''}
                                onChange={e => setEditPayload({ ...editPayload, descricao_problema: e.target.value })}
                                className="bg-slate-50 font-medium min-h-[100px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Contexto Produtivo (Sintomas extra)</Label>
                            <Input
                                value={editPayload.contexto_producao || ''}
                                onChange={e => setEditPayload({ ...editPayload, contexto_producao: e.target.value })}
                                className="bg-slate-50 font-medium"
                                placeholder="OP X, Turno B, Máquina Y..."
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <Label className="text-xs font-bold text-slate-700 uppercase mb-3 block">Evidências Fotográficas (Máx. 2)</Label>
                            
                            <div className="flex flex-wrap gap-4 items-start">
                                {(editPayload.fotos || []).map((f: string, idx: number) => (
                                    <div key={idx} className="relative w-32 h-32 rounded-lg border border-slate-200 overflow-hidden shadow-sm group">
                                        <img src={f} alt={`Evidencia ${idx}`} className="object-cover w-full h-full" />
                                        <button 
                                            type="button" 
                                            onClick={() => removeFoto(idx)}
                                            className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}

                                {(editPayload.fotos || []).length < 2 && (
                                    <label className="w-32 h-32 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-colors bg-slate-50">
                                        <span className="text-2xl mb-1">+</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">Anexar<br/>Ficheiro</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={handleFileChange}
                                            multiple
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="font-bold border-slate-200">
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveRnc} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Guardar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL ENCERRAR RNC */}
            <Dialog open={isEncerrarModalOpen} onOpenChange={setIsEncerrarModalOpen}>
                <DialogContent className="sm:max-w-[425px] border-rose-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-rose-700 flex items-center gap-2"><Ban size={20} /> Encerrar RNC (S/ Seguimento)</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Irá descartar permanentemente esta ocorrência e retirar a necessidade de ser analisada na War Room.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Justificativa Técnica (Obrigatório)</Label>
                            <Textarea
                                value={justificativaFecho}
                                onChange={e => setJustificativaFecho(e.target.value)}
                                className="bg-rose-50/30 border-rose-100 font-medium min-h-[100px]"
                                placeholder="Motivo do encerramento precoce..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEncerrarModalOpen(false)} className="font-bold border-slate-200">Cancelar</Button>
                        <Button onClick={handleEncerrar} disabled={isSaving} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Encerramento'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL GALERIA DE FOTOS */}
            <Dialog open={isFotosOpen} onOpenChange={setIsFotosOpen}>
                <DialogContent className="sm:max-w-[800px] bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black flex items-center gap-2"><ImageIcon size={20} className="text-indigo-400" /> Galeria de Provas Visuais</DialogTitle>
                        <DialogDescription className="text-slate-400">Registo fotográfico associado a esta Não Conformidade</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
                        {fotosAtuais.map((url, idx) => (
                            <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-700 group bg-slate-800/50 aspect-video flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Prova ${idx + 1}`} className="object-contain w-full h-full max-h-[400px]" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import { getTVConfigs, addTVConfig, updateTVConfig, deleteTVConfig, getLinhasForSelect } from './actions';
import { getAreasTVLinks } from '../../producao/andon/actions';
import { Tv, MonitorPlay, Settings, Plus, Trash2, ShieldAlert, Edit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import Link from 'next/link';

export default function TVConfiguracoesPage() {
    const [tvs, setTvs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Form State
    const [nomeTv, setNomeTv] = useState('');
    const [tipoAlvo, setTipoAlvo] = useState('AREA');
    const [alvoId, setAlvoId] = useState('');
    const [layout, setLayout] = useState('KPIS_HINT');
    const [currentHost, setCurrentHost] = useState('brunswick-pt.vercel.app'); // fallback

    const [opcoesLayout, setOpcoesLayout] = useState({
        showOeeDay: true,
        showOeeMonth: true,
        showWorkerOfMonth: true,
        showSafeArea: true,
        showBottlenecks: true,
        showEfficiency: true,
        showAbsentismo: true,
        showSafetyCross: true,
        showHstKpis: true,
        minimiseAndon: true
    });

    // Select Data Options
    const [linhas, setLinhas] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentHost(window.location.host);
        }
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        const [tvsRes, linhasRes, areasRes] = await Promise.all([
            getTVConfigs(),
            getLinhasForSelect(),
            getAreasTVLinks()
        ]);

        if (tvsRes.success) setTvs(tvsRes.data);
        if (linhasRes.success) setLinhas(linhasRes.data);
        if (areasRes.success) setAreas(areasRes.data);

        setIsLoading(false);
    }

    function openAddModal() {
        setIsEditMode(false);
        setEditId(null);
        setNomeTv('');
        setAlvoId('');
        setOpcoesLayout({
            showOeeDay: true,
            showOeeMonth: true,
            showWorkerOfMonth: true,
            showSafeArea: true,
            showBottlenecks: true,
            showEfficiency: true,
            showAbsentismo: true,
            showSafetyCross: true,
            showHstKpis: true,
            minimiseAndon: true
        });
        setIsAddModalOpen(true);
    }

    function openEditModal(tv: any) {
        setIsEditMode(true);
        setEditId(tv.id);
        setNomeTv(tv.nome_tv);
        setTipoAlvo(tv.tipo_alvo);
        setAlvoId(tv.alvo_id || '');
        setLayout(tv.layout_preferencial || 'KPIS_HINT');
        setOpcoesLayout(tv.opcoes_layout || {
            showOeeDay: true, showOeeMonth: true, showWorkerOfMonth: true,
            showSafeArea: true, showBottlenecks: true, showEfficiency: true,
            showAbsentismo: true, showSafetyCross: true, showHstKpis: true,
            minimiseAndon: true
        });
        setIsAddModalOpen(true);
    }

    async function handleAddSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            nome_tv: nomeTv,
            tipo_alvo: tipoAlvo,
            alvo_id: tipoAlvo === 'GERAL' ? null : alvoId,
            layout_preferencial: layout,
            opcoes_layout: opcoesLayout
        };

        if (isEditMode && editId) {
            const res = await updateTVConfig(editId, payload);
            if (res.success) {
                setIsAddModalOpen(false);
                await loadData();
            } else {
                alert("Erro ao editar TV: " + res.error);
            }
        } else {
            const res = await addTVConfig(payload);
            if (res.success) {
                setIsAddModalOpen(false);
                await loadData();
            } else {
                alert("Erro ao adicionar TV: " + res.error);
            }
        }
        setIsLoading(false);
    }

    async function handleDelete(id: string, name: string) {
        if (!window.confirm(`Tem a certeza que deseja remover o ecrã físico "${name}"?`)) return;
        setIsLoading(true);
        const res = await deleteTVConfig(id);
        if (res.success) {
            await loadData();
        } else {
            alert("Erro ao apagar TV: " + res.error);
            setIsLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <MonitorPlay className="text-blue-600" size={36} />
                        Gestor de Monitores (Factory TVs)
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Registe e configure os ecrãs físicos espalhados pela Fábrica. Mapeie que área ou linha cada TV deve mostrar.
                    </p>
                </div>
                <Button
                    onClick={openAddModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 shadow-lg hover:shadow-xl transition-all"
                >
                    <Plus size={20} className="mr-2" />
                    Adicionar Novo Ecrã
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading && tvs.length === 0 ? (
                    <div className="col-span-full p-12 text-center text-slate-400 font-medium">A carregar monitores parametrizados...</div>
                ) : tvs.length === 0 ? (
                    <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                        <MonitorPlay size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-600">Nenhuma TV Configurada</h3>
                        <p className="text-slate-500 mt-1">Crie o seu primeiro monitor para lhe atribuir um URL M.E.S Fixo.</p>
                    </div>
                ) : (
                    tvs.map((tv) => (
                        <Card key={tv.id} className="shadow-lg border-slate-200 hover:border-blue-400 transition-colors group">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2 truncate">
                                    <Tv size={18} className="text-slate-500 shrink-0" /> {tv.nome_tv}
                                </CardTitle>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditModal(tv)}
                                        className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                        title="Editar Configurações"
                                    >
                                        <Edit size={18} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(tv.id, tv.nome_tv)}
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                        title="Eliminar Ecrã"
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4 text-sm">

                                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">Visão:</span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none capitalize 
                                        ${tv.tipo_alvo === 'LINHA' ? 'bg-indigo-100 text-indigo-700' :
                                            tv.tipo_alvo === 'AREA' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-purple-100 text-purple-700'}`}>
                                        {tv.tipo_alvo}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">Foco em Alvo:</span>
                                    <span className="text-slate-800 font-bold max-w-[150px] truncate text-right" title={tv.nome_alvo_resolvido}>
                                        {tv.nome_alvo_resolvido}
                                    </span>
                                </div>

                                <div className="pt-3 border-t border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">PIN de Emparelhamento Rápido</span>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-800 text-white px-4 py-2 rounded-lg font-mono text-xl font-black tracking-widest shadow-inner">
                                            {tv.codigo_curto || 'A AGUARDAR'}
                                        </div>
                                        <div className="flex-1 flex flex-col items-start justify-center">
                                            <span className="text-xs text-slate-500 font-medium">No Browser da TV abra:</span>
                                            <span className="text-sm font-bold text-blue-600">{currentHost}/tv/{tv.codigo_curto || 'XXXXX'}</span>
                                        </div>
                                        <Link href={`/tv/live/${tv.id}`} target="_blank">
                                            <Button size="icon" variant="outline" className="h-10 w-10 border-blue-200 text-blue-600 hover:bg-blue-50" title="Abrir Dashboard (Teste Rápido)">
                                                <Tv size={18} />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal de Criação */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-2xl bg-white border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
                            <MonitorPlay className="text-blue-600" />
                            {isEditMode ? 'Editar Configuração de TV' : 'Registar Novo Ecrã TV'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Preencha os dados técnicos da televisão e o tipo de Dashboard (M.E.S. Target) que pretende que corra nativamente no browser do ecrã.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddSubmit} className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>Denominação do Hardware</Label>
                            <Input
                                required
                                value={nomeTv}
                                onChange={(e) => setNomeTv(e.target.value)}
                                placeholder="ex: TV LG 65 Polegadas - Corredor B"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Escopo de Visão (Tipo de Alvo)</Label>
                            <select
                                required
                                value={tipoAlvo}
                                onChange={(e) => {
                                    setTipoAlvo(e.target.value);
                                    setAlvoId('');
                                }}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                                <option value="LINHA">Focar numa Linha de Produção Singular</option>
                                <option value="AREA">Focar em Diversas Linhas de uma Área</option>
                                <option value="GERAL">Visão Geral Completa de Fábrica</option>
                            </select>
                        </div>

                        {tipoAlvo !== 'GERAL' && (
                            <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                <Label>Selecione exatamente quem é o Alvo:</Label>
                                <select
                                    required
                                    value={alvoId}
                                    onChange={(e) => setAlvoId(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 mt-2"
                                >
                                    <option value="" disabled>Selecione um item da base de dados...</option>
                                    {tipoAlvo === 'LINHA' && linhas.map(l => (
                                        <option key={l.id} value={l.id}>{l.descricao_linha}</option>
                                    ))}
                                    {tipoAlvo === 'AREA' && areas.map(a => (
                                        <option key={a.id} value={a.id}>{a.nome_area}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-3 pt-4 border-t border-slate-200">
                            <Label className="text-blue-700 font-bold flex items-center gap-2">
                                <Settings size={16} /> Widgets NASA-Level (Configuração do Layout)
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                {Object.entries({
                                    showOeeDay: "OEE Global do Dia (Real vs Objetivo)",
                                    showOeeMonth: "KPI Mensal (Mês Atual)",
                                    showWorkerOfMonth: "Herói do Mês (Destaque Colaborador)",
                                    showSafeArea: "Ranking: Área Mais Segura (HST)",
                                    showBottlenecks: "Alerta em Tempo Real: Gargalos Atuais",
                                    showEfficiency: "Painel de Atrasos e Média Atual",
                                    showAbsentismo: "Taxa de Absentismo em Tempo Real",
                                    showSafetyCross: "Cruz de Segurança (Safety Cross)",
                                    showHstKpis: "Conformidade Fabril e Segurança Diária",
                                    minimiseAndon: "Minimizar Alertas Andon (Poupar Espaço Tela)"
                                }).map(([key, label]) => (
                                    <label key={key} className="flex flex-row items-start gap-3 cursor-pointer p-3 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 hover:shadow-sm transition-all">
                                        <input
                                            type="checkbox"
                                            checked={opcoesLayout[key as keyof typeof opcoesLayout]}
                                            onChange={() => setOpcoesLayout(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                                            className="w-5 h-5 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 shrink-0"
                                        />
                                        <span className="text-sm font-semibold text-slate-700 select-none leading-tight">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="mt-6 gap-2 sm:justify-between">
                            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
                                {isLoading ? "A Salvar..." : isEditMode ? "Atualizar TV" : "Registar TV (Gerar URL Livre)"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

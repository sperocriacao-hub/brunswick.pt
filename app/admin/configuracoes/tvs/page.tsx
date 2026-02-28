'use client';

import React, { useState, useEffect } from 'react';
import { getTVConfigs, addTVConfig, deleteTVConfig, getLinhasForSelect } from './actions';
import { getAreasTVLinks } from '../../producao/andon/actions';
import { Tv, MonitorPlay, Settings, Plus, Trash2, ShieldAlert } from 'lucide-react';
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

    // Form State
    const [nomeTv, setNomeTv] = useState('');
    const [tipoAlvo, setTipoAlvo] = useState('AREA');
    const [alvoId, setAlvoId] = useState('');
    const [layout, setLayout] = useState('KPIS_HINT');

    // Select Data Options
    const [linhas, setLinhas] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);

    useEffect(() => {
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

    async function handleAddSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            nome_tv: nomeTv,
            tipo_alvo: tipoAlvo,
            alvo_id: tipoAlvo === 'GERAL' ? null : alvoId,
            layout_preferencial: layout
        };

        const res = await addTVConfig(payload);
        if (res.success) {
            setIsAddModalOpen(false);
            setNomeTv('');
            setAlvoId('');
            await loadData();
        } else {
            alert("Erro ao adicionar TV: " + res.error);
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
                    onClick={() => setIsAddModalOpen(true)}
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
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(tv.id, tv.nome_tv)}
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                >
                                    <Trash2 size={18} />
                                </Button>
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

                                <div className="pt-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">URL da TV Fixa (Factory URL)</span>
                                    <div className="flex gap-2">
                                        <code className="flex-1 bg-slate-100 px-3 py-2 rounded-md text-xs font-mono text-slate-600 truncate border border-slate-200">
                                            /tv/live/{tv.id.split('-')[0]}...
                                        </code>
                                        <Link href={`/tv/live/${tv.id}`} target="_blank">
                                            <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                                                Testar Link
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
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <MonitorPlay className="text-blue-500" />
                            Registar Novo Ecrã TV
                        </DialogTitle>
                        <DialogDescription>
                            Gere uma ligação fixa e perpétua para um monitor físico operando na linha de montagem.
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
                                        <option key={l.id} value={l.id}>{l.nome_linha}</option>
                                    ))}
                                    {tipoAlvo === 'AREA' && areas.map(a => (
                                        <option key={a.id} value={a.id}>{a.nome_area}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <DialogFooter className="mt-6 gap-2 sm:justify-between">
                            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
                                {isLoading ? "A Salvar..." : "Registar TV (Gerar URL Livre)"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

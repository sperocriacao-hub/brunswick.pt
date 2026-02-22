"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Tag, Info, Save, Anchor } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// Tipos de dados (Mocks baseados na tua BD Supabase)
type Modelo = { id: string; nome: string; model_year: string };
type Linha = { id: string; letra: string; nome: string };
type Roteiro = { id: string; estacao_nome: string; offset_dias: number; duracao_dias: number };
type Molde = { id: string; nome_parte: string; rfid: string; ciclos_estimados: number; manutenir_em: number };

// Dados Simulados para o Front-end (depois ligamos ao supabase-js)
const MODELOS: Modelo[] = [
    { id: 'm1', nome: 'Brunswick 320 VIP', model_year: '2026' },
    { id: 'm2', nome: 'Vanguard 45', model_year: '2026' }
];

const LINHAS: Linha[] = [
    { id: 'l1', letra: 'A', nome: 'Linha Principal Cascos' },
    { id: 'l2', letra: 'B', nome: 'Linha Rápida (Small)' }
];

const ROTEIRO_MOCK: Roteiro[] = [
    { id: 'r1', estacao_nome: 'Laminação Casco', offset_dias: 0, duracao_dias: 3 },
    { id: 'r2', estacao_nome: 'Desmoldagem e Inspeção', offset_dias: 3, duracao_dias: 1 },
    { id: 'r3', estacao_nome: 'Montagem Estrutural', offset_dias: 4, duracao_dias: 5 },
    { id: 'r4', estacao_nome: 'Acabamento Final', offset_dias: 9, duracao_dias: 2 }
];

const MOLDES_MOCK: Molde[] = [
    { id: 'molde-c1', nome_parte: 'Casco Inferior VIP', rfid: 'RFID-990-21-X', ciclos_estimados: 145, manutenir_em: 150 },
    { id: 'molde-c2', nome_parte: 'Coberta Superior VIP', rfid: 'RFID-991-22-Y', ciclos_estimados: 290, manutenir_em: 300 }
];

export default function NovaOrdermProducaoPage() {
    // 1. Seleção de Ordem
    const [modeloSelecionado, setModeloSelecionado] = useState('');
    const [linhaSelecionada, setLinhaSelecionada] = useState('');

    // 2. Administrativo
    const [po, setPo] = useState('');
    const [pp, setPp] = useState('');
    const [hin, setHin] = useState('');
    const [ns, setNs] = useState('');
    const [cliente, setCliente] = useState('');
    const [pais, setPais] = useState('');
    const [region, setRegion] = useState('');

    // 3. Cronograma Automático
    const [dataInicio, setDataInicio] = useState('');
    const [cronograma, setCronograma] = useState<{ estacao: string; inicio: string; fim: string }[]>([]);

    useEffect(() => {
        if (!dataInicio || !modeloSelecionado) {
            setCronograma([]);
            return;
        }

        const start = new Date(dataInicio);

        const novoCronograma = ROTEIRO_MOCK.map(passo => {
            const d_inicio = new Date(start);
            d_inicio.setDate(d_inicio.getDate() + passo.offset_dias);

            const d_fim = new Date(d_inicio);
            d_fim.setDate(d_fim.getDate() + passo.duracao_dias);

            return {
                estacao: passo.estacao_nome,
                inicio: d_inicio.toLocaleDateString('pt-PT'),
                fim: d_fim.toLocaleDateString('pt-PT')
            };
        });

        setCronograma(novoCronograma);
    }, [dataInicio, modeloSelecionado]);

    return (
        <div className="container mx-auto mt-4 animate-fade-in max-w-7xl">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-blue-900">Planeamento de Produção (MES)</h1>
                    <p className="text-muted-foreground mt-1">Emissão e escalonamento de novas Ordens de Produção.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Save size={18} className="mr-2" />
                    Emitir Ordem (OP)
                </Button>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* COLUNA ESQUERDA: Dados Primários */}
                <div className="xl:col-span-2 flex flex-col gap-6">

                    {/* SECÇÃO 1: ESTRUTURA E SELEÇÃO */}
                    <Card className="border-blue-100 shadow-sm">
                        <CardHeader className="bg-slate-50 border-b border-blue-50/50 pb-4">
                            <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
                                <Anchor size={20} className="text-blue-600" /> Classificação da Ordem
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-blue-900 font-semibold">Modelo a Fabricar</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={modeloSelecionado}
                                        onChange={(e) => setModeloSelecionado(e.target.value)}
                                    >
                                        <option value="">-- Selecione o Modelo Base --</option>
                                        {MODELOS.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.model_year})</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label className="text-blue-900 font-semibold">Linha de Produção Atribuída</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={linhaSelecionada}
                                        onChange={(e) => setLinhaSelecionada(e.target.value)}
                                    >
                                        <option value="">-- Linha Fabril --</option>
                                        {LINHAS.map(l => <option key={l.id} value={l.id}>Linha {l.letra} - {l.nome}</option>)}
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SECÇÃO 2: CAMPOS ADMINISTRATIVOS */}
                    <Card className="border-blue-100 shadow-sm">
                        <CardHeader className="bg-slate-50 border-b border-blue-50/50 pb-4">
                            <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
                                <Info size={20} className="text-blue-600" /> Dados Administrativos & Tracking
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-slate-700">PO (Compra)</Label>
                                    <Input value={po} onChange={e => setPo(e.target.value)} placeholder="PO-XX" className="bg-slate-50/50" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label className="text-slate-700">PP Plan</Label>
                                    <Input value={pp} onChange={e => setPp(e.target.value)} placeholder="PP-XX" className="bg-slate-50/50" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label className="text-slate-700">HIN (Hull ID)</Label>
                                    <Input value={hin} onChange={e => setHin(e.target.value)} placeholder="US-BR..." className="bg-slate-50/50" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label className="text-slate-700">Nº de Série</Label>
                                    <Input value={ns} onChange={e => setNs(e.target.value)} placeholder="000" className="bg-slate-50/50" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-slate-700">Cliente Final / Dealer</Label>
                                    <Input value={cliente} onChange={e => setCliente(e.target.value)} className="bg-slate-50/50" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label className="text-slate-700">País de Destino</Label>
                                    <Input value={pais} onChange={e => setPais(e.target.value)} className="bg-slate-50/50" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label className="text-slate-700">Brand / Region</Label>
                                    <Input value={region} onChange={e => setRegion(e.target.value)} className="bg-slate-50/50" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* COLUNA DIREITA: CRONOGRAMA & MOLDES */}
                <div className="flex flex-col gap-6">

                    {/* SECÇÃO 3: CRONOGRAMA INTELIGENTE */}
                    <Card className="border-blue-100 shadow-sm flex-1">
                        <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50 pb-4">
                            <CardTitle className="flex items-center gap-2 text-emerald-800 text-lg">
                                <Calendar size={18} className="text-emerald-600" /> Dinâmica de Datas (Offset)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex flex-col gap-2 mb-6">
                                <Label className="text-blue-900 font-semibold">Arrancar Produção a:</Label>
                                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full bg-slate-50/50 border-slate-300" />
                            </div>

                            {cronograma.length === 0 ? (
                                <div className="p-6 text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg bg-slate-50/50">
                                    Selecione um Modelo e a Data de Início para calcular o Roteiro automaticamente.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {cronograma.map((c, i) => (
                                        <div key={i} className="flex flex-col p-3 bg-white border border-slate-200 shadow-sm rounded-lg border-l-4 border-l-emerald-500">
                                            <span className="text-sm font-semibold text-slate-800">{c.estacao}</span>
                                            <div className="flex justify-between mt-2 text-xs text-slate-500">
                                                <span>Início: {c.inicio}</span>
                                                <span className="font-medium">Fim Previsível: {c.fim}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* SECÇÃO 4: SUPERVISÃO DE MOLDES (RFID) */}
                    <Card className="border-amber-100 shadow-sm">
                        <CardHeader className="bg-amber-50/50 border-b border-amber-100/50 pb-4">
                            <CardTitle className="flex items-center gap-2 text-amber-800 text-lg">
                                <Tag size={18} className="text-amber-600" /> Segurança de Moldes (RFID)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                                O sistema associou as seguintes partes físicas a esta OP. Verifique os ciclos antes de liberar a produção.
                            </p>

                            <div className="flex flex-col gap-4">
                                {modeloSelecionado ? MOLDES_MOCK.map((m) => {
                                    const percentagemUso = (m.ciclos_estimados / m.manutenir_em) * 100;
                                    const needsMaintenance = percentagemUso > 90;

                                    return (
                                        <div key={m.id} className="p-4 bg-white border border-slate-200 shadow-sm rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-sm text-slate-800">{m.nome_parte}</span>
                                                <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">{m.rfid}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-3">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                                    <div
                                                        className={`h-full ${needsMaintenance ? 'bg-red-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${percentagemUso}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`text-xs font-medium ${needsMaintenance ? 'text-red-600' : 'text-slate-600'}`}>
                                                    {m.ciclos_estimados}/{m.manutenir_em}
                                                </span>
                                            </div>
                                            {needsMaintenance && <span className="text-xs text-red-600 font-medium block mt-2 text-right">Atenção: Manutenção Imminente</span>}
                                        </div>
                                    )
                                }) : (
                                    <div className="text-sm text-slate-400 text-center py-4">Nenhum modelo selecionado.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}

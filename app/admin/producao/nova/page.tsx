"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Tag, Info, Save, Clock, Anchor } from 'lucide-react';

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

    // Efeito que recalcula as datas sempre que o "Data de Início" altera
    useEffect(() => {
        if (!dataInicio || !modeloSelecionado) {
            setCronograma([]);
            return;
        }

        const start = new Date(dataInicio);

        // Algoritmo: Pega no start param e adiciona os dias (ignora fins de semana para simplificar neste exemplo base, mas no futuro poderás adicionar lógica de calendário laboral).
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
        <div className="container mt-8 animate-fade-in dashboard-layout" style={{ display: 'block' }}>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="brand-title" style={{ marginBottom: 0 }}>Planeamento de Produção (MES)</h1>
                    <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "0.25rem" }}>Emissão e escalonamento de novas Ordens de Produção.</p>
                </div>
                <button className="btn btn-primary">
                    <Save size={18} style={{ marginRight: '8px' }} />
                    Emitir Ordem (OP)
                </button>
            </header>

            <div className="grid grid-cols-3 gap-8">

                {/* COLUNA ESQUERDA: Dados Primários */}
                <div className="col-span-2" style={{ gridColumn: 'span 2' }}>

                    {/* SECÇÃO 1: ESTRUTURA E SELEÇÃO */}
                    <section className="glass-panel p-6 mb-8">
                        <h2 className="flex items-center gap-2 mb-6" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
                            <Anchor size={20} /> Classificação da Ordem
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="form-group">
                                <label className="form-label">Modelo a Fabricar</label>
                                <select className="form-control" value={modeloSelecionado} onChange={(e) => setModeloSelecionado(e.target.value)}>
                                    <option value="">-- Selecione o Modelo Base --</option>
                                    {MODELOS.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.model_year})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Linha de Produção Atribuída</label>
                                <select className="form-control" value={linhaSelecionada} onChange={(e) => setLinhaSelecionada(e.target.value)}>
                                    <option value="">-- Linha Fabril --</option>
                                    {LINHAS.map(l => <option key={l.id} value={l.id}>Linha {l.letra} - {l.nome}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* SECÇÃO 2: CAMPOS ADMINISTRATIVOS */}
                    <section className="glass-panel p-6 animate-delay-1">
                        <h2 className="flex items-center gap-2 mb-6" style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>
                            <Info size={20} /> Dados Administrativos & Tracking
                        </h2>

                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="form-group">
                                <label className="form-label">PO (Compra)</label>
                                <input type="text" className="form-control" value={po} onChange={e => setPo(e.target.value)} placeholder="PO-XX" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">PP Plan</label>
                                <input type="text" className="form-control" value={pp} onChange={e => setPp(e.target.value)} placeholder="PP-XX" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">HIN (Hull ID)</label>
                                <input type="text" className="form-control" value={hin} onChange={e => setHin(e.target.value)} placeholder="US-BR..." />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nº de Série</label>
                                <input type="text" className="form-control" value={ns} onChange={e => setNs(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="form-group">
                                <label className="form-label">Cliente Final / Dealer</label>
                                <input type="text" className="form-control" value={cliente} onChange={e => setCliente(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">País de Destino</label>
                                <input type="text" className="form-control" value={pais} onChange={e => setPais(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Brand / Region</label>
                                <input type="text" className="form-control" value={region} onChange={e => setRegion(e.target.value)} />
                            </div>
                        </div>
                    </section>
                </div>


                {/* COLUNA DIREITA: CRONOGRAMA & MOLDES */}
                <div className="flex flex-col gap-8">

                    {/* SECÇÃO 3: CRONOGRAMA INTELIGENTE */}
                    <section className="glass-panel p-6 animate-delay-2" style={{ flex: 1 }}>
                        <h2 className="flex items-center gap-2 mb-6" style={{ fontSize: '1.1rem', color: 'var(--secondary)' }}>
                            <Calendar size={18} /> Dinâmica de Datas (Offset)
                        </h2>

                        <div className="form-group mb-6">
                            <label className="form-label">Arrancar Produção a:</label>
                            <input type="date" className="form-control" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                        </div>

                        {cronograma.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, border: '1px dashed var(--border)', borderRadius: '8px' }}>
                                Selecione um Modelo e insira a Data de Início para calcular o Roteiro automaticamente.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {cronograma.map((c, i) => (
                                    <div key={i} className="flex flex-col p-3" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', borderLeft: '3px solid var(--secondary)' }}>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{c.estacao}</span>
                                        <div className="flex justify-between mt-1" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                            <span>Início: {c.inicio}</span>
                                            <span>Fim Prev: {c.fim}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* SECÇÃO 4: SUPERVISÃO DE MOLDES (RFID) */}
                    <section className="glass-panel p-6 animate-delay-3">
                        <h2 className="flex items-center gap-2 mb-4" style={{ fontSize: '1.1rem', color: '#f59e0b' }}>
                            <Tag size={18} /> Segurança de Moldes (RFID)
                        </h2>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1.5rem', lineHeight: 1.4 }}>
                            O sistema associou os seguintes moldes físicos a esta OP. Verifique os ciclos de manutenção antes de liberar.
                        </p>

                        <div className="flex flex-col gap-4">
                            {modeloSelecionado ? MOLDES_MOCK.map((m) => {
                                const percentagemUso = (m.ciclos_estimados / m.manutenir_em) * 100;
                                const needsMaintenance = percentagemUso > 90;

                                return (
                                    <div key={m.id} className="p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{m.nome_parte}</span>
                                            <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', background: 'var(--background-base)', padding: '2px 6px', borderRadius: '4px' }}>{m.rfid}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div style={{ flex: 1, height: '4px', background: 'var(--background-base)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${percentagemUso}%`, background: needsMaintenance ? 'var(--danger)' : '#f59e0b' }}></div>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: needsMaintenance ? 'var(--danger)' : 'inherit' }}>
                                                {m.ciclos_estimados}/{m.manutenir_em}
                                            </span>
                                        </div>
                                        {needsMaintenance && <span style={{ fontSize: '0.7rem', color: 'var(--danger)', display: 'block', marginTop: '4px' }}>Manutenção Obrigatória!</span>}
                                    </div>
                                )
                            }) : (
                                <div style={{ fontSize: '0.85rem', opacity: 0.5, textAlign: 'center' }}>Nenhum modelo selecionado.</div>
                            )}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}

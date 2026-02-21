"use client";

import React, { useState } from 'react';
import { Network, Activity, Wrench, Settings, Plus, Box, ArrowRight } from 'lucide-react';

// Tipos Mockados para a Interface Visual
type EstacaoStatus = 'Disponível' | 'Em Manutenção' | 'Inativa';

type Estacao = {
    id: string;
    nome: string;
    area_grupo: string;
    sub_area: string;
    status: EstacaoStatus;
    capacidade: number;
    tempo_ciclo: number; // Em minutos
    tag_rfid: string;
    predecessoras?: string[]; // IDs
    sucessoras?: string[]; // IDs
};

type LinhaProdução = {
    id: string;
    letra: string;
    descricao: string;
    capacidade_diaria: number;
};

// Dados Mock temporários para construir a UI Árvore
const MOCKED_LINHAS: LinhaProdução[] = [
    { id: 'linha-a', letra: 'A', descricao: 'Cruisers & Yachts', capacidade_diaria: 2 },
    { id: 'linha-b', letra: 'B', descricao: 'Outboards Comerciais', capacidade_diaria: 8 },
];

const MOCKED_ESTACOES: Estacao[] = [
    { id: 'est-1', nome: 'Moldagem Casco Principal', area_grupo: 'Laminação', sub_area: 'Cascos', status: 'Disponível', capacidade: 4, tempo_ciclo: 120, tag_rfid: 'RFID-1001' },
    { id: 'est-2', nome: 'Moldagem Coberta Superior', area_grupo: 'Laminação', sub_area: 'Cobertas', status: 'Disponível', capacidade: 4, tempo_ciclo: 90, tag_rfid: 'RFID-1002' },
    { id: 'est-3', nome: 'Cura Estrutural', area_grupo: 'Preparação', sub_area: 'Estufa', status: 'Em Manutenção', capacidade: 2, tempo_ciclo: 480, tag_rfid: 'RFID-2001' },
    { id: 'est-4', nome: 'Casamento Casco/Coberta', area_grupo: 'Montagem', sub_area: 'Estruturação', status: 'Disponível', capacidade: 3, tempo_ciclo: 180, tag_rfid: 'RFID-3001' },
    { id: 'est-5', nome: 'Cablagem Base', area_grupo: 'Montagem', sub_area: 'Elétrica', status: 'Disponível', capacidade: 5, tempo_ciclo: 240, tag_rfid: 'RFID-3002' },
    { id: 'est-6', nome: 'Instalação Motor', area_grupo: 'Instalação', sub_area: 'Mecânica', status: 'Disponível', capacidade: 3, tempo_ciclo: 120, tag_rfid: 'RFID-4001' },
    { id: 'est-7', nome: 'Inspeção Final da Água', area_grupo: 'Qualidade', sub_area: 'Piscina de Teste', status: 'Inativa', capacidade: 1, tempo_ciclo: 60, tag_rfid: 'RFID-9001' },
];

export default function FabricaLayoutPage() {
    const [viewMode, setViewMode] = useState<'areas' | 'grafos'>('areas');

    // Agrupar as estações por grande área
    const groupedByArea = MOCKED_ESTACOES.reduce((acc, est) => {
        if (!acc[est.area_grupo]) {
            acc[est.area_grupo] = [];
        }
        acc[est.area_grupo].push(est);
        return acc;
    }, {} as Record<string, Estacao[]>);

    return (
        <div className="container mt-8 animate-fade-in dashboard-layout">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="brand-title" style={{ marginBottom: 0 }}>Estrutura de Fábrica</h1>
                    <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "0.25rem" }}>
                        Monitorize e configure a Topologia Físico-Digital do seu Shopfloor.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button className="btn btn-outline" onClick={() => setViewMode(viewMode === 'areas' ? 'grafos' : 'areas')}>
                        <Network size={18} style={{ marginRight: '8px' }} />
                        {viewMode === 'areas' ? 'Modo Grafo (Beta)' : 'Modo Grid Áreas'}
                    </button>
                    <button className="btn btn-primary">
                        <Plus size={18} style={{ marginRight: '8px' }} />
                        Nova Linha
                    </button>
                </div>
            </header>

            {/* SECTÇÃO 1: LINHAS DE PRODUÇÃO ATIVAS */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="glass-panel p-6 flex flex-col justify-center items-center" style={{ border: '2px dashed rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                    <Plus size={32} opacity={0.5} className="mb-2" />
                    <span style={{ fontWeight: 600, opacity: 0.7 }}>Adicionar Estação</span>
                </div>
                {MOCKED_LINHAS.map(linha => (
                    <div key={linha.id} className="glass-panel p-5 relative overflow-hidden group">
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '6rem', opacity: 0.05, fontWeight: 900, pointerEvents: 'none' }}>
                            {linha.letra}
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Activity size={18} /> Linha {linha.letra}
                                </h3>
                                <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>{linha.descricao}</p>
                            </div>
                            <Settings size={18} opacity={0.5} className="cursor-pointer group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between items-center">
                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Capacidade Alvo</span>
                            <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>{linha.capacidade_diaria} <span style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.7 }}>barcos/dia</span></span>
                        </div>
                    </div>
                ))}
            </div>

            {/* SECTÃO 2: O CHÃO DE FÁBRICA (KABAN DE ESTAÇÕES) */}
            {viewMode === 'areas' && (
                <div className="flex flex-col gap-8">
                    {Object.entries(groupedByArea).map(([area, estacoes]) => (
                        <section key={area} className="glass-panel p-6">
                            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-[rgba(255,255,255,0.1)]">
                                <Box size={24} color="var(--accent)" />
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0 }}>Zona: {area}</h2>
                            </div>

                            <div className="grid grid-cols-4 gap-5">
                                {estacoes.map(est => (
                                    <div key={est.id} className="glass-panel p-4 outline outline-1 outline-[rgba(255,255,255,0.05)] hover:outline-[var(--primary)] transition-all" style={{
                                        position: 'relative',
                                        overflow: 'hidden',
                                        background: est.status === 'Em Manutenção' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(30, 41, 59, 1) 100%)' :
                                            est.status === 'Inativa' ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(15, 23, 42, 1) 100%)' : undefined
                                    }}>

                                        {/* Status Indicator */}
                                        <div className="flex justify-between items-start mb-3">
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px',
                                                background: est.status === 'Disponível' ? 'rgba(34, 197, 94, 0.2)' : est.status === 'Em Manutenção' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)',
                                                color: est.status === 'Disponível' ? '#4ade80' : est.status === 'Em Manutenção' ? '#f87171' : '#94a3b8'
                                            }}>
                                                {est.status.toUpperCase()}
                                            </span>
                                            {est.status === 'Em Manutenção' && <Wrench size={14} color="#f87171" className="animate-pulse" />}
                                        </div>

                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 500, lineHeight: 1.2, marginBottom: '0.25rem' }}>{est.nome}</h4>
                                        <p style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '1rem' }}>{est.sub_area}</p>

                                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                            <div>
                                                <p style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>SLA / Ciclo</p>
                                                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{est.tempo_ciclo} min</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>Tag Sensor</p>
                                                <p style={{ fontSize: '0.7rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px', display: 'inline-block' }}>{est.tag_rfid}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {/* SECTÃO 3: MODO GRAFO (Visualização Linear Simplificada) */}
            {viewMode === 'grafos' && (
                <div className="glass-panel p-8 flex flex-col items-center justify-center text-center opacity-70 border-dashed border-2 border-[var(--primary)]" style={{ minHeight: '400px' }}>
                    <Network size={48} color="var(--primary)" className="mb-4" />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Árvore Lógica de Dependências</h2>
                    <p className="max-w-2xl text-center">
                        O Grafo Dirigido permite visualizar o fluxo de montagem. (Ex: A Coberta e o Casco curam em estações paralelas e convergem na estação de Casamento).
                    </p>
                    <div className="flex items-center gap-4 mt-8 opacity-50">
                        <div className="glass-panel p-4 w-32 text-sm">Estação Pré</div>
                        <ArrowRight size={24} />
                        <div className="glass-panel p-4 w-32 border-[var(--accent)] text-sm">Estação Central</div>
                        <ArrowRight size={24} />
                        <div className="glass-panel p-4 w-32 text-sm">Estação Pós</div>
                    </div>
                </div>
            )}
        </div>
    );
}

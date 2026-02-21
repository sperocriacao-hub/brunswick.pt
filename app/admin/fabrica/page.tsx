"use client";

import React, { useState } from 'react';
import { Network, Activity, Wrench, Settings, Plus, ArrowRight, TableProperties } from 'lucide-react';

// ==========================================
// TIPOS MOCKADOS ESPELHANDO SQL 0002 e 0003
// ==========================================
type EstacaoStatus = 'Disponível' | 'Em Manutenção' | 'Inativa';

type AreaFabrica = {
    id: string;
    nome: string;
    ordem_sequencial: number;
    cor_destaque: string;
}

type LinhaProdução = {
    id: string;
    letra: string;
    descricao: string;
    capacidade_diaria: number;
};

type Estacao = {
    id: string;
    nome: string;
    area_id: string; // Foreign Key para AreaFabrica
    linha_id: string; // A Linha Física on está fisicamente (Swimlane)
    status: EstacaoStatus;
    capacidade: number;
    tempo_ciclo: number; // Em minutos
    tag_rfid: string;
};

// ==========================================
// DADOS MOCK (SIMULANDO BASE DE DADOS 0003)
// ==========================================
const MOCKED_AREAS: AreaFabrica[] = [
    { id: 'area-1', nome: 'Laminação', ordem_sequencial: 1, cor_destaque: '#3b82f6' },
    { id: 'area-2', nome: 'Corte', ordem_sequencial: 2, cor_destaque: '#64748b' },
    { id: 'area-3', nome: 'Reparação', ordem_sequencial: 3, cor_destaque: '#f59e0b' },
    { id: 'area-4', nome: 'Pré-montagem', ordem_sequencial: 4, cor_destaque: '#8b5cf6' },
    { id: 'area-5', nome: 'Montagem', ordem_sequencial: 5, cor_destaque: '#10b981' },
    { id: 'area-6', nome: 'Carpintaria (Satélite)', ordem_sequencial: 6, cor_destaque: '#84cc16' },
    { id: 'area-7', nome: 'Estofos (Satélite)', ordem_sequencial: 7, cor_destaque: '#ec4899' },
];

const MOCKED_LINHAS: LinhaProdução[] = [
    { id: 'linha-a', letra: 'A', descricao: 'Cruisers & Yachts', capacidade_diaria: 2 },
    { id: 'linha-b', letra: 'B', descricao: 'Outboards Comerciais', capacidade_diaria: 8 },
];

const MOCKED_ESTACOES: Estacao[] = [
    // --- ESTAÇÕES DA LINHA A ---
    { id: 'est-a1', nome: 'Molde Casco', area_id: 'area-1', linha_id: 'linha-a', status: 'Disponível', capacidade: 1, tempo_ciclo: 120, tag_rfid: 'RFID-A1' },
    { id: 'est-a2', nome: 'Trilho Corte CNC', area_id: 'area-2', linha_id: 'linha-a', status: 'Disponível', capacidade: 1, tempo_ciclo: 45, tag_rfid: 'RFID-A2' },
    { id: 'est-a3', nome: 'Cabine Gelcoat', area_id: 'area-3', linha_id: 'linha-a', status: 'Em Manutenção', capacidade: 1, tempo_ciclo: 90, tag_rfid: 'RFID-A3' },
    { id: 'est-a4', nome: 'Aparelhagem Convés', area_id: 'area-4', linha_id: 'linha-a', status: 'Disponível', capacidade: 1, tempo_ciclo: 180, tag_rfid: 'RFID-A4' },
    { id: 'est-a5', nome: 'Casamento Motor', area_id: 'area-5', linha_id: 'linha-a', status: 'Disponível', capacidade: 1, tempo_ciclo: 240, tag_rfid: 'RFID-A5' },

    // --- ESTAÇÕES DA LINHA B ---
    { id: 'est-b1', nome: 'Molde Injectado', area_id: 'area-1', linha_id: 'linha-b', status: 'Disponível', capacidade: 3, tempo_ciclo: 60, tag_rfid: 'RFID-B1' },
    { id: 'est-b4', nome: 'Eletrónica Consola', area_id: 'area-4', linha_id: 'linha-b', status: 'Inativa', capacidade: 2, tempo_ciclo: 90, tag_rfid: 'RFID-B4' },

    // --- ESTAÇÕES SATÉLITES (Sem Linha Fixa ou Multi-Linha) ---
    // Atribuímos uma pseudo-linha "Satélite" para as organizar na grade, ou então partilham as mesmas peças.
    { id: 'est-s1', nome: 'Bancada Teca', area_id: 'area-6', linha_id: 'linha-a', status: 'Disponível', capacidade: 5, tempo_ciclo: 120, tag_rfid: 'RFID-C1' },
    { id: 'est-s2', nome: 'Corte Tecido', area_id: 'area-7', linha_id: 'linha-b', status: 'Disponível', capacidade: 10, tempo_ciclo: 30, tag_rfid: 'RFID-S1' },
];

export default function FabricaLayoutPage() {
    const [viewMode, setViewMode] = useState<'matriz' | 'grafos'>('matriz');

    // Ordenar as colunas do quadro pelas áreas configuradas em Base de dados `ordem_sequencial`
    const sortedAreas = [...MOCKED_AREAS].sort((a, b) => a.ordem_sequencial - b.ordem_sequencial);

    return (
        <div className="container mt-8 animate-fade-in dashboard-layout" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="brand-title" style={{ marginBottom: 0 }}>Estrutura de Fábrica [2D]</h1>
                    <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "0.25rem" }}>
                        Monitorize o Shopfloor numa Matriz (Linhas vs Áreas).
                    </p>
                </div>
                <div className="flex gap-4">
                    <button className="btn btn-outline" onClick={() => setViewMode(viewMode === 'matriz' ? 'grafos' : 'matriz')}>
                        {viewMode === 'matriz' ? <Network size={18} style={{ marginRight: '8px' }} /> : <TableProperties size={18} style={{ marginRight: '8px' }} />}
                        {viewMode === 'matriz' ? 'Modo Grafo Lógico (Beta)' : 'Matriz Kanban 2D'}
                    </button>
                    <button className="btn btn-primary">
                        <Settings size={18} style={{ marginRight: '8px' }} />
                        Configurar Áreas
                    </button>
                    <button className="btn btn-primary" style={{ background: 'var(--accent)' }}>
                        <Plus size={18} style={{ marginRight: '8px' }} />
                        Nova Estação
                    </button>
                </div>
            </header>

            {/* SECTÃO 1: O CHÃO DE FÁBRICA (MATRIZ KANBAN 2D - SWIMLANES) */}
            {viewMode === 'matriz' && (
                <div className="kanban-matrix overflow-x-auto pb-8" style={{ paddingBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', flexDirection: 'column', minWidth: '100%' }}>

                        {/* HEADER DAS COLUNAS (As Áreas Configuráveis: Laminação, Corte, Reparação...) */}
                        <div className="flex" style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ width: '250px', flexShrink: 0, padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                <h3 style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>Interseção Operacional</h3>
                            </div>
                            {sortedAreas.map(area => (
                                <div key={area.id} style={{ width: '320px', flexShrink: 0, padding: '1rem', borderRight: '1px dashed rgba(255,255,255,0.05)' }}>
                                    <div className="flex items-center gap-2">
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: area.cor_destaque }}></div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{area.nome}</h3>
                                    </div>
                                    <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '4px' }}>Pos. {area.ordem_sequencial}</p>
                                </div>
                            ))}
                        </div>

                        {/* BODY DAS SWIMLANES (As Linhas A, B, C...) */}
                        {MOCKED_LINHAS.map(linha => (
                            <div key={linha.id} className="flex group" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>

                                {/* CABEÇALHO DA FILA (Identificação da Linha) */}
                                <div style={{ width: '250px', flexShrink: 0, padding: '1.5rem 1rem', borderRight: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Activity size={24} /> Linha {linha.letra}
                                    </h2>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '1rem' }}>{linha.descricao}</p>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Capacidade: <strong>{linha.capacidade_diaria}/dia</strong></div>
                                </div>

                                {/* CÉLULAS DA MATRIZ (Zonas Onde Estão as Estações Físicas desta Linha) */}
                                {sortedAreas.map(area => {
                                    // Filtrar as estações que pertencem a ESTA LINHA e cruzam com ESTA ÁREA
                                    const estacoesNestaCelula = MOCKED_ESTACOES.filter(e => e.linha_id === linha.id && e.area_id === area.id);

                                    return (
                                        <div key={`${linha.id}-${area.id}`} style={{ width: '320px', flexShrink: 0, padding: '1rem', borderRight: '1px dashed rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                            {estacoesNestaCelula.length === 0 ? (
                                                <div style={{ height: '100%', width: '100%', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                                                    <p style={{ fontSize: '0.7rem' }}>S/ Estação Alocada</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-4">
                                                    {estacoesNestaCelula.map(est => (
                                                        <div key={est.id} className="glass-panel p-4 outline outline-1 outline-[rgba(255,255,255,0.05)] hover:outline-[var(--primary)] hover:-translate-y-1 transition-all" style={{
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                            background: est.status === 'Em Manutenção' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(30, 41, 59, 1) 100%)' :
                                                                est.status === 'Inativa' ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(15, 23, 42, 1) 100%)' : undefined
                                                        }}>
                                                            {/* Line Accent Color da Area */}
                                                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: area.cor_destaque }}></div>

                                                            {/* Status Indicator */}
                                                            <div className="flex justify-between items-start mb-3 pl-2">
                                                                <span style={{
                                                                    fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: '12px',
                                                                    background: est.status === 'Disponível' ? 'rgba(34, 197, 94, 0.2)' : est.status === 'Em Manutenção' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)',
                                                                    color: est.status === 'Disponível' ? '#4ade80' : est.status === 'Em Manutenção' ? '#f87171' : '#94a3b8'
                                                                }}>
                                                                    {est.status.toUpperCase()}
                                                                </span>
                                                                {est.status === 'Em Manutenção' && <Wrench size={14} color="#f87171" className="animate-pulse" />}
                                                            </div>

                                                            <h4 style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2, marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>{est.nome}</h4>

                                                            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 pl-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                                <div>
                                                                    <p style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>Ciclo Max</p>
                                                                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{est.tempo_ciclo} min</p>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <p style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>ESP32 IP</p>
                                                                    <p style={{ fontSize: '0.65rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px', display: 'inline-block' }}>{est.tag_rfid}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECTÃO 2: MODO GRAFO (Visualização Linear/Dirigida Simplificada) */}
            {viewMode === 'grafos' && (
                <div className="glass-panel p-8 flex flex-col items-center justify-center text-center opacity-70 border-dashed border-2 border-[var(--primary)]" style={{ minHeight: '400px' }}>
                    <Network size={48} color="var(--primary)" className="mb-4" />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Árvore Lógica de Dependências</h2>
                    <p className="max-w-2xl text-center">
                        O Grafo Dirigido permite visualizar o fluxo de montagem em múltiplas frentes (Ex: Estufa e Satélites alimentam em pararelo o Casamento do Motor).
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

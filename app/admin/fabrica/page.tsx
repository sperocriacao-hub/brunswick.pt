"use client";

import React, { useState, useEffect } from 'react';
import { Network, Activity, Wrench, Settings, Plus, TableProperties, X, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

// ==========================================
// TIPOS EXATOS DE SUPABASE (0002 e 0003)
// ==========================================
type EstacaoStatus = 'Disponível' | 'Em Manutenção' | 'Inativa';

type AreaFabrica = {
    id: string;
    nome_area: string;
    ordem_sequencial: number;
    cor_destaque: string;
}

type LinhaProducao = {
    id: string;
    letra_linha: string;
    descricao_linha: string;
    capacidade_diaria: number;
};

type Estacao = {
    id: string;
    nome_estacao: string;
    area_id: string | null;
    linha_id: string | null;
    status: EstacaoStatus;
    capacidade_producao: number;
    tempo_ciclo_padrao: number;
    tag_rfid_estacao: string;
};

export default function FabricaLayoutPage() {
    const supabase = createClient();
    const [viewMode, setViewMode] = useState<'matriz' | 'grafos'>('matriz');

    // Estados de Dados da BD
    const [areas, setAreas] = useState<AreaFabrica[]>([]);
    const [linhas, setLinhas] = useState<LinhaProducao[]>([]);
    const [estacoes, setEstacoes] = useState<Estacao[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estados dos Modais
    const [isLinhaModalOpen, setIsLinhaModalOpen] = useState(false);
    const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
    const [isEstacaoModalOpen, setIsEstacaoModalOpen] = useState(false);

    // Formulários
    const [formLinha, setFormLinha] = useState({ letra: '', descricao: '', capacidade: 1 });
    const [formArea, setFormArea] = useState({ nome: '', ordem: 1, cor: '#3b82f6' });
    const [formEstacao, setFormEstacao] = useState({ nome: '', area_id: '', linha_id: '', ciclo: 60, capacidade: 1, rfid: '' });

    // Fetch Inicial
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [resAreas, resLinhas, resEstacoes] = await Promise.all([
                supabase.from('areas_fabrica').select('*').order('ordem_sequencial', { ascending: true }),
                supabase.from('linhas_producao').select('*').order('letra_linha', { ascending: true }),
                supabase.from('estacoes').select('*')
            ]);

            if (resAreas.data) setAreas(resAreas.data as AreaFabrica[]);
            if (resLinhas.data) setLinhas(resLinhas.data as LinhaProducao[]);
            if (resEstacoes.data) setEstacoes(resEstacoes.data as Estacao[]);
        } catch (error) {
            console.error("Erro ao carregar estrutura de fábrica:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // AÇÕES DE CRIAÇÃO
    const handleCriarLinha = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('linhas_producao').insert([{
            letra_linha: formLinha.letra.toUpperCase(),
            descricao_linha: formLinha.descricao,
            capacidade_diaria: formLinha.capacidade
        }]);
        if (!error) {
            setIsLinhaModalOpen(false);
            setFormLinha({ letra: '', descricao: '', capacidade: 1 });
            fetchData();
        } else alert("Erro ao criar Linha: " + error.message);
    };

    const handleCriarArea = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('areas_fabrica').insert([{
            nome_area: formArea.nome,
            ordem_sequencial: formArea.ordem,
            cor_destaque: formArea.cor
        }]);
        if (!error) {
            setIsAreaModalOpen(false);
            setFormArea({ nome: '', ordem: areas.length + 1, cor: '#3b82f6' });
            fetchData();
        } else alert("Erro ao criar Área: " + error.message);
    };

    const handleCriarEstacao = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            nome_estacao: formEstacao.nome,
            area_id: formEstacao.area_id || null,
            linha_id: formEstacao.linha_id || null,
            tempo_ciclo_padrao: formEstacao.ciclo,
            capacidade_producao: formEstacao.capacidade,
            tag_rfid_estacao: formEstacao.rfid,
            status: 'Disponível'
        };

        const { error } = await supabase.from('estacoes').insert([payload]);
        if (!error) {
            setIsEstacaoModalOpen(false);
            setFormEstacao({ nome: '', area_id: '', linha_id: '', ciclo: 60, capacidade: 1, rfid: '' });
            fetchData();
        } else alert("Erro ao criar Estação: " + error.message);
    };


    const sortedAreas = [...areas].sort((a, b) => a.ordem_sequencial - b.ordem_sequencial);

    return (
        <>
            <div className="container mt-8 animate-fade-in dashboard-layout" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                <header className="flex flex-col items-center justify-center mb-10 text-center relative z-10">
                    <div className="mb-6">
                        <h1 className="brand-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>Estrutura de Fábrica [2D]</h1>
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                            Monitorize, crie e configure o Shopfloor numa Matriz Visualmente Dinâmica (Linhas vs Áreas).
                        </p>
                    </div>

                    {/* DOCK PREMIUM DE CONTROLOS */}
                    <div className="dock-premium mb-6">
                        <button className="btn btn-outline" style={{ borderRadius: '999px', padding: '0.5rem 1.25rem' }} onClick={() => setViewMode(viewMode === 'matriz' ? 'grafos' : 'matriz')}>
                            {viewMode === 'matriz' ? <Network size={18} style={{ marginRight: '8px' }} /> : <TableProperties size={18} style={{ marginRight: '8px' }} />}
                            {viewMode === 'matriz' ? 'Modo Grafo Lógico' : 'Matriz Kanban 2D'}
                        </button>
                        <div className="w-px h-10 bg-white/10 mx-2 self-center"></div>
                        <button className="btn btn-primary" style={{ borderRadius: '999px', padding: '0.5rem 1.25rem' }} onClick={() => setIsAreaModalOpen(true)}>
                            <Settings size={18} style={{ marginRight: '8px' }} />
                            Configurar Áreas
                        </button>
                        <button className="btn btn-primary" style={{ borderRadius: '999px', padding: '0.5rem 1.25rem' }} onClick={() => setIsLinhaModalOpen(true)}>
                            <Activity size={18} style={{ marginRight: '8px' }} />
                            Nova Linha
                        </button>
                        <button className="btn btn-primary" style={{ background: 'var(--accent)', borderRadius: '999px', padding: '0.5rem 1.25rem', boxShadow: '0 0 15px var(--accent)' }} onClick={() => setIsEstacaoModalOpen(true)}>
                            <Plus size={18} style={{ marginRight: '8px' }} />
                            Nova Estação
                        </button>
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20 opacity-50">
                        <Loader2 size={48} className="animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* SECTÃO 1: O CHÃO DE FÁBRICA (MATRIZ KANBAN 2D - SWIMLANES) */}
                        {viewMode === 'matriz' && (
                            <div className="flex flex-wrap gap-8 items-start justify-center pb-8" style={{ paddingBottom: '2rem' }}>
                                {sortedAreas.length === 0 && (
                                    <div className="p-8 opacity-50 text-center w-full">Nenhuma Área Configurável Criadada. Configure Áreas para visualizar o Shopfloor.</div>
                                )}

                                {sortedAreas.map(area => {
                                    const estacoesArea = estacoes.filter(e => e.area_id === area.id);

                                    return (
                                        <div key={area.id} className="glass-panel" style={{ width: '350px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                                            {/* Cabeçalho da Área */}
                                            <div className="p-4 flex items-center justify-between" style={{ borderBottom: `2px solid ${area.cor_destaque || 'var(--primary)'}`, background: 'rgba(0,0,0,0.2)' }}>
                                                <div className="flex items-center gap-2">
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: area.cor_destaque }}></div>
                                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{area.nome_area}</h3>
                                                </div>
                                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Pos. {area.ordem_sequencial}</span>
                                            </div>

                                            {/* Corpo da Área (Estações) */}
                                            <div className="p-4 flex flex-col gap-4" style={{ backgroundColor: 'rgba(0,0,0,0.1)', minHeight: '200px' }}>
                                                {estacoesArea.length === 0 ? (
                                                    <div className="flex-1 flex items-center justify-center opacity-30 border border-dashed border-white/20 rounded-lg p-4 text-center">
                                                        <p style={{ fontSize: '0.8rem' }}>Sem estações cadastradas nesta zona.</p>
                                                    </div>
                                                ) : (
                                                    estacoesArea.map(est => {
                                                        const linhaDaEstacao = linhas.find(l => l.id === est.linha_id);

                                                        return (
                                                            <div key={est.id} className="glass-panel p-4 outline outline-1 outline-[rgba(255,255,255,0.05)] hover:outline-[var(--primary)] transition-all" style={{
                                                                position: 'relative',
                                                                overflow: 'hidden',
                                                                background: est.status === 'Em Manutenção' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(30, 41, 59, 1) 100%)' :
                                                                    est.status === 'Inativa' ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(15, 23, 42, 1) 100%)' : undefined
                                                            }}>
                                                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: area.cor_destaque }}></div>

                                                                {/* Topo do Cartão: Status e Linha */}
                                                                <div className="flex justify-between items-start mb-3 pl-2">
                                                                    <span style={{
                                                                        fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: '12px',
                                                                        background: est.status === 'Disponível' ? 'rgba(34, 197, 94, 0.2)' : est.status === 'Em Manutenção' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)',
                                                                        color: est.status === 'Disponível' ? '#4ade80' : est.status === 'Em Manutenção' ? '#f87171' : '#94a3b8'
                                                                    }}>
                                                                        {est.status.toUpperCase()}
                                                                    </span>
                                                                    <div className="flex items-center gap-2">
                                                                        {linhaDaEstacao && (
                                                                            <span style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                                                                Linha {linhaDaEstacao.letra_linha}
                                                                            </span>
                                                                        )}
                                                                        {est.status === 'Em Manutenção' && <Wrench size={14} color="#f87171" className="animate-pulse" />}
                                                                    </div>
                                                                </div>

                                                                {/* Nome da Célula/Estação */}
                                                                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.2, marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>{est.nome_estacao}</h4>

                                                                {/* Footer do Cartão: Dados */}
                                                                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 pl-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                                    <div>
                                                                        <p style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>SLA (Ciclo)</p>
                                                                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{est.tempo_ciclo_padrao} min</p>
                                                                    </div>
                                                                    <div style={{ textAlign: 'right' }}>
                                                                        <p style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>ESP32 Tag</p>
                                                                        <p style={{ fontSize: '0.65rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px', display: 'inline-block' }}>{est.tag_rfid_estacao || 'N/A'}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {viewMode === 'grafos' && (
                            <div className="glass-panel p-8 flex flex-col items-center justify-center text-center opacity-70 border-dashed border-2 border-[var(--primary)]" style={{ minHeight: '400px' }}>
                                <Network size={48} color="var(--primary)" className="mb-4" />
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Visão de Dependências (Estações)</h2>
                                <p className="max-w-2xl text-center">Futura visualização do motor N:M (Predecessores e Sucessores) ativando lógica de Grafos complexos.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ======================================================= */}
            {/* MODAIS FORA DA ESTRUTURA KANBAN (EVITAR SCROLL TRAPPING) */}
            {/* ======================================================= */}

            {/* MODAL: NOVA LINHA */}
            {
                isLinhaModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">Criar Linha Produtiva</h3>
                                <button onClick={() => setIsLinhaModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} className="opacity-70" /></button>
                            </div>
                            <form onSubmit={handleCriarLinha} className="flex flex-col gap-4">
                                <div className="form-group">
                                    <label>Letra da Linha (ex: A, B, C)</label>
                                    <input type="text" className="form-control" required maxLength={4} value={formLinha.letra} onChange={(e) => setFormLinha({ ...formLinha, letra: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Descrição/Vocação da Linha</label>
                                    <input type="text" className="form-control" required value={formLinha.descricao} onChange={(e) => setFormLinha({ ...formLinha, descricao: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Capacidade (Barcos/Dia)</label>
                                    <input type="number" className="form-control" required min={1} value={formLinha.capacidade} onChange={(e) => setFormLinha({ ...formLinha, capacidade: parseInt(e.target.value) })} />
                                </div>
                                <button type="submit" className="btn btn-primary mt-4 py-3 shadow-lg shadow-blue-500/20">Gravar Definição</button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* MODAL: NOVA ÁREA KANBAN */}
            {
                isAreaModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">Criar Zona de Fabrico</h3>
                                <button onClick={() => setIsAreaModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} className="opacity-70" /></button>
                            </div>
                            <form onSubmit={handleCriarArea} className="flex flex-col gap-4">
                                <div className="form-group">
                                    <label>Nome da Zona (ex: Laminação)</label>
                                    <input type="text" className="form-control" required value={formArea.nome} onChange={(e) => setFormArea({ ...formArea, nome: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label>Ordem Sequencial</label>
                                        <input type="number" className="form-control" required min={1} value={formArea.ordem} onChange={(e) => setFormArea({ ...formArea, ordem: parseInt(e.target.value) })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Cor Indentificativa</label>
                                        <input type="color" className="form-control h-[42px] p-1 cursor-pointer" value={formArea.cor} onChange={(e) => setFormArea({ ...formArea, cor: e.target.value })} />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary mt-4 py-3 shadow-lg shadow-blue-500/20">Adicionar ao Kanban</button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* MODAL: NOVA ESTAÇÃO FÍSICA */}
            {
                isEstacaoModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ borderColor: 'var(--accent)' }}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-[var(--accent)] bg-clip-text text-transparent">Registrar Máquina/Estação</h3>
                                <button onClick={() => setIsEstacaoModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} className="opacity-70" /></button>
                            </div>
                            <form onSubmit={handleCriarEstacao} className="flex flex-col gap-4">
                                <div className="form-group">
                                    <label>Nome Operacional</label>
                                    <input type="text" className="form-control" required value={formEstacao.nome} onChange={(e) => setFormEstacao({ ...formEstacao, nome: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Área Mãe (Coluna do Kanban)</label>
                                    <select className="form-control" required value={formEstacao.area_id} onChange={(e) => setFormEstacao({ ...formEstacao, area_id: e.target.value })}>
                                        <option value="" disabled>Selecione uma Área</option>
                                        {sortedAreas.map(a => <option key={a.id} value={a.id}>{a.nome_area}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Linha Atribuída (Opcional - Swimlane)</label>
                                    <select className="form-control" value={formEstacao.linha_id} onChange={(e) => setFormEstacao({ ...formEstacao, linha_id: e.target.value })}>
                                        <option value="">Todas (Hub Satélite que Atravessa Todas As Linhas)</option>
                                        {linhas.map(l => <option key={l.id} value={l.id}>Linha {l.letra_linha}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label>Ciclo Standard (min)</label>
                                        <input type="number" className="form-control" required value={formEstacao.ciclo} onChange={(e) => setFormEstacao({ ...formEstacao, ciclo: parseInt(e.target.value) })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Tag ESP32 RFID</label>
                                        <input type="text" className="form-control font-mono text-sm" required placeholder="Ex: EST-103" value={formEstacao.rfid} onChange={(e) => setFormEstacao({ ...formEstacao, rfid: e.target.value })} />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary mt-4 py-3 shadow-lg shadow-[var(--accent)]/20" style={{ background: 'var(--accent)' }}>Montar Estação</button>
                            </form>
                        </div>
                    </div>
                )
            }
        </>
    );
}

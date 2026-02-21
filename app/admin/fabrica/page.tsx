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
            <div className="animate-fade-in" style={{ maxWidth: '100%', padding: '1rem', overflowX: 'hidden' }}>
                <header style={{
                    position: 'sticky', top: 0, zIndex: 50, display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'center', gap: '1rem',
                    background: 'rgba(15, 23, 42, 0.95)', padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                    margin: '-1rem -1rem 2rem -1rem', width: 'calc(100% + 2rem)', overflowX: 'auto', whiteSpace: 'nowrap'
                }}>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)', flexShrink: 0 }}>
                        Estrutura de Fábrica [2D]
                    </h1>

                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 4px', flexShrink: 0 }}></div>

                    <button className="btn btn-primary" style={{ borderRadius: '4px', padding: '0.4rem 1rem', fontSize: '0.85rem', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }} onClick={() => setIsAreaModalOpen(true)}>
                        <Settings size={14} style={{ marginRight: '6px' }} /> Configurar Áreas
                    </button>
                    <button className="btn btn-primary" style={{ borderRadius: '4px', padding: '0.4rem 1rem', fontSize: '0.85rem', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }} onClick={() => setIsLinhaModalOpen(true)}>
                        <Activity size={14} style={{ marginRight: '6px' }} /> Nova Linha
                    </button>
                    <button className="btn btn-primary" style={{ background: 'var(--accent)', borderRadius: '4px', padding: '0.4rem 1rem', fontSize: '0.85rem', boxShadow: '0 0 10px var(--accent)', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }} onClick={() => setIsEstacaoModalOpen(true)}>
                        <Plus size={14} style={{ marginRight: '6px' }} /> Nova Estação
                    </button>
                    <button className="btn btn-outline" style={{ borderRadius: '4px', padding: '0.4rem 1rem', fontSize: '0.85rem', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }} onClick={() => setViewMode(viewMode === 'matriz' ? 'grafos' : 'matriz')}>
                        {viewMode === 'matriz' ? <Network size={14} style={{ marginRight: '6px' }} /> : <TableProperties size={14} style={{ marginRight: '6px' }} />}
                        {viewMode === 'matriz' ? 'Modo Grafo Lógico' : 'Matriz Kanban 2D'}
                    </button>
                </header>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20 opacity-50">
                        <Loader2 size={48} className="animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* SECTÃO 1: O CHÃO DE FÁBRICA (MATRIZ KANBAN 2D - SWIMLANES PROTEGIDAS) */}
                        {viewMode === 'matriz' && (
                            <div style={{ maxWidth: '100%', overflowX: 'auto', paddingBottom: '2rem' }}>
                                <div style={{ display: 'inline-flex', flexDirection: 'column', minWidth: '100%' }}>

                                    {/* HEADER DAS COLUNAS (Áreas) */}
                                    <div style={{ display: 'flex', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ width: '250px', flexShrink: 0, padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)', position: 'sticky', left: 0, zIndex: 10, background: 'var(--background-base)' }}>
                                            <h3 style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>Interseção Operacional</h3>
                                        </div>
                                        {sortedAreas.map(area => (
                                            <div key={area.id} style={{ width: '320px', flexShrink: 0, padding: '1rem', borderRight: '1px dashed rgba(255,255,255,0.05)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: area.cor_destaque }}></div>
                                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{area.nome_area}</h3>
                                                </div>
                                                <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '4px' }}>Pos. {area.ordem_sequencial}</p>
                                            </div>
                                        ))}
                                        {sortedAreas.length === 0 && <div className="p-4 opacity-50" style={{ flex: 1 }}>Nenhuma Área Configurável Criadada. Crie uma para abrir Colunas no Kanban.</div>}
                                    </div>

                                    {/* BODY DAS SWIMLANES (Linhas) */}
                                    {linhas.map(linha => (
                                        <div key={linha.id} className="group" style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            {/* Cabeçalho da Linha Fixo à Esquerda */}
                                            <div style={{ width: '250px', flexShrink: 0, padding: '1.5rem 1rem', borderRight: '1px solid rgba(255,255,255,0.1)', background: 'var(--background-panel)', position: 'sticky', left: 0, zIndex: 5, backdropFilter: 'blur(10px)' }}>
                                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Activity size={24} /> Linha {linha.letra_linha}
                                                </h2>
                                                <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '1rem' }}>{linha.descricao_linha}</p>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Capacidade: <strong>{linha.capacidade_diaria}</strong> / dia</div>
                                            </div>

                                            {sortedAreas.map(area => {
                                                const estacoesNestaCelula = estacoes.filter(e => e.area_id === area.id && (e.linha_id === linha.id || !e.linha_id));

                                                return (
                                                    <div key={`${linha.id}-${area.id}`} style={{ width: '320px', flexShrink: 0, padding: '1rem', borderRight: '1px dashed rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                                        {estacoesNestaCelula.length === 0 ? (
                                                            <div style={{ height: '100%', width: '100%', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                                                                <p style={{ fontSize: '0.7rem' }}>S/ Estação Alocada</p>
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                                {estacoesNestaCelula.map(est => (
                                                                    <div key={est.id} className="glass-panel" style={{
                                                                        padding: '1rem', position: 'relative', overflow: 'hidden',
                                                                        background: est.status === 'Em Manutenção' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(30, 41, 59, 1) 100%)' :
                                                                            est.status === 'Inativa' ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(15, 23, 42, 1) 100%)' : undefined
                                                                    }}>
                                                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: area.cor_destaque }}></div>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
                                                                            <span style={{
                                                                                fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: '12px',
                                                                                background: est.status === 'Disponível' ? 'rgba(34, 197, 94, 0.2)' : est.status === 'Em Manutenção' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)',
                                                                                color: est.status === 'Disponível' ? '#4ade80' : est.status === 'Em Manutenção' ? '#f87171' : '#94a3b8'
                                                                            }}>
                                                                                {est.status.toUpperCase()}
                                                                            </span>
                                                                            {est.status === 'Em Manutenção' && <Wrench size={14} color="#f87171" className="animate-pulse" />}
                                                                        </div>
                                                                        <h4 style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2, marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>{est.nome_estacao}</h4>
                                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.5rem' }}>
                                                                            <div>
                                                                                <p style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>SLA</p>
                                                                                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{est.tempo_ciclo_padrao} min</p>
                                                                            </div>
                                                                            <div style={{ textAlign: 'right' }}>
                                                                                <p style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>ESP32</p>
                                                                                <p style={{ fontSize: '0.65rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px', display: 'inline-block' }}>{est.tag_rfid_estacao || 'N/A'}</p>
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
                                    {linhas.length === 0 && <div className="p-8 opacity-50 text-center">Nenhuma Linha Física Criada. O Chão de fábrica está vazio.</div>}
                                </div>
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

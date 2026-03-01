"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    BackgroundVariant,
    MarkerType,
    useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

interface Estacao {
    id: string;
    nome_estacao: string;
    area_id: string | null;
    linha_id: string | null;
    status: string;
    capacidade_producao: number;
    tempo_ciclo_padrao: number;
    tag_rfid_estacao: string;
}

interface AreaFabrica {
    id: string;
    nome_area: string;
    ordem_sequencial: number;
    cor_destaque: string;
}

interface LinhaProducao {
    id: string;
    letra_linha: string;
    descricao_linha: string;
    capacidade_diaria: number;
}

// Representa a Extensão DB da Ligação (Edge)
interface SequenciaDb {
    id: string;
    predecessora_id: string;
    sucessora_id: string;
    requer_kitting: boolean;
    kitting_offset_horas: number;
}

interface GrafoProps {
    estacoes: Estacao[];
    areas: AreaFabrica[];
    linhas: LinhaProducao[];
}

export default function GrafoEstacoes({ estacoes, areas, linhas }: GrafoProps) {
    const supabase = createClient();
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [isLoadingLinks, setIsLoadingLinks] = useState(true);

    // Modal de Edição da Aresta (Edge / Sequência)
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [edgeConfig, setEdgeConfig] = useState<SequenciaDb | null>(null);
    const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);

    // Inicializar Nós (Auto-Layout baseado em Áreas e Linhas)
    useEffect(() => {
        const sortedAreas = [...areas].sort((a, b) => a.ordem_sequencial - b.ordem_sequencial);

        const initialNodes: Node[] = estacoes.map((estacao) => {
            // Posição X (Coluna da Área)
            const areaIdx = sortedAreas.findIndex(a => a.id === estacao.area_id);
            const posX = areaIdx >= 0 ? areaIdx * 350 + 50 : Math.random() * 300;

            // Posição Y (Swimlane da Linha)
            const linhaIdx = linhas.findIndex(l => l.id === estacao.linha_id);
            const posY = linhaIdx >= 0 ? linhaIdx * 150 + 50 : Math.random() * 200 + 400;

            const areaInfo = areas.find(a => a.id === estacao.area_id);
            const color = areaInfo?.cor_destaque || '#3b82f6';

            return {
                id: estacao.id,
                position: { x: posX, y: posY },
                data: {
                    label: (
                        <div style={{ padding: '4px', textAlign: 'center' }}>
                            <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>{estacao.nome_estacao}</strong>
                            <div style={{ fontSize: '10px', opacity: 0.8, background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px' }}>SLA: {estacao.tempo_ciclo_padrao}m</div>
                        </div>
                    )
                },
                style: {
                    background: 'rgba(15, 23, 42, 0.95)',
                    color: 'white',
                    border: `2px solid ${color}`,
                    borderRadius: '8px',
                    padding: '6px',
                    width: 160,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
                },
            };
        });

        setNodes(initialNodes);
    }, [estacoes, areas, linhas, setNodes]);

    // Carregar Ligações Relacionais N:M (estacoes_sequencia) da Base de Dados
    useEffect(() => {
        const fetchEdges = async () => {
            setIsLoadingLinks(true);
            const { data, error } = await supabase.from('estacoes_sequencia').select('*');

            if (error) {
                console.error("Erro ao carregar ligações", error);
                setIsLoadingLinks(false);
                return;
            }

            if (data) {
                const initialEdges: Edge[] = data.map((link) => ({
                    id: link.id,
                    source: link.predecessora_id,
                    target: link.sucessora_id,
                    animated: true,
                    style: { stroke: link.requer_kitting ? '#f59e0b' : 'var(--primary)', strokeWidth: link.requer_kitting ? 3 : 2 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: link.requer_kitting ? '#f59e0b' : 'var(--primary)',
                    },
                    data: {
                        dbData: link
                    }
                }));
                setEdges(initialEdges);
            }
            setIsLoadingLinks(false);
        };

        fetchEdges();
    }, [supabase, setEdges]);

    // Callback de Interligação via Mouse (Arrastar e Largar setas)
    const onConnect = useCallback(
        async (params: Connection) => {
            if (!params.source || !params.target) return;
            if (params.source === params.target) {
                alert("Não é possível ligar uma estação a si própria.");
                return;
            }

            // Executa INSERT na base de dados e devolve o registo via .select().single()
            const { data, error } = await supabase
                .from('estacoes_sequencia')
                .insert([{
                    predecessora_id: params.source,
                    sucessora_id: params.target,
                    requer_kitting: false,
                    kitting_offset_horas: 0
                }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    alert("Aviso: Estas duas estações já se encontram ligadas.");
                } else {
                    alert("Erro ao gravar fluxo: " + error.message);
                }
                return;
            }

            // Atualiza o Ecrã aclamando visualmente o Edge validado pela BD
            const newEdge: Edge = {
                id: data.id,
                source: data.predecessora_id,
                target: data.sucessora_id,
                animated: true,
                style: { stroke: 'var(--primary)', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)' },
                data: { dbData: data }
            };
            setEdges((eds) => addEdge(newEdge, eds));
        },
        [setEdges, supabase],
    );

    // Callback de Remoção (Backspace de Link)
    const onEdgesDelete = useCallback(
        async (edgesToDelete: Edge[]) => {
            const idsToDelete = edgesToDelete.map(e => e.id);
            if (idsToDelete.length === 0) return;

            const { error } = await supabase
                .from('estacoes_sequencia')
                .delete()
                .in('id', idsToDelete);

            if (error) {
                alert("Falha Crítica ao remover ligação da BD: " + error.message);
            }
        },
        [supabase],
    );

    // Evento de Clique numa Ligação (Aresta)
    const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
        const dbData = edge.data?.dbData as SequenciaDb;
        if (dbData) {
            setSelectedEdgeId(dbData.id);
            setEdgeConfig(dbData);
            setIsEdgeModalOpen(true);
        }
    }, []);

    // Salvar Configuração do Edge
    const handleSaveEdgeConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!edgeConfig) return;

        const { error } = await supabase
            .from('estacoes_sequencia')
            .update({
                requer_kitting: edgeConfig.requer_kitting,
                kitting_offset_horas: edgeConfig.kitting_offset_horas
            })
            .eq('id', edgeConfig.id);

        if (error) {
            alert("Erro ao salvar regras logísticas: " + error.message);
        } else {
            // Atualiza localmente o estilo do edge
            setEdges((eds) => eds.map(edge => {
                if (edge.id === selectedEdgeId) {
                    return {
                        ...edge,
                        style: { stroke: edgeConfig.requer_kitting ? '#f59e0b' : 'var(--primary)', strokeWidth: edgeConfig.requer_kitting ? 3 : 2 },
                        markerEnd: { type: MarkerType.ArrowClosed, color: edgeConfig.requer_kitting ? '#f59e0b' : 'var(--primary)' },
                        data: { ...edge.data, dbData: edgeConfig }
                    };
                }
                return edge;
            }));
            setIsEdgeModalOpen(false);
            setSelectedEdgeId(null);
            setEdgeConfig(null);
        }
    };

    if (isLoadingLinks) {
        return (
            <div className="flex h-full w-full items-center justify-center" style={{ background: 'var(--background-base)' }}>
                <Loader2 size={48} className="animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgesDelete={onEdgesDelete}
            onEdgeClick={onEdgeClick}
            fitView
            minZoom={0.2}
            maxZoom={2}
            colorMode="dark"
            attributionPosition="bottom-right"
        >
            <MiniMap
                nodeColor={(node) => node.style?.borderColor as string || '#eee'}
                maskColor="rgba(15, 23, 42, 0.7)"
                style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
            />
            <Controls style={{ backgroundColor: 'rgba(30, 41, 59, 1)', fill: 'white', color: 'white' }} />
            <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="rgba(255,255,255,0.15)" />

            {/* Modal de Configuração da Aresta (Edge) */}
            {isEdgeModalOpen && edgeConfig && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white tracking-tight">Regras da Conexão</h3>
                            <button onClick={() => setIsEdgeModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSaveEdgeConfig} className="p-6 space-y-6">

                            <div className="flex flex-col gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <div className="mt-1">
                                        <input
                                            type="checkbox"
                                            checked={edgeConfig.requer_kitting}
                                            onChange={(e) => setEdgeConfig({ ...edgeConfig, requer_kitting: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-200">Requer Fornecimento do Armazém (Kitting)</p>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">Se ativado, ao entrar nesta transição, será gerado automaticamente um pedido no Tablet da Logística.</p>
                                    </div>
                                </label>
                            </div>

                            {edgeConfig.requer_kitting && (
                                <div className="space-y-3 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 animate-in slide-in-from-top-4 fade-in">
                                    <label className="text-sm font-semibold text-amber-500 flex items-center gap-2">
                                        Aviso Prévio (Antecedência em Horas)
                                    </label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="number"
                                            min="0"
                                            value={edgeConfig.kitting_offset_horas}
                                            onChange={(e) => setEdgeConfig({ ...edgeConfig, kitting_offset_horas: parseInt(e.target.value) || 0 })}
                                            className="form-control w-24 text-center font-bold text-lg"
                                        />
                                        <span className="text-sm font-medium text-slate-400">Horas de antecedência face ao SLA desta estação.</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        Se 0, o aviso toca no armazém no exato segundo em que o Barco chega. Se &gt; 0, o armazém é notificado precocemente.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end pt-4 border-t border-slate-800 gap-3">
                                <button type="button" onClick={() => setIsEdgeModalOpen(false)} className="px-4 py-2 rounded-md font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-900/50 transition-all active:scale-95">
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ReactFlow>
    );
}

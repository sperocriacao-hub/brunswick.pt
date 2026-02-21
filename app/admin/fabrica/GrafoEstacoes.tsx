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
    MarkerType
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
                    style: { stroke: 'var(--primary)', strokeWidth: 2 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: 'var(--primary)',
                    },
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
                    sucessora_id: params.target
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
        </ReactFlow>
    );
}

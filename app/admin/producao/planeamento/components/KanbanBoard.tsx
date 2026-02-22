'use client';

import React, { useState } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    DropAnimation,
    defaultDropAnimation,
    DragOverEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { OrdemPlaneamento, atualizarPlaneamentoMultiplo } from '../actions';
import { Loader2, Save } from 'lucide-react';

export const COLUNAS = [
    { id: 'BACKLOG', title: 'Por Agendar' },
    { id: 'SEG', title: 'Segunda-Feira' },
    { id: 'TER', title: 'Terça-Feira' },
    { id: 'QUA', title: 'Quarta-Feira' },
    { id: 'QUI', title: 'Quinta-Feira' },
    { id: 'SEX', title: 'Sexta-Feira' }
];

export default function KanbanBoard({ inicialOrdens }: { inicialOrdens: OrdemPlaneamento[] }) {
    const [ordens, setOrdens] = useState<OrdemPlaneamento[]>(inicialOrdens);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const getItemsByColumn = (colId: string) => ordens.filter(o => o.semana_planeada === colId).sort((a, b) => a.ordem_sequencial_linha - b.ordem_sequencial_linha);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveOrdem = ordens.some(o => o.id === activeId);
        const isOverOrdem = ordens.some(o => o.id === overId);

        if (!isActiveOrdem) return;

        setOrdens((prev) => {
            const activeIndex = prev.findIndex(o => o.id === activeId);
            const overIndex = prev.findIndex(o => o.id === overId);

            // Dropping on another Item
            if (isOverOrdem) {
                const updatedItems = [...prev];
                const newCol = updatedItems[overIndex].semana_planeada;
                updatedItems[activeIndex] = { ...updatedItems[activeIndex], semana_planeada: newCol };
                return arrayMove(updatedItems, activeIndex, overIndex);
            }

            // Dropping on an empty Column
            const isOverColumn = COLUNAS.some(c => c.id === overId);
            if (isOverColumn) {
                const updatedItems = [...prev];
                updatedItems[activeIndex] = { ...updatedItems[activeIndex], semana_planeada: overId as string };
                // move to end implicitly for now 
                return arrayMove(updatedItems, activeIndex, updatedItems.length - 1);
            }

            return prev;
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId !== overId) {
            setOrdens((prev) => {
                const activeIndex = prev.findIndex(o => o.id === activeId);
                const overIndex = prev.findIndex(o => o.id === overId);

                let newOrdens = [...prev];

                if (prev[overIndex]) {
                    newOrdens = arrayMove(newOrdens, activeIndex, overIndex);
                }

                // Renumber all
                colunasMap(newOrdens);
                setUnsavedChanges(true);
                return newOrdens;
            });
        }
    };

    // Recalcula sequenciais
    const colunasMap = (items: OrdemPlaneamento[]) => {
        const grouped: Record<string, OrdemPlaneamento[]> = {};
        COLUNAS.forEach(c => grouped[c.id] = []);

        items.forEach(i => {
            if (grouped[i.semana_planeada || 'BACKLOG']) {
                grouped[i.semana_planeada || 'BACKLOG'].push(i);
            }
        });

        Object.keys(grouped).forEach(col => {
            grouped[col].forEach((item, index) => {
                item.ordem_sequencial_linha = index;
            });
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Apenas envia o delta de ids com a sua coluna e index atual.
        const payload = ordens.map(o => ({
            id: o.id,
            semana_planeada: o.semana_planeada || 'BACKLOG',
            ordem_sequencial_linha: o.ordem_sequencial_linha
        }));

        const res = await atualizarPlaneamentoMultiplo(payload);
        if (res.success) {
            setUnsavedChanges(false);
            alert("✓ Quadro fabril gravado. Roteiros atualizados com sucesso!");
        } else {
            alert("Erro: " + res.error);
        }
        setIsSaving(false);
    };

    const dropAnimation: DropAnimation = {
        ...defaultDropAnimation,
    };

    return (
        <div className="flex flex-col h-full relative z-20 animate-fade-in">
            {/* Toolbar */}
            <div className="flex justify-end mb-4 px-2">
                <button
                    onClick={handleSave}
                    disabled={!unsavedChanges || isSaving}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Guardar Alterações {unsavedChanges && '*'}
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 h-full overflow-x-auto pb-6 px-2 snap-x">
                    {/* Backlog sempre fixo à esquerda */}
                    <KanbanColumn
                        key="BACKLOG"
                        coluna={COLUNAS[0]}
                        items={getItemsByColumn('BACKLOG')}
                        isBacklog={true}
                    />

                    {/* Divisor Visual */}
                    <div className="w-1 bg-white/5 rounded-full mx-2 hidden md:block"></div>

                    {/* Dias de Produção */}
                    {COLUNAS.slice(1).map(col => (
                        <KanbanColumn
                            key={col.id}
                            coluna={col}
                            items={getItemsByColumn(col.id)}
                            isBacklog={false}
                        />
                    ))}
                </div>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeId ? <KanbanCard ordem={ordens.find(o => o.id === activeId)!} isOverlay /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

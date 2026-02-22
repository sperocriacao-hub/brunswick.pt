'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { OrdemPlaneamento } from '../actions';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
    coluna: { id: string; title: string };
    items: OrdemPlaneamento[];
    isBacklog?: boolean;
}

export function KanbanColumn({ coluna, items, isBacklog }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: coluna.id,
    });

    return (
        <div
            className={`flex flex-col flex-shrink-0 w-80 md:w-96 rounded-2xl p-4 transition-colors ${isBacklog ? 'bg-slate-900/50 border border-slate-700/50' : 'bg-black/30 border border-white/5'} ${isOver ? 'ring-2 ring-blue-500/50 bg-blue-900/10' : ''}`}
        >
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className={`font-bold text-lg ${isBacklog ? 'text-slate-300' : 'text-blue-400'}`}>
                    {coluna.title}
                </h2>
                <div className="bg-white/10 text-xs font-bold text-white px-2 py-1 rounded-full">
                    {items.length} OP(s)
                </div>
            </div>

            <div
                ref={setNodeRef}
                className="flex flex-col gap-3 min-h-[300px] h-full"
            >
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map(item => (
                        <KanbanCard key={item.id} ordem={item} />
                    ))}
                </SortableContext>

                {/* Visual Cue that this space is active dropzone during drag */}
                {items.length === 0 && (
                    <div className={`h-full border-2 border-dashed rounded-xl flex items-center justify-center text-sm font-bold ${isOver ? 'border-blue-500/50 text-blue-400' : 'border-white/5 text-slate-600'}`}>
                        Largar Barcos Aqui
                    </div>
                )}
            </div>
        </div>
    );
}

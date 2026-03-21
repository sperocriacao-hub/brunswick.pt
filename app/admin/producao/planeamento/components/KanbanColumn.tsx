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
            className={`flex flex-col flex-shrink-0 w-80 md:w-96 rounded-2xl p-4 transition-colors ${isBacklog ? 'bg-slate-100 border border-slate-200' : 'bg-white border border-slate-200 shadow-sm'} ${isOver ? 'ring-2 ring-blue-500/50 bg-blue-50' : ''}`}
        >
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className={`font-bold text-lg ${isBacklog ? 'text-slate-600' : 'text-blue-900'}`}>
                    {coluna.title}
                </h2>
                <div className="bg-slate-200 text-xs font-bold text-slate-600 px-3 py-1 rounded-full">
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
                    <div className={`h-full border-2 border-dashed rounded-xl flex items-center justify-center text-sm font-bold ${isOver ? 'border-blue-300 text-blue-500' : 'border-slate-300 text-slate-400'}`}>
                        Largar Barcos Aqui
                    </div>
                )}
            </div>
        </div>
    );
}

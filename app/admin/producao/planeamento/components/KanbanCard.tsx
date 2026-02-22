'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OrdemPlaneamento } from '../actions';
import { GripVertical, Hash, Box } from 'lucide-react';

interface KanbanCardProps {
    ordem: OrdemPlaneamento;
    isOverlay?: boolean;
}

export function KanbanCard({ ordem, isOverlay }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: ordem.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`glass-panel p-4 flex flex-col gap-3 group relative overflow-hidden transition-all ${isOverlay ? 'scale-105 shadow-[0_20px_40px_rgba(0,0,0,0.8)] border-blue-500 ring-2 ring-blue-500 z-50' : 'hover:border-blue-500/50 hover:shadow-[0_5px_15px_rgba(0,0,0,0.4)]'} cursor-grab active:cursor-grabbing`}
            {...attributes}
            {...listeners}
        >
            {/* Decal Background */}
            <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none">
                <Box size={80} />
            </div>

            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                    <div>
                        <div className="text-xs font-bold text-blue-400 flex items-center gap-1">
                            <Hash size={12} /> {ordem.op_numero}
                        </div>
                        <h3 className="font-extrabold text-white">{ordem.modelo}</h3>
                    </div>
                </div>

                {/* Indicador Numérico de Linha */}
                <div className="w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-slate-400">
                    {ordem.linha || '-'}
                </div>
            </div>

            {ordem.hin_hull_id ? (
                <div className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded inline-block self-start font-mono border border-white/5">
                    HIN: {ordem.hin_hull_id}
                </div>
            ) : (
                <div className="text-[10px] text-amber-500/70 uppercase font-bold tracking-widest pl-6">
                    MOLDE POR ALOCAR
                </div>
            )}
        </div>
    );
}

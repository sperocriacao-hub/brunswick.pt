"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X } from 'lucide-react';

export default function AssiduidadeFilters({ 
    areas, linhas, estacoes 
}: { 
    areas: {id: string, nome: string}[],
    linhas: {id: string, nome: string}[],
    estacoes: {id: string, nome: string}[]
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentArea = searchParams.get('area') || '';
    const currentLinha = searchParams.get('linha') || '';
    const currentEstacao = searchParams.get('estacao') || '';
    const currentDia = searchParams.get('dia') || new Date().toISOString().split('T')[0];

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`?${params.toString()}`);
    };

    const handleClear = () => {
        router.push('?');
    };

    const hasFilters = currentArea || currentLinha || currentEstacao;

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-sm flex flex-col md:flex-row items-center gap-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-wider shrink-0">
                <Filter size={16} /> Filtros:
            </div>
            
            <input 
                type="date"
                className="w-full md:w-auto px-3 py-2 border border-slate-300 rounded-md text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentDia}
                onChange={(e) => handleFilterChange('dia', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
            />

            <select 
                className="w-full md:w-auto px-3 py-2 border border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentArea}
                onChange={(e) => handleFilterChange('area', e.target.value)}
            >
                <option value="">Todas as Áreas</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>

            <select 
                className="w-full md:w-auto px-3 py-2 border border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentLinha}
                onChange={(e) => handleFilterChange('linha', e.target.value)}
            >
                <option value="">Todas as Linhas</option>
                {linhas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>

            <select 
                className="w-full md:w-auto px-3 py-2 border border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentEstacao}
                onChange={(e) => handleFilterChange('estacao', e.target.value)}
            >
                <option value="">Todas as Estações</option>
                {estacoes.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>

            {hasFilters && (
                <button 
                    onClick={handleClear}
                    className="ml-auto flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-md transition-colors"
                >
                    <X size={14} /> Limpar
                </button>
            )}
        </div>
    );
}

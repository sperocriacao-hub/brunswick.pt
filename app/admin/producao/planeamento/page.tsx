import React from 'react';
import { buscarOrdensPlaneamento } from './actions';
import { CalendarDays, AlertCircle } from 'lucide-react';
import KanbanBoard from './components/KanbanBoard';

export const metadata = {
    title: 'Planeamento Fabril | Brunswick M.E.S',
};

export default async function PlaneamentoPage() {
    const response = await buscarOrdensPlaneamento();

    if (!response.success) {
        return (
            <div className="min-h-screen bg-slate-950 p-8 flexitems-center justify-center dashboard-layout relative z-20">
                <div className="glass-panel p-12 text-center text-red-400 flex flex-col items-center gap-4">
                    <AlertCircle size={48} />
                    <h2 className="text-xl font-bold">Erro a carregar o Quadro Fabril</h2>
                    <p className="text-slate-400">{response.error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-4 sm:p-8 dashboard-layout relative z-20 flex flex-col h-screen overflow-hidden">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 flex items-center gap-3">
                        <CalendarDays className="text-blue-500" /> Planeamento & Escalonamento
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Arraste os barcos do Backlog para os dias e linhas desejadas para gerir a produção agregada.
                    </p>
                </div>
            </div>

            {/* Kanban Board Area (Client Component) */}
            <div className="flex-1 overflow-hidden">
                <KanbanBoard inicialOrdens={response.data || []} />
            </div>
        </div>
    );
}

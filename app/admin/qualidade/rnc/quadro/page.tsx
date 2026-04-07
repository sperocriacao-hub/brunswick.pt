"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ListTodo, CheckCircle2, Clock, AlertTriangle, MessageSquarePlus, Lightbulb, Loader2, Search, Target, ShieldAlert, ArrowRight, Activity } from 'lucide-react';
import { getRncs, updateRncStatus } from '../actions';
import { useRouter } from 'next/navigation';

export default function RncKanbanBoardPage() {
    const router = useRouter();
    const [rncs, setRncs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        carregarQuadro();
    }, []);

    async function carregarQuadro() {
        setLoading(true);
        const res = await getRncs();
        if (res.success) {
            setRncs(res.data || []);
        }
        setLoading(false);
    }

    const moveCard = async (id: string, status: string) => {
        const originalStatus = rncs.find(r => r.id === id)?.status;
        if (originalStatus === status) return;

        // Optimistic UI update
        setRncs(prev => prev.map(r => r.id === id ? { ...r, status } : r));

        const res = await updateRncStatus(id, status);
        if (!res.success) {
            // Revert optimitic UI
            carregarQuadro();
            alert("Erro a mover a RNC: " + res.error);
        }
    };

    const StatusColumns = ["Aberto", "Em Investigacao", "Concluido"];

    return (
        <div className="p-8 space-y-8 pb-32 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500 bg-slate-50/50 min-h-screen">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-6 border-slate-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <Activity className="text-rose-600" size={36} /> War Room Qualidade
                    </h1>
                    <p className="text-lg text-slate-500 mt-1">Quadro Scrum interativo para tratamento visual de Não Conformidades.</p>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => router.push('/admin/qualidade/rnc')} className="px-4 py-2 bg-white text-slate-600 shadow-sm border border-slate-200 rounded-lg hover:bg-slate-50 font-bold text-sm">
                        Ver Modo Lista (Tabela)
                    </button>
                    <button onClick={() => router.push('/admin/qualidade/rnc/nova')} className="px-4 py-2 bg-rose-600 text-white shadow-sm border border-rose-700 rounded-lg hover:bg-rose-700 font-bold text-sm">
                        + Nova RNC
                    </button>
                </div>
            </header>

            <div className="flex flex-col xl:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por Referência, OP, Causa..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-slate-700 font-medium"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
                    {StatusColumns.map(columnId => {
                        const colItems = rncs.filter(r => {
                            // If it's something else like "Atribuinda", map it logically or let it hide. Let's force strict mapping if not matching exactly:
                            let matchStatus = false;
                            const sts = r.status || 'Aberto';
                            if (columnId === 'Aberto' && (sts === 'Aberto' || sts === 'Atribuinda')) matchStatus = true;
                            if (columnId === 'Em Investigacao' && sts === 'Em Investigacao') matchStatus = true;
                            if (columnId === 'Concluido' && sts === 'Concluido') matchStatus = true;

                            if (!matchStatus) return false;

                            if (searchTerm === '') return true;
                            const term = searchTerm.toLowerCase();
                            return (
                                r.numero_rnc?.toLowerCase().includes(term) ||
                                r.descricao_problema?.toLowerCase().includes(term) ||
                                r.contexto_producao?.toLowerCase().includes(term) ||
                                r.detetado_por_nome?.toLowerCase().includes(term)
                            );
                        });

                        // Theme definitions
                        let headerTheme = "bg-rose-50 text-rose-800 border-rose-200";
                        if (columnId === 'Em Investigacao') headerTheme = "bg-indigo-100 text-indigo-800 border-indigo-200";
                        if (columnId === 'Concluido') headerTheme = "bg-emerald-100 text-emerald-800 border-emerald-200";

                        return (
                            <div key={columnId} className="flex-1 w-full flex flex-col gap-4">
                                <div className={`px-4 py-3 rounded-xl border flex justify-between items-center font-black uppercase tracking-widest ${headerTheme}`}>
                                    <div className="flex items-center gap-2">
                                        {columnId === 'Aberto' && <AlertTriangle size={16} />}
                                        {columnId === 'Em Investigacao' && <Loader2 size={16} className="animate-spin" />}
                                        {columnId === 'Concluido' && <CheckCircle2 size={16} />}
                                        {columnId}
                                    </div>
                                    <span className="bg-white/50 text-black/60 px-2 py-0.5 rounded text-xs leading-none">
                                        {colItems.length}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-3 min-h-[500px] border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-100/30">
                                    {colItems.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold uppercase tracking-widest p-8 text-center italic">
                                            Vazio
                                        </div>
                                    ) : (
                                        colItems.map(rnc => {
                                            const has8d = rnc.qualidade_8d && rnc.qualidade_8d.length > 0;
                                            const hasA3 = rnc.qualidade_a3 && rnc.qualidade_a3.length > 0;
                                            const isCritical = rnc.gravidade === 'Critica' || rnc.gravidade === 'Bloqueante';

                                            return (
                                                <Card
                                                    key={rnc.id}
                                                    onClick={(e) => {
                                                        // Prevent open if clicking arrows
                                                        if ((e.target as HTMLElement).closest('.scrum-arrow')) return;
                                                        
                                                        // Redirect to exact form
                                                        if (has8d) router.push(`/admin/qualidade/rnc/8d/${rnc.qualidade_8d[0].id}`);
                                                        else if (hasA3) router.push(`/admin/qualidade/rnc/a3/${rnc.qualidade_a3[0].id}`);
                                                        else alert("Esta RNC ainda não tem um método 8D/A3 gerado. Gere-o a partir da vista Lista na Central.");
                                                    }}
                                                    className={`cursor-pointer shadow-sm hover:shadow-md transition-all group relative bg-white overflow-hidden border ${isCritical ? 'border-rose-300' : 'border-slate-200 hover:border-indigo-300'}`}
                                                >
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${has8d ? 'bg-indigo-400' : hasA3 ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>

                                                    <CardContent className="p-4 pl-5">
                                                        <div className="flex justify-between items-start mb-2 gap-2">
                                                            <span className="text-[10px] font-black tracking-widest text-slate-800">
                                                                {rnc.numero_rnc}
                                                            </span>
                                                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${isCritical ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                                {rnc.gravidade}
                                                            </span>
                                                        </div>

                                                        <h3 className="font-bold text-slate-800 leading-tight mb-2 text-sm">{rnc.descricao_problema}</h3>
                                                        
                                                        <div className="text-[11px] text-slate-400 font-medium mb-3">
                                                            {rnc.contexto_producao || rnc.estacoes?.nome_estacao || 'Sem contexto assinalado'}
                                                        </div>

                                                        <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                                                            <div>
                                                                {has8d ? (
                                                                    <div className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">8D ATIVO</div>
                                                                ) : hasA3 ? (
                                                                    <div className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">A3 ATIVO</div>
                                                                ) : (
                                                                    <div className="text-xs font-black text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">PENDENTE</div>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity scrum-arrow">
                                                                {columnId !== 'Aberto' && (
                                                                    <button onClick={() => moveCard(rnc.id, 'Aberto')} className="w-6 h-6 rounded bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100" title="Mover para Aberto">«</button>
                                                                )}
                                                                {columnId !== 'Em Investigacao' && (
                                                                    <button onClick={() => moveCard(rnc.id, 'Em Investigacao')} className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100" title="Mover para Em Investigação"><Loader2 className="w-3 h-3" /></button>
                                                                )}
                                                                {columnId !== 'Concluido' && (
                                                                    <button onClick={() => moveCard(rnc.id, 'Concluido')} className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100" title="Marcar como Concluído">»</button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}

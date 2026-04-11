"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Grip, Save, ShieldCheck, Wrench, Package, Search } from 'lucide-react';

export default function BussolaLiderancaPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [estacoes, setEstacoes] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Catalogs
    const [coordenadores, setCoordenadores] = useState<any[]>([]);
    const [supervisores, setSupervisores] = useState<any[]>([]);
    const [suportes, setSuportes] = useState<any[]>([]);

    useEffect(() => {
        carregarTudo();
    }, []);

    const carregarTudo = async () => {
        setIsLoading(true);
        
        const { data: eData } = await supabase.from('estacoes').select('*, areas_fabrica(nome_area)').order('nome_estacao');
        if (eData) setEstacoes(eData);

        const { data: opData } = await supabase.from('operadores').select('id, nome_operador, funcao, email_acesso').eq('status', 'Ativo');
        if (opData) {
            setCoordenadores(opData.filter(o => o.funcao?.toLowerCase().includes('coordenador') || o.funcao?.toLowerCase().includes('lider de equipa') || o.funcao?.toLowerCase().includes('líder de equipa')));
            setSupervisores(opData.filter(o => o.funcao === 'Supervisor' || o.funcao === 'Gestor'));
            setSuportes(opData);
        }

        setIsLoading(false);
    };

    const handleSaveRow = async (rowIndex: number) => {
        const row = estacoes[rowIndex];
        const payload = {
            lider_t1_id: row.lider_t1_id || null,
            supervisor_t1_id: row.supervisor_t1_id || null,
            lider_t2_id: row.lider_t2_id || null,
            supervisor_t2_id: row.supervisor_t2_id || null,
            manutencao_id: row.manutencao_id || null,
            qualidade_id: row.qualidade_id || null,
            logistica_id: row.logistica_id || null
        };
        
        const { error } = await supabase.from('estacoes').update(payload).eq('id', row.id);

        if (error) {
            alert("Erro ao gravar: " + error.message);
        } else {
            alert("✅ Liderança de Estação Atualizada!");
        }
    };

    const updateRowState = (id: string, field: string, value: string | null) => {
        setEstacoes(prev => {
            return prev.map(est => {
                if (est.id === id) {
                    return { ...est, [field]: value === '' ? null : value };
                }
                return est;
            });
        });
    };

    const filteredEstacoes = estacoes.filter(e => 
        e.nome_estacao?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.areas_fabrica?.nome_area?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <header className="flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-3 text-slate-900 tracking-tight">
                        <Grip size={32} className="text-indigo-600" />
                        Bússola Diretiva de Responsabilidades
                    </h1>
                    <p className="text-slate-500 font-medium">Atribua e controle a Cadeia de Liderança Oficial por Estação (Apoia KPIs de MTR e SLA de Andon).</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar Estação ou Área..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-md w-72 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
                    />
                </div>
            </header>

            {isLoading ? (
                <div className="p-20 flex justify-center"><Loader2 size={40} className="animate-spin text-indigo-300" /></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto max-h-[70vh]">
                        <table className="w-full text-left border-collapse text-sm relative">
                            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 font-bold text-slate-600 uppercase tracking-widest text-xs min-w-[200px]">Área & Estação</th>
                                    <th className="p-3 font-bold text-slate-600 uppercase tracking-widest text-xs border-l border-slate-200 bg-slate-100/50 min-w-[220px]">Turno 1 (Cord. / Super.)</th>
                                    <th className="p-3 font-bold text-slate-600 uppercase tracking-widest text-xs border-l border-slate-200 bg-slate-100/50 min-w-[220px]">Turno 2 (Cord. / Super.)</th>
                                    <th className="p-3 font-bold text-slate-600 uppercase tracking-widest text-xs border-l border-indigo-100 bg-indigo-50/30 min-w-[220px]">Chefias de Suporte</th>
                                    <th className="p-3 font-bold text-slate-600 uppercase tracking-widest text-xs text-right bg-slate-50">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEstacoes.map((row, i) => (
                                    <tr key={row.id} className="hover:bg-slate-50/50">
                                        {/* ESTAÇÃO */}
                                        <td className="p-3">
                                            <div className="font-bold text-slate-800 text-base">{row.nome_estacao}</div>
                                            <div className="text-xs text-indigo-500 font-semibold uppercase tracking-wider mt-1">{row.areas_fabrica?.nome_area || 'Sem Área'}</div>
                                        </td>
                                        
                                        {/* TURNO 1 */}
                                        <td className="p-3 border-l border-slate-100 space-y-2">
                                            <div>
                                                <select value={row.lider_t1_id || ''} onChange={e => updateRowState(row.id, 'lider_t1_id', e.target.value)} className="w-full text-xs p-1.5 border border-slate-200 rounded">
                                                    <option value="">-- Sem Coordenador T1 --</option>
                                                    {coordenadores.map(c => <option key={c.id} value={c.id}>{c.nome_operador}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <select value={row.supervisor_t1_id || ''} onChange={e => updateRowState(row.id, 'supervisor_t1_id', e.target.value)} className="w-full text-xs p-1.5 border border-slate-200 rounded bg-slate-50 font-bold text-slate-700">
                                                    <option value="">-- Sem Supervisor T1 --</option>
                                                    {supervisores.map(c => <option key={c.id} value={c.id}>{c.nome_operador}</option>)}
                                                </select>
                                            </div>
                                        </td>

                                        {/* TURNO 2 */}
                                        <td className="p-3 border-l border-slate-100 space-y-2">
                                            <div>
                                                <select value={row.lider_t2_id || ''} onChange={e => updateRowState(row.id, 'lider_t2_id', e.target.value)} className="w-full text-xs p-1.5 border border-slate-200 rounded">
                                                    <option value="">-- Sem Coordenador T2 --</option>
                                                    {coordenadores.map(c => <option key={c.id} value={c.id}>{c.nome_operador}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <select value={row.supervisor_t2_id || ''} onChange={e => updateRowState(row.id, 'supervisor_t2_id', e.target.value)} className="w-full text-xs p-1.5 border border-slate-200 rounded bg-slate-50 font-bold text-slate-700">
                                                    <option value="">-- Sem Supervisor T2 --</option>
                                                    {supervisores.map(c => <option key={c.id} value={c.id}>{c.nome_operador}</option>)}
                                                </select>
                                            </div>
                                        </td>

                                        {/* APOIO TÉCNICO */}
                                        <td className="p-3 border-l border-indigo-100 space-y-2 bg-indigo-50/10">
                                            <div className="flex items-center gap-1">
                                                <Wrench size={12} className="text-slate-400" />
                                                <select value={row.manutencao_id || ''} onChange={e => updateRowState(row.id, 'manutencao_id', e.target.value)} className="w-full text-xs p-1.5 border border-slate-300 bg-white rounded">
                                                    <option value="">-- Resp. Manutenção --</option>
                                                    {suportes.map(c => <option key={c.id} value={c.id}>{c.nome_operador}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <ShieldCheck size={12} className="text-slate-400" />
                                                <select value={row.qualidade_id || ''} onChange={e => updateRowState(row.id, 'qualidade_id', e.target.value)} className="w-full text-xs p-1.5 border border-slate-300 bg-white rounded">
                                                    <option value="">-- Resp. Qualidade --</option>
                                                    {suportes.map(c => <option key={c.id} value={c.id}>{c.nome_operador}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Package size={12} className="text-slate-400" />
                                                <select value={row.logistica_id || ''} onChange={e => updateRowState(row.id, 'logistica_id', e.target.value)} className="w-full text-xs p-1.5 border border-slate-300 bg-white rounded">
                                                    <option value="">-- Resp. Logística --</option>
                                                    {suportes.map(c => <option key={c.id} value={c.id}>{c.nome_operador}</option>)}
                                                </select>
                                            </div>
                                        </td>

                                        {/* AÇÕES */}
                                        <td className="p-3 text-right border-l border-slate-100">
                                            <button 
                                                onClick={() => handleSaveRow(estacoes.findIndex(e => e.id === row.id))} 
                                                className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded shadow-sm transition-colors"
                                            >
                                                <Save size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredEstacoes.length === 0 && !isLoading && (
                            <div className="p-10 text-center text-slate-500">Nenhuma estação encontrada.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

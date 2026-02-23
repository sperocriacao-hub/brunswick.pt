'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';

type Feriado = {
    id: string;
    data_feriado: string;
    descricao: string;
    recorrente_anualmente: boolean;
};

export function FeriadosManager() {
    const supabase = createClient();
    const [feriados, setFeriados] = useState<Feriado[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [novaData, setNovaData] = useState('');
    const [novaDescricao, setNovaDescricao] = useState('');
    const [novoRecorrente, setNovoRecorrente] = useState(false);

    const fetchFeriados = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('sys_feriados_fabrica')
                .select('*')
                .order('data_feriado', { ascending: true });

            if (error) throw error;
            setFeriados(data || []);
        } catch (error: any) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchFeriados();
    }, [fetchFeriados]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novaData || !novaDescricao) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('sys_feriados_fabrica')
                .insert([{
                    data_feriado: novaData,
                    descricao: novaDescricao,
                    recorrente_anualmente: novoRecorrente
                }]);

            if (error) {
                if (error.code === '23505') {
                    alert('Este feriado já existe na base de dados.');
                } else {
                    throw error;
                }
            } else {
                setNovaData('');
                setNovaDescricao('');
                setNovoRecorrente(false);
                fetchFeriados();
            }
        } catch (error: any) {
            console.error(error);
            alert('Erro ao adicionar feriado: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem a certeza que deseja remover este feriado?')) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('sys_feriados_fabrica')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchFeriados();
        } catch (error: any) {
            alert('Erro ao eliminar: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="mt-10 pt-8 border-t border-slate-200">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calendar size={20} className="text-blue-600" />
                        Feriados Oficiais (Exclusão OEE)
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Os dias aqui registados não contarão como "Atraso" no cálculo dos SLAs (Roteiros) de Engenharia.
                    </p>
                </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-6 relative">
                <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Data do Feriado</label>
                        <input
                            type="date"
                            required
                            className="w-full form-control px-4 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={novaData}
                            onChange={(e) => setNovaData(e.target.value)}
                            disabled={isSaving}
                        />
                    </div>
                    <div className="flex-[2]">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Designação</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Dia do Trabalhador"
                            className="w-full form-control px-4 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={novaDescricao}
                            onChange={(e) => setNovaDescricao(e.target.value)}
                            disabled={isSaving}
                        />
                    </div>
                    <div className="flex items-center gap-2 pb-3 mb-1">
                        <input
                            type="checkbox"
                            id="recorrente"
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                            checked={novoRecorrente}
                            onChange={(e) => setNovoRecorrente(e.target.checked)}
                            disabled={isSaving}
                        />
                        <label htmlFor="recorrente" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                            Recorrente Anual?
                        </label>
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow whitespace-nowrap flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <Plus size={18} /> Adicionar
                        </button>
                    </div>
                </form>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8 opacity-50"><Loader2 className="animate-spin" /></div>
            ) : feriados.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-slate-300 rounded-xl text-slate-500 bg-white shadow-sm">
                    <AlertCircle className="mx-auto mb-3 opacity-50" size={32} />
                    Não tem nenhum feriado registado no sistema.
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Designação</th>
                                <th className="px-6 py-4">Recorrência</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {feriados.map((feriado) => (
                                <tr key={feriado.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 font-mono font-medium text-slate-800">
                                        {new Date(feriado.data_feriado).toLocaleDateString('pt-PT')}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700">{feriado.descricao}</td>
                                    <td className="px-6 py-4">
                                        {feriado.recorrente_anualmente ? (
                                            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-[11px] font-bold tracking-wide">ANUAL</span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">PONTUAL</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(feriado.id)}
                                            disabled={isSaving}
                                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                            title="Remover Feriado"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

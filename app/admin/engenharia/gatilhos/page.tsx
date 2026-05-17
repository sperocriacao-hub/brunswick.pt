'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Plus, Trash2, Box, Zap, Settings, ArrowRight, Truck } from 'lucide-react';

export default function GatilhosLogisticaPage() {
    const supabase = createClient();
    const [regras, setRegras] = useState<any[]>([]);
    const [modelos, setModelos] = useState<any[]>([]);
    const [estacoes, setEstacoes] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        modelo_id: '',
        estacao_gatilho_id: '',
        evento_gatilho: 'INICIO_ESTACAO',
        area_alvo_id: '',
        estacao_alvo_id: '',
        descricao_tarefa: '',
        sla_horas: 24,
        estacao_destino_id: ''
    });
    
    const [novaTarefa, setNovaTarefa] = useState('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Models
            const { data: modelosData } = await supabase.from('modelos').select('*').order('nome_modelo');
            setModelos(modelosData || []);

            // Fetch Stations
            const { data: estacoesData } = await supabase.from('estacoes').select('*').order('nome_estacao');
            setEstacoes(estacoesData || []);

            // Fetch Areas (Filtrar só para Armazém, Carpintaria e Estofos)
            const { data: areasData } = await supabase.from('areas_fabrica').select('*').order('nome_area');
            const areasFiltradas = (areasData || []).filter(a => {
                const nome = a.nome_area.toLowerCase();
                return nome.includes('armazém') || nome.includes('armazem') || nome.includes('carpintaria') || nome.includes('estofos');
            });
            setAreas(areasFiltradas);
            
            // Fetch Rules
            const { data: regrasData, error: regrasError } = await supabase
                .from('regras_gatilhos_secundarios')
                .select(`
                    *,
                    modelo:modelos(nome_modelo),
                    estacao_gatilho:estacoes!regras_gatilhos_secundarios_estacao_gatilho_id_fkey(nome_estacao),
                    estacao_destino:estacoes!regras_gatilhos_secundarios_estacao_destino_id_fkey(nome_estacao),
                    area_alvo:areas_fabrica(nome_area, cor_identificacao),
                    estacao_alvo:estacoes!regras_gatilhos_secundarios_estacao_alvo_id_fkey(nome_estacao)
                `)
                .order('created_at', { ascending: false });
                
            if (regrasError) {
                console.error("Erro ao buscar regras:", regrasError);
            }
            setRegras(regrasData || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const payload = { ...formData };
            if (!payload.estacao_alvo_id) payload.estacao_alvo_id = null as any;
            if (!payload.estacao_destino_id) payload.estacao_destino_id = null as any;

            const { error } = await supabase.from('regras_gatilhos_secundarios').insert([payload]);
            if (error) throw error;
            
            setIsModalOpen(false);
            setFormData({
                modelo_id: '',
                estacao_gatilho_id: '',
                evento_gatilho: 'INICIO_ESTACAO',
                area_alvo_id: '',
                estacao_alvo_id: '',
                descricao_tarefa: '',
                sla_horas: 24,
                estacao_destino_id: ''
            });
            fetchData();
        } catch (error: any) {
            alert('Erro ao gravar: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminar esta regra de gatilho?')) return;
        try {
            const { error } = await supabase.from('regras_gatilhos_secundarios').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error: any) {
            alert('Erro: ' + error.message);
        }
    };

    const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 text-slate-900 text-sm";
    
    // As estações disponíveis dependem da área selecionada no formulário
    const estacoesDisponiveis = estacoes.filter(e => e.area_id === formData.area_alvo_id);

    if (isLoading) {
        return <div className="p-20 flex justify-center opacity-50"><Loader2 className="animate-spin" size={40} /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500 pb-20">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <Zap className="text-amber-500" />
                        Gatilhos Industriais (JIT)
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Matriz de regras para acionar automaticamente o Armazém e as Submontagens.
                    </p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition-colors flex gap-2 items-center shadow-sm"
                >
                    <Plus size={18} /> Novo Gatilho
                </button>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4">Modelo</th>
                                <th className="p-4">Se este Evento Ocorrer...</th>
                                <th className="p-4 text-center">Ação Despoletada (Alvo)</th>
                                <th className="p-4 text-center">SLA Preparação</th>
                                <th className="p-4">Destino da Entrega</th>
                                <th className="p-4 text-right">Opções</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {regras.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                                        Nenhuma regra de gatilho configurada. Clique em "Novo Gatilho" para começar.
                                    </td>
                                </tr>
                            ) : regras.map(regra => (
                                <tr key={regra.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-bold text-slate-800">
                                        <div className="flex items-center gap-2">
                                            <Box size={14} className="text-slate-400" />
                                            {regra.modelo?.nome_modelo}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700">{regra.estacao_gatilho?.nome_estacao}</span>
                                            <span className="text-[10px] uppercase font-bold text-amber-600">
                                                {regra.evento_gatilho === 'INICIO_ESTACAO' ? 'Ao Iniciar Trabalhos' : regra.evento_gatilho === 'FIM_ESTACAO' ? 'Ao Finalizar Estação' : 'Ao chegar a 50%'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span 
                                                className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest border border-slate-200 shadow-sm`}
                                                style={{ backgroundColor: regra.area_alvo?.cor_identificacao ? `${regra.area_alvo.cor_identificacao}20` : '#f1f5f9', color: regra.area_alvo?.cor_identificacao || '#475569', borderColor: regra.area_alvo?.cor_identificacao ? `${regra.area_alvo.cor_identificacao}50` : '#e2e8f0' }}
                                            >
                                                {regra.area_alvo?.nome_area}
                                            </span>
                                            {regra.estacao_alvo && (
                                                <span className="text-[10px] font-bold text-slate-500 mt-0.5 bg-slate-100 px-1.5 rounded">
                                                    {regra.estacao_alvo.nome_estacao}
                                                </span>
                                            )}
                                            <span className="text-xs font-semibold text-slate-600">{regra.descricao_tarefa}</span>
                                            <span className="text-[9px] font-bold text-slate-400 mt-1">Tarefas auto-vinculadas ao Modelo</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center font-bold text-rose-600">
                                        {regra.sla_horas} Horas
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 font-medium text-slate-700">
                                            <ArrowRight size={14} className="text-slate-400" />
                                            {regra.estacao_destino?.nome_estacao || '-'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleDelete(regra.id)}
                                            className="p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-md transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Novo Gatilho */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                                    <Truck className="text-blue-600" size={20} />
                                    Adicionar Regra JIT
                                </h2>
                                <p className="text-xs text-slate-500 font-medium mt-1">Configura a reação em cadeia da fábrica.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-6">
                                {/* Seção 1 */}
                                <div>
                                    <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-3">1. O Gatilho (O que acontece na Linha Principal)</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Para o Modelo de Barco:</label>
                                            <select required value={formData.modelo_id} onChange={e => setFormData({...formData, modelo_id: e.target.value})} className={inputClass}>
                                                <option value="">Selecione...</option>
                                                {modelos.map(m => <option key={m.id} value={m.id}>{m.nome_modelo}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Quando o barco entrar em:</label>
                                            <select required value={formData.estacao_gatilho_id} onChange={e => setFormData({...formData, estacao_gatilho_id: e.target.value})} className={inputClass}>
                                                <option value="">Selecione a Estação...</option>
                                                {estacoes.map(e => <option key={e.id} value={e.id}>{e.nome_estacao}</option>)}
                                            </select>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Momento Exato (Trigger):</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded border border-slate-200">
                                                    <input type="radio" name="evento" value="INICIO_ESTACAO" checked={formData.evento_gatilho === 'INICIO_ESTACAO'} onChange={e => setFormData({...formData, evento_gatilho: e.target.value})} className="accent-blue-600" />
                                                    <span className="text-xs font-bold">Ao Iniciar a Estação</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded border border-slate-200">
                                                    <input type="radio" name="evento" value="FIM_ESTACAO" checked={formData.evento_gatilho === 'FIM_ESTACAO'} onChange={e => setFormData({...formData, evento_gatilho: e.target.value})} className="accent-blue-600" />
                                                    <span className="text-xs font-bold">Ao Finalizar a Estação</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Seção 2 */}
                                <div>
                                    <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-3">2. A Reação (O que o M.E.S vai exigir)</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Setor a Notificar (Área da Fábrica):</label>
                                            <select required value={formData.area_alvo_id} onChange={e => setFormData({...formData, area_alvo_id: e.target.value, estacao_alvo_id: ''})} className={`${inputClass} font-bold text-blue-800`}>
                                                <option value="">Selecione a Área Alvo...</option>
                                                {areas.map(a => <option key={a.id} value={a.id}>{a.nome_area}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Estação Específica (Opcional):</label>
                                            <select 
                                                value={formData.estacao_alvo_id} 
                                                onChange={e => setFormData({...formData, estacao_alvo_id: e.target.value})} 
                                                className={inputClass}
                                                disabled={!formData.area_alvo_id}
                                            >
                                                <option value="">Todas (ou Geral da Área)</option>
                                                {estacoesDisponiveis.map(est => (
                                                    <option key={est.id} value={est.id}>
                                                        {est.nome_estacao}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">O que eles têm de fazer? (Título do Ticket)</label>
                                            <input required type="text" value={formData.descricao_tarefa} onChange={e => setFormData({...formData, descricao_tarefa: e.target.value})} className={inputClass} placeholder="Ex: Preparar Kit Fibras Casco" />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Seção 3 */}
                                <div>
                                    <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-3">3. Prazos e Entrega (Logística)</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">SLA Concedido (Em Horas):</label>
                                            <div className="flex items-center gap-2">
                                                <input required type="number" min="1" max="720" value={formData.sla_horas} onChange={e => setFormData({...formData, sla_horas: parseInt(e.target.value) || 0})} className={`${inputClass} w-24 text-center font-black`} />
                                                <span className="text-xs text-slate-500 font-medium">Horas de tolerância para o setor concluir.</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Entregar na Estação:</label>
                                            <select required value={formData.estacao_destino_id} onChange={e => setFormData({...formData, estacao_destino_id: e.target.value})} className={inputClass}>
                                                <option value="">Onde entregar o material?</option>
                                                {estacoes.map(e => <option key={e.id} value={e.id}>{e.nome_estacao}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                        
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-md transition-colors text-sm">
                                Cancelar
                            </button>
                            <button type="button" onClick={handleSubmit} disabled={isSaving} className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-md font-bold transition-colors flex gap-2 items-center text-sm shadow-sm">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} />}
                                Gravar Regra JIT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Search, Filter, AlertTriangle, Info } from 'lucide-react';

export default function IluoMatrixPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    
    const [operadores, setOperadores] = useState<any[]>([]);
    const [estacoes, setEstacoes] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [matriz, setMatriz] = useState<any[]>([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArea, setSelectedArea] = useState('all');
    const [selectedLinha, setSelectedLinha] = useState('all');
    const [selectedEstacao, setSelectedEstacao] = useState('all');
    const [selectedSupervisor, setSelectedSupervisor] = useState('all');
    const [selectedCoordenador, setSelectedCoordenador] = useState('all');
    const [showEmptyOperators, setShowEmptyOperators] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const [opsRes, estRes, areaRes, matrizRes] = await Promise.all([
                supabase.from('operadores').select('id, nome_operador, funcao, lider_nome, supervisor_nome').eq('status', 'Ativo').order('nome_operador'),
                supabase.from('estacoes').select('id, nome_estacao, areas_fabrica(id, nome_area), linhas_producao(id, descricao_linha)').order('nome_estacao'),
                supabase.from('areas_fabrica').select('id, nome_area').order('nome_area'),
                supabase.from('operador_iluo_matriz').select('*')
            ]);
            
            if (opsRes.data) setOperadores(opsRes.data);
            if (estRes.data) setEstacoes(estRes.data);
            if (areaRes.data) setAreas(areaRes.data);
            if (matrizRes.data) setMatriz(matrizRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    // Derived Dropdown Options
    const uniqueLinhas = Array.from(new Set(estacoes.map(e => e.linhas_producao?.descricao_linha).filter(Boolean))).sort() as string[];
    const uniqueSupervisores = Array.from(new Set(operadores.map(op => op.supervisor_nome).filter(Boolean))).sort() as string[];
    const uniqueCoordenadores = Array.from(new Set(operadores.map(op => op.lider_nome).filter(Boolean))).sort() as string[];

    // Preparar as Estações a apresentar (Baseado no Filtro de Área e Linha)
    const validEstacoes = estacoes.filter(e => {
        if (!e.areas_fabrica) return false;
        if (selectedArea !== 'all' && e.areas_fabrica.id !== selectedArea) return false;
        if (selectedLinha !== 'all' && e.linhas_producao?.descricao_linha !== selectedLinha) return false;
        if (selectedEstacao !== 'all' && e.id !== selectedEstacao) return false;
        return true;
    }).sort((a, b) => {
        // Agrupar primeiro por Área, depois por Nome
        const areaA = a.areas_fabrica?.nome_area || '';
        const areaB = b.areas_fabrica?.nome_area || '';
        if (areaA < areaB) return -1;
        if (areaA > areaB) return 1;
        return a.nome_estacao.localeCompare(b.nome_estacao);
    });

    // Preparar os Operadores a apresentar (Filtrados por Search, Hierarquia e por skills)
    const validOp = operadores.filter(op => {
        // 1. Filtro Manual de Pesquisa de Texto
        if (searchTerm.trim() !== '') {
            const matchSearch = op.nome_operador.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (op.funcao && op.funcao.toLowerCase().includes(searchTerm.toLowerCase()));
            if (!matchSearch) return false;
        }

        // 2. Filtro Hierárquico (Liderança)
        if (selectedSupervisor !== 'all' && op.supervisor_nome !== selectedSupervisor) return false;
        if (selectedCoordenador !== 'all' && op.lider_nome !== selectedCoordenador) return false;

        // 3. Regra de Visibilidade de Operários Vazios
        // Se o utilizador ativou o Toggle, ou se filtrou por um Líder específico, mostra todos!
        if (showEmptyOperators || selectedSupervisor !== 'all' || selectedCoordenador !== 'all') {
            return true;
        }

        // Se estivermos na Visão Total da Fábrica sem filtros agressivos
        if (selectedArea === 'all' && selectedLinha === 'all' && selectedEstacao === 'all') {
            return true;
        }

        // Caso contrário, (ex: selecionou apenas Área), só queremos ver os operários que efetivamente têm competências registadas nessa zona, para limpar a tabela!
        const hasAnySkillInVisibleStations = validEstacoes.some(est => {
            return matriz.some(m => m.operador_id === op.id && m.estacao_id === est.id);
        });
        
        return hasAnySkillInVisibleStations;
    });

    const estacoesDropdownOptions = estacoes.filter(e => {
        if (selectedArea !== 'all' && e.areas_fabrica?.id !== selectedArea) return false;
        if (selectedLinha !== 'all' && e.linhas_producao?.descricao_linha !== selectedLinha) return false;
        return true;
    }).sort((a, b) => a.nome_estacao.localeCompare(b.nome_estacao));

    const getIluoTag = (opId: string, estId: string) => {
        const found = matriz.find(m => m.operador_id === opId && m.estacao_id === estId);
        if (!found) return null;
        return found;
    };

    const cores: Record<string, string> = {
        'I': 'bg-slate-200 text-slate-600 border-slate-300',
        'L': 'bg-amber-100 text-amber-700 border-amber-300',
        'U': 'bg-blue-100 text-blue-700 border-blue-400',
        'O': 'bg-emerald-100 text-emerald-700 border-emerald-400'
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500 pb-32">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                    Matriz de Polivalência (ILUO)
                </h1>
                <p className="text-slate-500 font-medium text-sm mt-1">Visão Fabril de Skills, Gap Analysis e Risco de Capital Humano</p>
            </header>

            {/* Barra de Filtros */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 mb-6">
                {/* Linha 1 */}
                <div className="flex flex-col md:flex-row gap-4 items-end w-full">
                    <div className="flex-[1.5] w-full relative">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pesquisar Operário</label>
                        <Search className="absolute left-3 top-[28px] text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Ex: Alessandro..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Área Fabril</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-[10px] text-slate-400" size={16} />
                            <select 
                                value={selectedArea}
                                onChange={(e) => {
                                    setSelectedArea(e.target.value);
                                    setSelectedEstacao('all'); // Reseta a dependência
                                }}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">Fábrica Completa</option>
                                {areas.map(a => <option key={a.id} value={a.id}>{a.nome_area}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Linha de Produção</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-[10px] text-slate-400" size={16} />
                            <select 
                                value={selectedLinha}
                                onChange={(e) => {
                                    setSelectedLinha(e.target.value);
                                    setSelectedEstacao('all'); // Reseta a dependência
                                }}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">Todas as Linhas...</option>
                                {uniqueLinhas.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filtrar por Estação</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-[10px] text-slate-400" size={16} />
                            <select 
                                value={selectedEstacao}
                                onChange={(e) => setSelectedEstacao(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">Todas as Estações...</option>
                                {estacoesDropdownOptions.map(est => <option key={est.id} value={est.id}>{est.nome_estacao}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Linha 2 */}
                <div className="flex flex-col md:flex-row gap-4 items-end w-full">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Supervisor</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-[10px] text-slate-400" size={16} />
                            <select 
                                value={selectedSupervisor}
                                onChange={(e) => setSelectedSupervisor(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">Todos os Supervisores...</option>
                                {uniqueSupervisores.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Coordenador (Líder)</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-[10px] text-slate-400" size={16} />
                            <select 
                                value={selectedCoordenador}
                                onChange={(e) => setSelectedCoordenador(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">Todos os Coordenadores...</option>
                                {uniqueCoordenadores.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 w-full flex items-center h-[38px] px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                        <label className="flex items-center justify-center gap-3 cursor-pointer w-full h-full">
                            <input 
                                type="checkbox" 
                                checked={showEmptyOperators} 
                                onChange={(e) => setShowEmptyOperators(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                            <span className="text-xs font-bold text-slate-700 select-none">Mostrar Op. Sem Skills</span>
                        </label>
                    </div>

                    <div className="hidden md:flex flex-row items-center justify-center gap-4 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg h-[38px]">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className="w-4 h-4 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[8px]">I</span> Trainee</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-700"><span className="w-4 h-4 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-[8px]">L</span> Autónomo</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-700"><span className="w-4 h-4 rounded-full bg-blue-100 border border-blue-400 flex items-center justify-center text-[8px]">U</span> Especialista</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700"><span className="w-4 h-4 rounded-full bg-emerald-100 border border-emerald-400 flex items-center justify-center text-[8px]">O</span> Formador</div>
                    </div>
                </div>
            </div>

            {/* A Matriz Grelha */}
            {isLoading ? (
                <div className="p-20 flex justify-center opacity-50"><Loader2 className="animate-spin" size={40} /></div>
            ) : selectedArea === 'all' && selectedEstacao === 'all' && searchTerm.trim() === '' ? (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-16 text-center flex flex-col items-center justify-center mb-10">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                        <Filter size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Aguardando Parâmetros</h2>
                    <p className="text-slate-500 max-w-md text-sm">
                        Para otimizar a performance devido ao elevado número de estações, a matriz está recolhida.
                        Por favor, use os filtros acima ou pesquise por um operário para gerar a grelha em tempo real.
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative max-h-[800px]">
                    
                    <div className="overflow-x-auto overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                            <thead className="sticky top-0 bg-slate-50 shadow-sm z-10 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 font-extrabold text-slate-700 sticky left-0 bg-slate-50 border-r border-slate-200 shadow-sm z-20 min-w-[250px]">
                                        Recurso Humano
                                    </th>
                                    {validEstacoes.map(est => (
                                        <th key={est.id} className="px-3 py-2 font-bold text-center border-r border-slate-200 min-w-[120px]">
                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest truncate max-w-[110px]" title={est.areas_fabrica?.nome_area}>
                                                {est.areas_fabrica?.nome_area}
                                            </div>
                                            <div className="text-xs text-slate-800 truncate max-w-[110px]" title={est.nome_estacao}>
                                                {est.nome_estacao}
                                            </div>
                                            {/* Bus Factor Check: Count how many U or O exist here */}
                                            {(() => {
                                                const experts = matriz.filter(m => m.estacao_id === est.id && (m.nivel_iluo === 'U' || m.nivel_iluo === 'O')).length;
                                                if (experts === 0) {
                                                    return <div className="mt-1 text-[9px] text-red-500 bg-red-50 border border-red-200 rounded px-1 flex items-center justify-center gap-1" title="Risco Crítico! Sem especialistas formados."><AlertTriangle size={8}/> ZERO EXPERTS</div>;
                                                }
                                                if (experts === 1) {
                                                    return <div className="mt-1 text-[9px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-1 flex items-center justify-center gap-1" title="Alto Risco! Apenas 1 especialista."><Info size={8}/> 1 EXPERT (RISCO)</div>;
                                                }
                                                return <div className="mt-1 text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1 flex items-center justify-center gap-1" title="Área Segura.">{experts} EXPERTS</div>;
                                            })()}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {validOp.length > 0 ? validOp.map(op => (
                                    <tr key={op.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 sticky left-0 bg-white hover:bg-slate-50 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10">
                                            <div className="font-bold text-slate-800 text-sm truncate max-w-[220px]" title={op.nome_operador}>{op.nome_operador}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 truncate max-w-[220px]" title={op.funcao}>{op.funcao || 'Operador Padrão'}</div>
                                        </td>
                                        {validEstacoes.map(est => {
                                            const tag = getIluoTag(op.id, est.id);
                                            return (
                                                <td key={est.id} className="px-3 py-3 border-r border-slate-100 text-center">
                                                    {tag ? (
                                                        <div className="group relative inline-flex justify-center w-full cursor-help">
                                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black shadow-sm ${cores[tag.nivel_iluo] || cores['I']}`}>
                                                                {tag.nivel_iluo}
                                                            </div>
                                                            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 border border-slate-800 shadow-xl rounded-md p-2 text-left z-50">
                                                                <div className="text-white text-xs font-bold mb-1">{tag.nivel_iluo === 'I' ? 'I - Trainee' : tag.nivel_iluo === 'L' ? 'L - Autónomo' : tag.nivel_iluo === 'U' ? 'U - Especialista' : 'O - Formador'}</div>
                                                                <div className="text-[10px] text-slate-400 font-medium">Avaliado por: <span className="text-slate-300">{tag.avaliador_nome || 'N/A'}</span></div>
                                                                <div className="text-[10px] text-slate-400 font-medium">Data Avaliação: <span className="text-slate-300">{tag.data_avaliacao ? new Date(tag.data_avaliacao).toLocaleDateString('pt-PT') : 'N/A'}</span></div>
                                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-800"></div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-200 font-black opacity-20 text-xs">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={validEstacoes.length + 1} className="p-8 text-center text-slate-400 italic">
                                            Nenhum operário encontrado para a pesquisa.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserCheck, HelpCircle, Save, AlertTriangle, UserCircle2 } from 'lucide-react';
import { AvaliacaoDTO, submeterAvaliacaoDiaria } from './actions';

type Operador = {
    id: string;
    numero_operador: string;
    nome_operador: string;
    funcao: string;
};

export default function PaginaAvaliacaoDiaria() {
    const supabase = createClient();
    const [operadores, setOperadores] = useState<Operador[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // O Operador que estamos ativamente a avaliar (Modal Aberto)
    const [editingOp, setEditingOp] = useState<Operador | null>(null);

    // O FormState para a linha de avaliação
    const [grades, setGrades] = useState({
        hst: 4.0, epi: 4.0, limpeza: 4.0, qualidade: 4.0,
        eficiencia: 4.0, objetivos: 4.0, atitude: 4.0
    });

    // Justificações obrigatórias se < 2.0
    const [justificacoes, setJustificacoes] = useState<Record<string, string>>({});

    useEffect(() => {
        carregarLista();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase]);

    const carregarLista = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('operadores')
            .select('id, numero_operador, nome_operador, funcao')
            .eq('status', 'Ativo')
            .order('nome_operador');

        if (data) setOperadores(data as Operador[]);
        setIsLoading(false);
    };

    const abrirAvaliacao = (op: Operador) => {
        setEditingOp(op);
        setGrades({ hst: 4.0, epi: 4.0, limpeza: 4.0, qualidade: 4.0, eficiencia: 4.0, objetivos: 4.0, atitude: 4.0 });
        setJustificacoes({});
    };

    const fecharAvaliacao = () => setEditingOp(null);

    const handleGradeChange = (key: keyof typeof grades, value: number) => {
        setGrades(prev => ({ ...prev, [key]: value }));
        // Se a nota voltou acima de 2.0, limpamos a justificação indevida
        if (value >= 2.0) {
            setJustificacoes(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const getEixosCriticos = () => {
        return Object.keys(grades).filter(k => grades[k as keyof typeof grades] < 2.0);
    };

    const submeter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOp) return;

        const criticos = getEixosCriticos();
        // Validar Justificações
        const justificacoesFalta = criticos.filter(ch => !justificacoes[ch] || justificacoes[ch].trim() === '');
        if (justificacoesFalta.length > 0) {
            alert("Precisa de justificar todas as notas inferiores a 2.0 antes de submeter a avaliação.");
            return;
        }

        const dto: AvaliacaoDTO = {
            funcionario_id: editingOp.id,
            nomeFuncionario: editingOp.nome_operador,
            ...grades,
            justificacoes
        };

        const res = await submeterAvaliacaoDiaria(dto, "Supervisor Brunswick");

        if (res.success) {
            alert(`Avaliação de ${editingOp.nome_operador} gravada com sucesso! A Matriz de Talento foi atualizada.`);
            fecharAvaliacao();
        } else {
            alert(`Erro na Submissão: ${res.error}`);
        }
    };

    return (
        <div className="container animate-fade-in p-6">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <UserCheck className="text-[var(--primary)]" size={28} />
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Grelha de Avaliação Diária</h1>
                </div>
                <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "0.25rem" }}>
                    Pontuação Contínua de Desempenho (0.0 a 4.0). Alimentação da Matriz de Talento ILUO.
                </p>
            </header>

            <div className="glass-panel p-6">
                <h3 className="text-lg font-bold mb-4 opacity-80">A Minha Equipa (Operadores Ativos)</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading ? (
                        <div className="col-span-full text-center py-8 opacity-50">Localizando Colaboradores...</div>
                    ) : operadores.map(op => (
                        <div key={op.id} className="flex flex-col p-4 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.2)] hover:border-[var(--primary)] transition-all cursor-pointer" onClick={() => abrirAvaliacao(op)}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex gap-3 items-center">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                        <UserCircle2 size={24} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm m-0 leading-tight">{op.nome_operador}</h4>
                                        <span className="text-xs text-[var(--accent)] font-mono">{op.numero_operador}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 text-xs opacity-60 flex gap-2">
                                <span className="bg-slate-800 px-2 py-1 rounded">Função: {op.funcao || 'N/A'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL DE AVALIAÇÃO DE 7 EIXOS */}
            {editingOp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}>
                    <div className="glass-panel w-full max-w-3xl flex flex-col" style={{ maxHeight: '90vh' }}>

                        <div className="p-5 border-b border-[rgba(255,255,255,0.1)] flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                            <div>
                                <h3 className="font-bold text-lg m-0">Avaliação do Turno</h3>
                                <p className="text-sm opacity-60">Revisão de Desempenho para <strong style={{ color: 'var(--primary)' }}>{editingOp.nome_operador}</strong></p>
                            </div>
                            <button onClick={fecharAvaliacao} className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">&times;</button>
                        </div>

                        <form onSubmit={submeter} className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* Eixos Grelha de Sliders */}
                                <div className="space-y-6">
                                    <p className="text-xs tracking-wider uppercase opacity-50 mb-4 font-bold">Classificação Dimensional</p>

                                    {[
                                        { key: 'hst', label: 'Segurança (HST)' },
                                        { key: 'epi', label: 'Uso de EPI' },
                                        { key: 'limpeza', label: 'Limpeza e 5S' },
                                        { key: 'qualidade', label: 'Qualidade do Registo' },
                                        { key: 'eficiencia', label: 'Eficiência de Ciclo' },
                                        { key: 'objetivos', label: 'Metas / Objetivos Diários' },
                                        { key: 'atitude', label: 'Atitude / Trabalho Equipa' },
                                    ].map((item) => (
                                        <div key={item.key} className="bg-[rgba(0,0,0,0.2)] p-4 rounded-lg border border-[rgba(255,255,255,0.05)]">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-sm font-semibold">{item.label}</label>
                                                <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${grades[item.key as keyof typeof grades] < 2.0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                    {grades[item.key as keyof typeof grades].toFixed(1)}
                                                </span>
                                            </div>
                                            <input
                                                type="range" min="0" max="4" step="0.5"
                                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                                                value={grades[item.key as keyof typeof grades]}
                                                onChange={(e) => handleGradeChange(item.key as keyof typeof grades, parseFloat(e.target.value))}
                                            />
                                            <div className="flex justify-between mt-1 text-[10px] opacity-40 font-mono">
                                                <span>Inaceitável (0)</span>
                                                <span>Aceitável (2)</span>
                                                <span>Top (4)</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Zona Crítica: Justificações (Apontamentos) */}
                                <div className="space-y-4">
                                    <p className="text-xs tracking-wider uppercase opacity-50 mb-4 font-bold text-red-400 flex items-center gap-2">
                                        <AlertTriangle size={14} /> Emissão de Apontamentos
                                    </p>

                                    {getEixosCriticos().length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-8 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                                            <HelpCircle size={40} className="mb-4" />
                                            <p className="text-sm">Nenhum parâmetro da grelha foi classificado como Crítico (&lt; 2.0).</p>
                                            <p className="text-xs mt-2">O Formulário de Justificação Disciplinar encontra-se bloqueado e desnecessário.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {getEixosCriticos().map(k => (
                                                <div key={k} className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                                                    <label className="text-xs text-red-300 font-bold mb-2 block uppercase">Atenção Requerida para: {k}</label>
                                                    <textarea
                                                        className="w-full bg-[rgba(0,0,0,0.5)] border border-red-500/30 rounded p-3 text-sm focus:outline-none focus:border-red-400 min-h-[100px] text-white"
                                                        placeholder="Qual é o motivo prático da quebra deste KPI hoje? (Obrigatório preencher)"
                                                        required
                                                        value={justificacoes[k] || ''}
                                                        onChange={(e) => setJustificacoes(prev => ({ ...prev, [k]: e.target.value }))}
                                                    ></textarea>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>

                            <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.1)] flex justify-end gap-4">
                                <button type="button" onClick={fecharAvaliacao} className="btn bg-slate-800 text-white hover:bg-slate-700">Cancelar Descarte</button>
                                <button type="submit" className="btn btn-primary flex gap-2 items-center">
                                    <Save size={18} /> Confirmar Pontuações na Matriz
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
}

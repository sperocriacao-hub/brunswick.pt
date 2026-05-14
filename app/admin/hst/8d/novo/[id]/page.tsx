'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from 'next/navigation';
import { getHst8D, saveHst8D, saveHstAcao } from './actions';
import { FileText, Save, Loader2, ArrowLeft, Users, Focus, Shield, Compass, Key, PlayCircle, CheckSquare, Zap, Target, Plus, Trash2 } from 'lucide-react';
import { Input } from "@/components/ui/input";

export default function Hst8DFormPage() {
    const params = useParams();
    const router = useRouter();
    const ocorrenciaId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [ocorrencia, setOcorrencia] = useState<any>(null);
    const [relatorioId, setRelatorioId] = useState<string | null>(null);
    const [acoes, setAcoes] = useState<any[]>([]);
    const [operadores, setOperadores] = useState<any[]>([]);

    // D8 Fields
    const [d1, setD1] = useState('');
    const [d2, setD2] = useState('');
    const [d3, setD3] = useState('');
    const [d4, setD4] = useState('');
    const [d5, setD5] = useState('');
    const [d6, setD6] = useState('');
    const [d7, setD7] = useState('');
    const [d8, setD8] = useState('');

    useEffect(() => {
        carregarBase();
    }, [ocorrenciaId]);

    async function carregarBase() {
        setLoading(true);
        const res = await getHst8D(ocorrenciaId);

        if (res.success && res.ocorrencia) {
            setOcorrencia(res.ocorrencia);

            if (res.relatorio8d) {
                // Relatório existente
                const r8 = res.relatorio8d;
                setRelatorioId(r8.id);
                setD1(r8.d1_equipa || '');
                setD2(r8.d2_descricao_problema || '');
                setD3(r8.d3_acao_contencao || '');
                setD4(r8.d4_causa_raiz || '');
                setD5(r8.d5_acao_corretiva || '');
                setD6(r8.d6_implementacao || '');
                setD7(r8.d7_prevencao || '');
                setD8(r8.d8_reconhecimento || '');
            } else {
                // Pré-preenchimento
                setD2(res.ocorrencia.descricao || '');
            }
            if (res.acoes) setAcoes(res.acoes);
            if (res.operadores) setOperadores(res.operadores);
        } else {
            console.error("Falha a carregar Ocorrência HST:", res.error);
        }
        setLoading(false);
    }

    async function handleSave(status: string) {
        setSubmitting(true);
        const payload = {
            id: relatorioId,
            d1_equipa: d1,
            d2_descricao_problema: d2,
            d3_acao_contencao: d3,
            d4_causa_raiz: d4,
            d5_acao_corretiva: d5,
            d6_implementacao: d6,
            d7_prevencao: d7,
            d8_reconhecimento: d8,
            status: status
        };

        const res = await saveHst8D(ocorrenciaId, payload);
        if (res.success) {
            router.push('/admin/hst/8d/historico');
        } else {
            alert('Falha a gravar relatório 8D: ' + res.error);
            setSubmitting(false);
        }
    }

    if (loading) return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">A extrair base do Acidente para formato 8D...</div>;

    return (
        <div className="p-8 space-y-8 max-w-[1000px] mx-auto animate-in fade-in duration-500 pb-32">
            <header className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-500 mb-2 px-0 hover:bg-transparent hover:text-rose-600">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Histórico
                    </Button>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FileText className="text-rose-600" size={32} /> Relatório 8D - Segurança
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Vinculado à Ocorrência de <span className="text-rose-600 font-bold">{ocorrencia?.tipo_ocorrencia}</span> - ST: {ocorrencia?.estacoes?.nome_estacao || ocorrencia?.areas_fabrica?.nome_area}
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <Button disabled={submitting} variant="outline" className="border-rose-200 text-rose-700 bg-rose-50" onClick={() => handleSave('Rascunho')}>
                        <Save className="w-4 h-4 mr-2" /> Guardar Rascunho
                    </Button>
                    <Button disabled={submitting} onClick={() => handleSave('Em Investigacao')} className="bg-slate-800 hover:bg-slate-900 text-white font-bold shadow-md">
                        {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                        Em Investigação
                    </Button>
                    <Button disabled={submitting} onClick={() => handleSave('Concluido')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">
                        <CheckSquare className="w-4 h-4 mr-2" /> Concluir Relatório
                    </Button>
                </div>
            </header>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">

                {/* D1 */}
                <div className="space-y-3">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Users size={16} className="text-blue-500" /> D1. Equipa EHS / Investigadores
                    </label>
                    <p className="text-xs text-slate-500">Liste o Responsável de Segurança e os restantes membros (ex: Testemunhas, Supervisor, Diretor) alocados a investigar este acidente.</p>
                    <Input value={d1} onChange={e => setD1(e.target.value)} placeholder="Ex: Eng. João, Operador Manuel (Vítima/Testemunha)" className="bg-slate-50" />
                </div>

                <hr className="border-slate-100" />

                {/* D2 */}
                <div className="space-y-3">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Target size={16} className="text-rose-500" /> D2. Descrição do Acidente (5W2H)
                    </label>
                    <p className="text-xs text-slate-500">Defina o incidente focado em factos e danos (Quem, Onde, Quando, O Quê, Tipo de Lesão).</p>
                    <textarea
                        value={d2} onChange={e => setD2(e.target.value)}
                        className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[80px]"
                    />
                </div>

                <hr className="border-slate-100" />

                {/* D3 */}
                <div className="space-y-3">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Shield size={16} className="text-amber-500" /> D3. Ações Provisórias / Contenção (ICA)
                    </label>
                    <p className="text-xs text-slate-500">O que foi feito imediatamente para garantir que o posto de trabalho foi isolado e o colaborador recebeu assistência?</p>
                    <textarea
                        value={d3} onChange={e => setD3(e.target.value)}
                        className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[80px]"
                    />
                </div>

                <hr className="border-slate-100" />

                {/* D4 */}
                <div className="space-y-3">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Focus size={16} className="text-purple-500" /> D4. Identificação da Causa Raiz (RCA)
                    </label>
                    <p className="text-xs text-slate-500">Por que o acidente ocorreu? Identifique se foi Atitude Insegura, Falta de Proteção, Procedimento Deficiente, etc.</p>
                    <textarea
                        value={d4} onChange={e => setD4(e.target.value)}
                        className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[100px]"
                        placeholder="Porque 1... Porque 2... Porque 3... (Registo de Árvore de Causa)"
                    />
                </div>

                <hr className="border-slate-100" />

                {/* D5 & D6 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Key size={16} className="text-emerald-500" /> D5. Resumo das Ações Corretivas (Histórico)
                        </label>
                        <p className="text-xs text-slate-500">Registo descritivo das ações. Use o Plano de Ações abaixo (D5.1) para associar responsáveis e datas para a Torre de Controlo.</p>
                        <textarea
                            value={d5} onChange={e => setD5(e.target.value)}
                            className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <CheckSquare size={16} className="text-blue-500" /> D6. Validação (Implementação)
                        </label>
                        <p className="text-xs text-slate-500">Evidências de que as ações físicas foram instaladas no terreno (Delegue para Kanban de Ações se necessário).</p>
                        <textarea
                            value={d6} onChange={e => setD6(e.target.value)}
                            className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[100px]"
                        />
                    </div>
                </div>

                {/* NOVO: D5.1 KANBAN PLANO DE AÇÃO */}
                {relatorioId && (
                <div className="space-y-4 border border-slate-200 p-5 rounded-lg bg-slate-50 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <Target size={18} className="text-rose-500" /> D5.1. Plano de Ações (Quadro Kanban)
                            </label>
                            <p className="text-xs text-slate-500 mt-1">
                                As ações inseridas abaixo serão automaticamente enviadas para o <b>Smart Action Hub (Torre de Controlo)</b>, permitindo o acompanhamento de responsáveis e prazos a nível de fábrica.
                            </p>
                        </div>
                        <Button 
                            variant="default" size="sm" className="bg-rose-600 hover:bg-rose-700 font-bold shadow-md"
                            onClick={async () => {
                                const payload = {
                                    ocorrencia_id: ocorrenciaId,
                                    relatorio_8d_id: relatorioId,
                                    descricao_acao: 'Nova Ação...',
                                    status: 'To Do',
                                    area_id: ocorrencia.area_id || null,
                                    linha_id: ocorrencia.linha_id || null,
                                    estacao_id: ocorrencia.estacao_id || null
                                };
                                const res = await saveHstAcao(payload);
                                if (res.success) {
                                    setAcoes([...acoes, res.data]);
                                } else {
                                    alert('Erro ao criar ação: ' + res.error);
                                }
                            }}
                        >
                            <Plus size={16} className="mr-1"/> Adicionar Ação
                        </Button>
                    </div>

                    <div className="overflow-x-auto mt-4 rounded-md border border-slate-200 bg-white">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-100/50 uppercase text-[10px] font-black text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2">Descrição (O Quê)</th>
                                    <th className="px-4 py-2 w-48">Responsável (Quem)</th>
                                    <th className="px-4 py-2 w-40">Data Limite (Quando)</th>
                                    <th className="px-4 py-2 w-32">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {acoes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">Nenhuma ação estruturada adicionada.</td>
                                    </tr>
                                )}
                                {acoes.map((acao, idx) => (
                                    <tr key={acao.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-2">
                                            <Input 
                                                value={acao.descricao_acao} 
                                                onChange={e => {
                                                    const n = [...acoes];
                                                    n[idx].descricao_acao = e.target.value;
                                                    setAcoes(n);
                                                }}
                                                onBlur={() => saveHstAcao(acao)}
                                                className="h-8 text-xs font-semibold bg-white"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <select 
                                                value={acao.responsavel_id || ''}
                                                onChange={e => {
                                                    const n = [...acoes];
                                                    n[idx].responsavel_id = e.target.value || null;
                                                    setAcoes(n);
                                                    saveHstAcao(n[idx]);
                                                }}
                                                className="w-full h-8 text-xs font-semibold rounded-md border border-slate-200 px-2 bg-white"
                                            >
                                                <option value="">Não Definido</option>
                                                {operadores.map(op => <option key={op.id} value={op.id}>{op.nome_operador}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <Input 
                                                type="date"
                                                value={acao.data_prevista ? acao.data_prevista.split('T')[0] : ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    const n = [...acoes];
                                                    n[idx].data_prevista = val ? new Date(val).toISOString() : null;
                                                    setAcoes(n);
                                                    saveHstAcao(n[idx]);
                                                }}
                                                className="h-8 text-xs font-semibold bg-white"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <select 
                                                value={acao.status || 'To Do'}
                                                onChange={e => {
                                                    const n = [...acoes];
                                                    n[idx].status = e.target.value;
                                                    setAcoes(n);
                                                    saveHstAcao(n[idx]);
                                                }}
                                                className="w-full h-8 text-xs font-semibold rounded-md border border-slate-200 px-2 bg-white"
                                            >
                                                <option value="To Do">To Do (Aberto)</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Blocked">Blocked</option>
                                                <option value="Done">Done (Concluído)</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                )}

                <hr className="border-slate-100" />

                {/* D7 & D8 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Compass size={16} className="text-teal-500" /> D7. Prevenção de Recorrência
                        </label>
                        <p className="text-xs text-slate-500">Atualização de Procedimentos (Manuais HST) ou sinaléticas a nível transversal da Máquina/Fábrica.</p>
                        <textarea
                            value={d7} onChange={e => setD7(e.target.value)}
                            className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={16} className="text-yellow-500" /> D8. Reconhecimento
                        </label>
                        <p className="text-xs text-slate-500">Reforço positivo e fecho oficial de documentação p/ Seguradora / Autoridade Laboral.</p>
                        <textarea
                            value={d8} onChange={e => setD8(e.target.value)}
                            className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[80px]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from 'next/navigation';
import { getHst8D, saveHst8D } from './actions';
import { FileText, Save, Loader2, ArrowLeft, Users, Focus, Shield, Compass, Key, PlayCircle, CheckSquare, Zap, Target } from 'lucide-react';
import { Input } from "@/components/ui/input";

export default function Hst8DFormPage() {
    const params = useParams();
    const router = useRouter();
    const ocorrenciaId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [ocorrencia, setOcorrencia] = useState<any>(null);
    const [relatorioId, setRelatorioId] = useState<string | null>(null);

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
                            <Key size={16} className="text-emerald-500" /> D5. Ação Corretiva Permanente
                        </label>
                        <p className="text-xs text-slate-500">Sistemas de segurança (Barreiras, Sensores, EPIs) ou formação desenhados para agir na Causa Raiz.</p>
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

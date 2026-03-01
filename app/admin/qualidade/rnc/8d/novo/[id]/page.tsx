"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from 'next/navigation';
import { getRncBase, create8d } from '../../../actions';
import { FileText, Save, Loader2, ArrowLeft, Users, Focus, Shield, Compass, Key, PlayCircle, CheckSquare, Zap, Target } from 'lucide-react';
import { Input } from "@/components/ui/input";

export default function NovoOitodPage() {
    const params = useParams();
    const router = useRouter();
    const rncId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rnc, setRnc] = useState<any>(null);

    // D8 Fields
    const [d1, setD1] = useState('');
    const [d2, setD2] = useState('');
    const [d3, setD3] = useState('');
    const [d4, setD4] = useState('');
    const [d5, setD5] = useState('');
    const [d6, setD6] = useState('');
    const [d7, setD7] = useState('');
    const [d8, setD8] = useState('');
    const [responsavel, setResponsavel] = useState('');

    useEffect(() => {
        carregarBase();
    }, [rncId]);

    async function carregarBase() {
        setLoading(true);
        const res = await getRncBase(rncId);
        if (res.success) {
            setRnc(res.rnc);
            // Pre-fill some defaults if they make sense
            setD2(res.rnc.descricao_problema || '');
            setD3(res.rnc.acao_imediata || '');
        } else {
            console.error("Falha a carregar RNC:", res.error);
        }
        setLoading(false);
    }

    async function handleSave(status: string) {
        setSubmitting(true);
        const payload = {
            rnc_id: rncId,
            d1_equipa: d1,
            d2_problema: d2,
            d3_contencao: d3,
            d4_causa_raiz: d4,
            d5_acao_permanente: d5,
            d6_implementacao: d6,
            d7_prevencao: d7,
            d8_reconhecimento: d8,
            responsavel_nome: responsavel,
            status: status
        };

        const res = await create8d(payload);
        if (res.success) {
            router.push('/admin/qualidade/rnc');
        } else {
            alert('Falha a gerar relatório 8D: ' + res.error);
            setSubmitting(false);
        }
    }

    if (loading) return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">A extrair base da RNC para formato 8D...</div>;

    return (
        <div className="p-8 space-y-8 max-w-[1000px] mx-auto animate-in fade-in duration-500 pb-32">
            <header className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-500 mb-2 px-0 hover:bg-transparent hover:text-indigo-600">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar à Central
                    </Button>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FileText className="text-indigo-600" size={32} /> Abertura de Relatório 8D
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Vinculado a <span className="text-rose-600 font-bold">{rnc?.numero_rnc}</span> - Metodologia Eight Disciplines
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <Button disabled={submitting} variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50" onClick={() => handleSave('Draft')}>
                        <Save className="w-4 h-4 mr-2" /> Guardar Rascunho
                    </Button>
                    <Button disabled={submitting} onClick={() => handleSave('D1-D3')} className="bg-indigo-600 hover:bg-indigo-700 font-bold shadow-md">
                        {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                        Iniciar D4 (Causa Raiz)
                    </Button>
                </div>
            </header>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">

                {/* D1 */}
                <div className="space-y-3">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Users size={16} className="text-indigo-500" /> D1. Equipa de Resolução
                    </label>
                    <p className="text-xs text-slate-500">Liste o Responsável Líder (Champion) e os restantes membros multidisciplinares alocados a este problema.</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="col-span-1">
                            <Input value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Líder (Ex: Eng. João)" className="bg-slate-50" />
                        </div>
                        <div className="col-span-3">
                            <Input value={d1} onChange={e => setD1(e.target.value)} placeholder="Outros Membros (Ex: Qualidade, Supervisor, Operador)" className="bg-slate-50" />
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* D2 */}
                <div className="space-y-3">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Target size={16} className="text-rose-500" /> D2. Descrição do Problema (5W2H)
                    </label>
                    <p className="text-xs text-slate-500">Defina o problema focado no cliente (Quem, Onde, Quando, O Quê).</p>
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
                    <p className="text-xs text-slate-500">O que foi feito imediatamente para proteger os clientes/próxima estação até a causa raiz ser encontrada?</p>
                    <textarea
                        value={d3} onChange={e => setD3(e.target.value)}
                        className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[80px]"
                    />
                </div>

                <hr className="border-slate-100" />

                {/* D4 */}
                <div className="space-y-3 opacity-90">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Focus size={16} className="text-purple-500" /> D4. Identificação da Causa Raiz (RCA)
                    </label>
                    <p className="text-xs text-slate-500">Use os 5 Porquês ou Fishbone para provar porque é que falhou o processo.</p>
                    <textarea
                        value={d4} onChange={e => setD4(e.target.value)}
                        className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[100px]"
                        placeholder="Porque 1... Porque 2... Porque 3..."
                    />
                </div>

                <hr className="border-slate-100" />

                {/* D5 & D6 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-90">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Key size={16} className="text-emerald-500" /> D5. Ação Permanente (PCA)
                        </label>
                        <p className="text-xs text-slate-500">Soluções escolhidas para intervir na Causa Raiz.</p>
                        <textarea
                            value={d5} onChange={e => setD5(e.target.value)}
                            className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <CheckSquare size={16} className="text-blue-500" /> D6. Validação (Implementação)
                        </label>
                        <p className="text-xs text-slate-500">Verificação com dados de que a solução (D5) efetivamente corrigiu a Causa Raiz.</p>
                        <textarea
                            value={d6} onChange={e => setD6(e.target.value)}
                            className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[100px]"
                        />
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* D7 & D8 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-90">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Compass size={16} className="text-teal-500" /> D7. Prevenção de Recorrência
                        </label>
                        <p className="text-xs text-slate-500">SOPs atualizados, TPM modificado ou Lição Aprendida para o resto da fábrica?</p>
                        <textarea
                            value={d7} onChange={e => setD7(e.target.value)}
                            className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={16} className="text-yellow-500" /> D8. Reconhecimento
                        </label>
                        <p className="text-xs text-slate-500">Felicitar a equipa, formalizar o fecho com os stakeholders e libertar o grupo.</p>
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

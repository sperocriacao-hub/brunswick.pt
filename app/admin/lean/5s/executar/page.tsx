"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Check, X, Minus, Camera, Save } from 'lucide-react';
import { getAreasE_Estacoes, getChecklist, salvarRonda5S } from '../actions';
import { getLeanFormData } from '@/app/operador/ideias/actions'; // para operadores
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useRouter } from 'next/navigation';

export default function ExecutarAuditoria5S() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Context Data
    const [areas, setAreas] = useState<any[]>([]);
    const [operadores, setOperadores] = useState<any[]>([]);
    
    // Selection State
    const [auditorId, setAuditorId] = useState("");
    const [areaId, setAreaId] = useState("");
    const [linhaId, setLinhaId] = useState("");
    const [estacaoId, setEstacaoId] = useState("");
    const [linhas, setLinhas] = useState<any[]>([]);

    // Execution State
    const [perguntas, setPerguntas] = useState<any[]>([]);
    const [respostas, setRespostas] = useState<Record<string, { resultado: string, observacoes: string }>>({});
    
    useEffect(() => {
        carregarConfig();
    }, []);

    async function carregarConfig() {
        setLoading(true);
        const reqA = await getAreasE_Estacoes();
        const reqO = await getLeanFormData();
        if (reqA.success) {
            setAreas(reqA.data || []);
            setLinhas(reqA.linhas || []);
        }
        if (reqO.success) setOperadores(reqO.operadores || []);
        setLoading(false);
    }

    const startAudit = async () => {
        if (!areaId) return;
        setLoading(true);
        const reqP = await getChecklist(areaId);
        if (reqP.success) {
            setPerguntas(reqP.data || []);
            // init empty respostas
            const initial: any = {};
            (reqP.data || []).forEach((p: any) => {
                initial[p.id] = { resultado: '', observacoes: '' };
            });
            setRespostas(initial);
            setStep(2);
        } else {
            alert("Erro ao carregar checklist: " + reqP.error);
        }
        setLoading(false);
    };

    const handleAnswer = (perguntaId: string, value: string) => {
        setRespostas(prev => ({
            ...prev,
            [perguntaId]: { ...prev[perguntaId], resultado: value }
        }));
    };

    const handleObs = (perguntaId: string, obs: string) => {
        setRespostas(prev => ({
            ...prev,
            [perguntaId]: { ...prev[perguntaId], observacoes: obs }
        }));
    };

    const finalizar = async () => {
        // Validation
        const unanswered = perguntas.filter(p => !respostas[p.id]?.resultado);
        if (unanswered.length > 0) {
            alert(`Ainda faltam responder a \${unanswered.length} perguntas!`);
            return;
        }

        setSaving(true);
        
        let obtida = 0;
        let maxima = 0;

        const payloadResp = perguntas.map(p => {
            const r = respostas[p.id];
            if (r.resultado !== 'N/A') {
                maxima += 1; // Assuming each is worth 1 point for now
                if (r.resultado === 'Pass') obtida += 1;
            }
            return {
                pergunta_id: p.id,
                categoria: p.categoria,
                resultado: r.resultado,
                observacoes: r.observacoes
            };
        });

        const percent = maxima > 0 ? (obtida / maxima) * 100 : 0;

        const res = await salvarRonda5S({
            areaId,
            estacaoId,
            auditorId,
            pontuacao_obtida: obtida,
            pontuacao_maxima: maxima,
            percentagem: percent,
            respostas: payloadResp
        });

        if (res.success) {
            alert(`Auditoria Finalizada com Score de \${percent.toFixed(0)}%!`);
            if (window.location.pathname.includes('/operador')) {
                router.push('/operador');
            } else {
                router.push('/admin/lean/5s');
            }
        } else {
            alert("Erro a gravar: " + res.error);
            setSaving(false);
        }
    };

    if (loading && step === 1) {
        return <div className="p-20 flex justify-center"><Loader2 className="w-12 h-12 text-blue-500 animate-spin" /></div>;
    }

    const areaSelecionada = areas.find(a => a.id === areaId);
    const isMontagem = areaSelecionada?.nome_area?.toLowerCase().includes('montagem');
    let estacoesArea = areaSelecionada?.estacoes || [];

    if (isMontagem && linhaId) {
        estacoesArea = estacoesArea.filter((e: any) => e.linha_producao_id === linhaId);
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-32">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => step === 2 ? setStep(1) : router.back()}>
                        <ArrowLeft />
                    </Button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Ronda 5S</h1>
                        {step === 2 && <p className="text-xs font-bold text-slate-500">{areaSelecionada?.nome_area}</p>}
                    </div>
                </div>
                {step === 2 && (
                    <Button onClick={finalizar} disabled={saving} className="bg-blue-600 hover:bg-blue-700 font-bold px-6">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} Terminar
                    </Button>
                )}
            </header>

            <main className="max-w-[800px] mx-auto p-4 md:p-8">
                {step === 1 && (
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6 animate-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-black text-slate-800 text-center mb-8">Onde estamos a auditar?</h2>
                        
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase">Seu Nome / Número (Auditor)</label>
                            <SearchableSelect 
                                value={auditorId} 
                                onChange={setAuditorId}
                                options={operadores.map(o => ({
                                    value: o.id,
                                    label: `\${o.numero_operador || 'S/N'} - \${o.nome_operador}`
                                }))}
                                placeholder="Pesquise pelo seu nome ou número mec."
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase">Área Fabril</label>
                            <select value={areaId} onChange={e => { setAreaId(e.target.value); setLinhaId(""); setEstacaoId(""); }} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-lg font-medium outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Selecione...</option>
                                {areas.map(a => <option key={a.id} value={a.id}>{a.nome_area}</option>)}
                            </select>
                        </div>

                        {areaId && isMontagem && (
                            <div className="space-y-3 animate-in fade-in">
                                <label className="text-xs font-bold text-slate-500 uppercase">Linha de Produção</label>
                                <select value={linhaId} onChange={e => { setLinhaId(e.target.value); setEstacaoId(""); }} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-lg font-medium outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Selecione a Linha...</option>
                                    {linhas.map((l: any) => <option key={l.id} value={l.id}>Linha {l.letra_linha}</option>)}
                                </select>
                            </div>
                        )}

                        {areaId && (!isMontagem || linhaId) && estacoesArea.length > 0 && (
                            <div className="space-y-3 animate-in fade-in">
                                <label className="text-xs font-bold text-slate-500 uppercase">Estação (Opcional)</label>
                                <select value={estacaoId} onChange={e => setEstacaoId(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-lg font-medium outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Geral {isMontagem ? 'da Linha' : 'da Área'}</option>
                                    {estacoesArea.map((e: any) => <option key={e.id} value={e.id}>{e.nome_estacao}</option>)}
                                </select>
                            </div>
                        )}

                        <Button disabled={!auditorId || !areaId || (isMontagem && !linhaId) || loading} onClick={startAudit} className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700 font-black tracking-wide mt-8">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Carregar Checklist"}
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        {loading ? (
                            <div className="p-20 flex justify-center"><Loader2 className="w-12 h-12 text-blue-500 animate-spin" /></div>
                        ) : perguntas.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                                Não existem perguntas configuradas para esta área.
                            </div>
                        ) : (
                            perguntas.map((p, index) => {
                                const resp = respostas[p.id];
                                const isFail = resp?.resultado === 'Fail';
                                
                                return (
                                    <div key={p.id} className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all \${isFail ? 'border-rose-300' : 'border-slate-200'}`}>
                                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{p.categoria}</span>
                                            <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-snug mb-6">{p.pergunta}</h3>
                                            
                                            <div className="grid grid-cols-3 gap-3 mb-4">
                                                <button
                                                    onClick={() => handleAnswer(p.id, 'Pass')}
                                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all font-bold \${resp?.resultado === 'Pass' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50'}`}
                                                >
                                                    <Check size={28} className={resp?.resultado === 'Pass' ? 'text-emerald-500' : ''} />
                                                    OK
                                                </button>
                                                <button
                                                    onClick={() => handleAnswer(p.id, 'Fail')}
                                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all font-bold \${resp?.resultado === 'Fail' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:border-rose-200 hover:bg-rose-50'}`}
                                                >
                                                    <X size={28} className={resp?.resultado === 'Fail' ? 'text-rose-500' : ''} />
                                                    FALHA
                                                </button>
                                                <button
                                                    onClick={() => handleAnswer(p.id, 'N/A')}
                                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all font-bold \${resp?.resultado === 'N/A' ? 'bg-slate-100 border-slate-400 text-slate-700 shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-50'}`}
                                                >
                                                    <Minus size={28} className={resp?.resultado === 'N/A' ? 'text-slate-500' : ''} />
                                                    N/A
                                                </button>
                                            </div>

                                            {isFail && (
                                                <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                                                        <p className="text-xs font-bold text-rose-700 uppercase mb-2 flex items-center gap-1">
                                                            <X size={12}/> Ação de Melhoria Obrigatória
                                                        </p>
                                                        <textarea 
                                                            placeholder="Descreva a não conformidade encontrada..."
                                                            value={resp?.observacoes}
                                                            onChange={e => handleObs(p.id, e.target.value)}
                                                            className="w-full p-3 text-sm bg-white border border-rose-200 rounded-md outline-none focus:ring-2 focus:ring-rose-400 resize-none h-20"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

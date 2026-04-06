"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Activity, XCircle, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { RadarClientChart } from '@/components/rh/RadarClientChart';
import { LineClientChart } from '@/components/rh/LineClientChart';
import { createClient } from '@/utils/supabase/client';

interface ColaboradorRaioXModalProps {
    isOpen: boolean;
    onClose: () => void;
    operadorId: string;
    operadorRfid: string;
    nomeOperador: string;
    funcaoArea: string;
    isLeader?: boolean;
    aiContext?: {
        equipaOee: number;
        mtrAndon: number;
        mentoriaScore: number;
        mentorshipCount: number;
        notaHst?: number;
        notaObjetivos?: number;
    }
}

export function ColaboradorRaioXModal({ isOpen, onClose, operadorId, operadorRfid, nomeOperador, funcaoArea, isLeader = false, aiContext }: ColaboradorRaioXModalProps) {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);

    // AI State
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState<any>(null);

    // Data Holders
    const [historicoRadar, setHistoricoRadar] = useState<any[]>([]);
    const [historicoLinha, setHistoricoLinha] = useState<any[]>([]);
    const [apontamentosNegativos, setApontamentosNegativos] = useState<any[]>([]);

    useEffect(() => {
        if (!isOpen) return;

        const carregarDadosIndividuais = async () => {
            setIsLoading(true);

            const dataLimiar = new Date();
            dataLimiar.setDate(dataLimiar.getDate() - 30);
            const trintaDiasStr = dataLimiar.toISOString().split('T')[0];

            let formattedRadar = [];
            let formattedLinha = [];
            let feedbacksUnificados: any[] = [];

            if (isLeader) {
                // Liderança (Cálculo Front-end 30 dias)
                const { data: colsRaw } = await supabase.from('avaliacoes_lideranca')
                    .select('*')
                    .eq('funcionario_id', operadorId)
                    .gte('data_avaliacao', trintaDiasStr)
                    .order('data_avaliacao', { ascending: true });

                if (colsRaw && colsRaw.length > 0) {
                    const count = colsRaw.length;
                    const sum = colsRaw.reduce((acc, crr) => {
                        acc.epi += crr.nota_epi || 0;
                        acc.hst += crr.nota_hst || 0;
                        acc.qualidade += crr.nota_qualidade || 0;
                        acc.cinco_s += crr.nota_5s || 0;
                        acc.trabalho += crr.nota_eficiencia || 0; 
                        acc.polivalencia += crr.nota_gestao_motivacao || 0;
                        acc.kaisen += crr.nota_kpis || 0;
                        return acc;
                    }, { epi: 0, hst: 0, qualidade: 0, cinco_s: 0, trabalho: 0, polivalencia: 0, kaisen: 0 });

                    formattedRadar = [
                        { subject: 'EPI & Fardamento', A: sum.epi / count },
                        { subject: 'Assiduidade (HST)', A: sum.hst / count },
                        { subject: 'Qualidade', A: sum.qualidade / count },
                        { subject: 'Metodologia 5S', A: sum.cinco_s / count },
                        { subject: 'Eficiência Lider.', A: sum.trabalho / count },
                        { subject: 'Gestão/Motivação', A: sum.polivalencia / count },
                        { subject: 'Gestão de KPIs', A: sum.kaisen / count },
                    ];
                } else {
                    formattedRadar = [
                        { subject: 'EPI & Fardamento', A: 0 },
                        { subject: 'Assiduidade (HST)', A: 0 },
                        { subject: 'Qualidade', A: 0 },
                        { subject: 'Metodologia 5S', A: 0 },
                        { subject: 'Eficiência Lider.', A: 0 },
                        { subject: 'Gestão/Motivação', A: 0 },
                        { subject: 'Gestão de KPIs', A: 0 },
                    ];
                }

                formattedLinha = colsRaw?.map(row => ({
                    date: new Date(row.data_avaliacao).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }),
                    score: row.nota_eficiencia || 0
                })) || [];
                if (formattedLinha.length === 0) {
                    formattedLinha.push({ date: new Date().toLocaleDateString('pt-PT'), score: 0 });
                }

                // Extrair Feedbacks Escritos da Liderança (JSON justificativas)
                colsRaw?.forEach(row => {
                    if (row.justificativas) {
                        try {
                            const parsed = JSON.parse(row.justificativas);
                            Object.entries(parsed).forEach(([key, val]) => {
                                if (val && (val as string).trim() !== '') {
                                    feedbacksUnificados.push({
                                        data_apontamento: row.data_avaliacao,
                                        supervisor_nome: row.supervisor_nome,
                                        topico_falhado: key === 'comentario_geral' ? 'Feedback Geral' : `Pilar: ${key}`,
                                        justificacao: val,
                                        nota_atribuida: 'N/A'
                                    });
                                }
                            });
                        } catch(e) {}
                    }
                });

            } else {
                // 1. Fetch Médias dos 7 Pilares (Radar)
                const { data: radarMedias } = await supabase.rpc('get_medias_operador_v2', { target_id: operadorId });

                formattedRadar = [
                    { subject: 'EPI & Fardamento', A: radarMedias?.[0]?.med_epi || 0 },
                    { subject: 'Assiduidade (HST)', A: radarMedias?.[0]?.med_hst || 0 },
                    { subject: 'Auditoria Qualidade', A: radarMedias?.[0]?.med_qualidade || 0 },
                    { subject: 'Metodologia 5S', A: radarMedias?.[0]?.med_5s || 0 },
                    { subject: 'Rendimento OEE', A: radarMedias?.[0]?.med_rendimento || 0 },
                    { subject: 'Polivalência', A: radarMedias?.[0]?.med_polivalencia || 0 },
                    { subject: 'Inovação / Kaisen', A: radarMedias?.[0]?.med_kaisen || 0 },
                ];

                // 2. Fetch OEE Timeline (Linha de Progressão) Últimos 30 Dias + Extrair Justificação Geral
                const { data: linhasRaw } = await supabase.from('avaliacoes_diarias')
                    .select('data_avaliacao, nota_eficiencia, justificacao, supervisor_nome')
                    .eq('funcionario_id', operadorId)
                    .gte('data_avaliacao', trintaDiasStr)
                    .order('data_avaliacao', { ascending: true });

                formattedLinha = linhasRaw?.map(row => ({
                    date: new Date(row.data_avaliacao).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }),
                    score: row.nota_eficiencia
                })) || [];
                if (formattedLinha.length === 0) {
                    formattedLinha.push({ date: new Date().toLocaleDateString('pt-PT'), score: 0 });
                }

                // Feedbacks Gerais na Tabela Principal
                linhasRaw?.forEach(row => {
                     if (row.justificacao && row.justificacao.trim() !== '') {
                         feedbacksUnificados.push({
                             data_apontamento: row.data_avaliacao,
                             supervisor_nome: row.supervisor_nome,
                             topico_falhado: 'Feedback Geral',
                             justificacao: row.justificacao,
                             nota_atribuida: 'N/A'
                         });
                     }
                });

                // 3. Fetch Apontamentos Negativos Específicos
                const { data: anotacoesRaw } = await supabase.from('apontamentos_negativos')
                    .select('data_apontamento, topico_falhado, nota_atribuida, justificacao, supervisor_nome')
                    .eq('funcionario_id', operadorId)
                    .order('data_apontamento', { ascending: false })
                    .limit(20);

                if (anotacoesRaw) {
                    anotacoesRaw.forEach(a => feedbacksUnificados.push(a));
                }
            }

            setHistoricoRadar(formattedRadar);
            setHistoricoLinha(formattedLinha);

            // Ordenar todos os feedbacks por Data (Decrescente) e filtrar duplicados acidentais se o apontamento "Geral" estiver 2 vezes (via justificativas JSON vs DB table)
            const uniqueFeedbacks = Array.from(new Set(feedbacksUnificados.map(a => JSON.stringify(a))))
                .map(str => JSON.parse(str))
                .sort((a, b) => new Date(b.data_apontamento).getTime() - new Date(a.data_apontamento).getTime())
                .slice(0, 15); // Top 15 recentes

            setApontamentosNegativos(uniqueFeedbacks);
            setIsLoading(false);
        };

        carregarDadosIndividuais();
    }, [isOpen, operadorId, operadorRfid, supabase]);

    const handleGerarMentoria = async () => {
        if (!aiContext) return;
        setIsAiLoading(true);
        setAiResult(null);

        try {
            const res = await fetch('/api/ai/mentoria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: nomeOperador,
                    cargo: isLeader ? 'Liderança' : 'Operador',
                    area: funcaoArea,
                    equipaOee: aiContext.equipaOee,
                    mtrAndon: aiContext.mtrAndon,
                    mentoriaScore: aiContext.mentoriaScore,
                    mentorshipCount: aiContext.mentorshipCount,
                    notaHst: aiContext.notaHst,
                    notaObjetivos: aiContext.notaObjetivos
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAiResult(data.data);
        } catch (error: any) {
            console.error(error);
            alert(`Falha da Inteligência Artificial: ${error.message}`);
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            {/* O Trigger foi removido pois abrimos controladamente via state */}
            <DialogContent className="max-w-[1400px] max-h-[90vh] overflow-y-auto p-0 border-none bg-slate-50 shadow-2xl">
                <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-6 shadow-sm">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xl flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-slate-200">
                                {nomeOperador ? nomeOperador.substring(0, 2).toUpperCase() : '?'}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-extrabold text-slate-800 tracking-tight">{nomeOperador || 'Carregando...'}</DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium text-sm mt-1 whitespace-nowrap">
                                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 mr-2 border border-slate-200">{operadorRfid || 'N/A'}</span>
                                    {funcaoArea || 'Geral'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-20 animate-pulse text-slate-400">
                            <Activity className="animate-bounce mb-4 text-blue-300" size={32} />
                            <p className="font-semibold text-sm uppercase tracking-widest">A carregar métricas M.E.S...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                            {/* COL 1: O Perfil Estático (Radar Recharts) */}
                            <div className="xl:col-span-2 space-y-8">
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-[460px] flex flex-col">
                                    <h3 className="text-xs uppercase tracking-widest font-extrabold text-slate-500 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                                        <TrendingUp size={16} className="text-indigo-500" /> Perfil Competências {isLeader ? '(Liderança)' : '(Operador)'}
                                    </h3>
                                    <div className="flex-1 -mx-4 -mt-2">
                                        <RadarClientChart data={historicoRadar} />
                                    </div>
                                </div>

                                {(() => {
                                    const validScores = historicoRadar.filter(r => r.A > 0 && r.A <= 3.2);
                                    if (validScores.length === 0) return null;

                                    const worstSubjectObj = validScores.sort((a,b) => a.A - b.A)[0];
                                    const score = worstSubjectObj.A;
                                    
                                    const aiEngine = (subject: string, nota: number) => {
                                        const severity = nota < 2.5 ? 'Crítico' : 'Atenção';
                                        
                                        const database: Record<string, {crit: string, aten: string}> = {
                                            'EPI & Fardamento': { 
                                                crit: 'Abaixo do limite legal de HST. Necessário realizar um Safety Walk imediato na linha, validar entrega de fardamento e aplicar medida imperativa disciplinar/educativa.',
                                                aten: 'Desvio ao standard visual de fardamento/EPIs. Recomendado "Momento 5 min HST" antes do turno arrancar focando nas regras base.'
                                            },
                                            'Assiduidade (HST)': {
                                                crit: 'Rácio de ausências altamente prejudicial para o balanceamento logístico. Liderança tem de coordenar com RH avaliação de bem-estar.',
                                                aten: 'Ausências parciais recorrentes a afetar o OEE. Recomenda-se um check-in de mentoria (1-on-1) de 15 minutos para avaliar desmotivações logísticas.'
                                            },
                                            'Qualidade': {
                                                crit: 'Intervenção técnica imediata obrigatória. O colaborador está a injetar falhas crónicas na linha OEE. Requer shadowing (sombreamento) 100% do tempo.',
                                                aten: 'Aumento do rácio estatístico de retrabalho registado. Aconselha-se nova sessão de calibração técnica usando os standards visuais (Gabaritos Brunswick).'
                                            },
                                            'Auditoria Qualidade': {
                                                crit: 'Intervenção técnica imediata obrigatória. Injeções contínuas de retrabalho detetadas nas avaliações cruzadas.',
                                                aten: 'Pequenos desvios crónicos no acabamento. Recomendável rotina de aferimento diário com um elemento sénior da equipa de Auditoria.'
                                            },
                                            'Metodologia 5S': {
                                                crit: 'Caos estatístico no posto comprometendo eficiência produtiva. Implementar "Blitz 5S" emergencial com linha parada para o recuperar.',
                                                aten: 'Degradação progressiva da organização do layout de linha. Incluir rotinas "Muda" de 10 minutos finais exclusivos para limpeza.'
                                            },
                                            'Eficiência Lider.': {
                                                crit: 'Gestão de linha ineficaz e TAKT Time perdido severamente. O líder requer acompanhamento sénior em Lean VSM e revisão da folha Standard Work.',
                                                aten: 'OEE intermitente denota falta de standardização de ritmos operacionais. Recomendável rever com a equipa o cronograma diário.'
                                            },
                                            'Gestão/Motivação': {
                                                crit: 'Indicadores apontam para quebra moral aguda ou micro-gestão extrema. Sugerida intervenção direta de RH para desanuviar o grupo de imediato.',
                                                aten: 'Déficit no engagement tático da equipa. A Liderança tem de receber formação situacional e começar rotinas de Daily Standup.'
                                            },
                                            'Gestão de KPIs': {
                                                crit: 'Liderança ignora Andons e M.E.S de forma sistemática. Exige reciclagem obrigatória no uso dos écrans industriais e interpretação métrica.',
                                                aten: 'Reatividade tardia aos alertas na Nuvem. Aconselha-se mentoria focada para utilização preditiva de dashboards, alertando a manutenção com avanço.'
                                            },
                                            'Rendimento OEE': {
                                                crit: 'Produtividade sistematicamente abaixo da margem bruta projetada. Ler guias Standard Operating Procedures (SOPs) e avaliar barreiras físicas.',
                                                aten: 'Inconsistência de ritmo de montagem denota necessidade de calibrar micro-tempos nas folhas Standard Work.'
                                            },
                                            'Polivalência': {
                                                crit: 'Zero flexibilidade e recusa de cross-training. Representa um risco de estrangulamento. Impor matriz de contingência obrigatória noutro posto.',
                                                aten: 'Lento desenrolar tático em rotações. Colocar como Operador Sombra de técnicos experientes em postos limítrofes 2 dias por mês.'
                                            },
                                            'Inovação / Kaisen': {
                                                crit: 'Apatia total à Cultura Lean Brunswick ou comportamentos reativos ao Kaizen.',
                                                aten: 'Pouca contribuição sistémica de melhoria contínua. Gestor deve incitar a submissão formal ao M.E.S IDEAS Módulo.'
                                            }
                                        };

                                        const defaultMsg = 'Recomenda-se acompanhamento presencial do Gestor nos postos (Gemba Walk) embasado nesta divergência de scores.';
                                        const advice = database[subject] ? (severity === 'Crítico' ? database[subject].crit : database[subject].aten) : defaultMsg;
                                        
                                        return { suggestion: advice, severity };
                                    };

                                    const analysis = aiEngine(worstSubjectObj.subject, score);

                                    return (
                                        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-sm border border-indigo-100 p-6 relative mt-8">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-full blur-2xl -mr-10 -mt-10 opacity-60"></div>
                                            
                                            {isLeader && aiContext ? (
                                                // Painel de IA Google Gemini (Apenas para Liderança)
                                                <div className="relative z-10">
                                                   <div className="flex items-center justify-between border-b border-indigo-100 pb-3 mb-4">
                                                       <h3 className="text-xs uppercase tracking-widest font-extrabold text-indigo-800 flex items-center gap-2">
                                                           <Lightbulb size={16} className="text-indigo-600" /> Co-Piloto de Mentoria Dirigências (AI)
                                                       </h3>
                                                       <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded uppercase">Google Gemini V1.5</span>
                                                   </div>

                                                   {!aiResult ? (
                                                       <button 
                                                           onClick={handleGerarMentoria} 
                                                           disabled={isAiLoading}
                                                           className="w-full flex flex-col items-center justify-center p-6 bg-indigo-900 hover:bg-indigo-800 transition-colors border border-indigo-700 rounded-lg shadow-lg group disabled:opacity-50"
                                                       >
                                                           {isAiLoading ? (
                                                               <>
                                                                   <Activity className="text-indigo-300 animate-spin mb-3" size={32} />
                                                                   <span className="text-sm font-bold text-indigo-100 uppercase tracking-widest">A SINTETIZAR 6 PILARES...</span>
                                                               </>
                                                           ) : (
                                                               <>
                                                                   <div className="w-12 h-12 bg-indigo-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ring-4 ring-indigo-500/20">
                                                                       <Activity className="text-indigo-300" size={24} />
                                                                   </div>
                                                                   <span className="text-sm font-bold text-white uppercase tracking-widest">Gerar Diagnóstico & P.D.I.</span>
                                                                   <span className="text-xs text-indigo-300 mt-1 text-center font-medium max-w-[80%]">Analisa OEE Equipa, Tempo Resposta Andon, Avaliações Direção e Bottom-Up</span>
                                                               </>
                                                           )}
                                                       </button>
                                                   ) : (
                                                       <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                           <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                                                               <h4 className="text-xs font-bold uppercase text-orange-800 flex items-center gap-2 mb-2"><AlertTriangle size={14}/> Alertas Críticos</h4>
                                                               <ul className="text-sm text-orange-900 space-y-1 list-disc pl-4 font-medium">
                                                                   {aiResult.alertas.map((al: string, idx: number) => <li key={idx}>{al}</li>)}
                                                               </ul>
                                                           </div>

                                                           <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg">
                                                               <h4 className="text-xs font-bold uppercase text-emerald-800 flex items-center gap-2 mb-2"><TrendingUp size={14}/> Elogios Direcionados</h4>
                                                               <ul className="text-sm text-emerald-900 space-y-1 list-disc pl-4 font-medium">
                                                                   {aiResult.elogios.map((el: string, idx: number) => <li key={idx}>{el}</li>)}
                                                               </ul>
                                                           </div>

                                                           <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                                               <h4 className="text-xs font-bold uppercase text-blue-800 flex items-center gap-2 mb-2"><Lightbulb size={14}/> P.D.I (Plano de Acção)</h4>
                                                               <ul className="text-sm text-blue-900 space-y-2 font-semibold">
                                                                   {aiResult.pdi.map((pdite: string, idx: number) => (
                                                                       <li key={idx} className="flex items-start gap-2 bg-white/60 p-2 rounded">
                                                                           <span className="bg-blue-200 text-blue-800 rounded px-1.5 py-0.5 text-[10px] w-auto h-auto shrink-0 mt-0.5">#{idx+1}</span>
                                                                           {pdite}
                                                                       </li>
                                                                   ))}
                                                               </ul>
                                                           </div>

                                                           <button onClick={() => setAiResult(null)} className="text-[10px] uppercase font-bold text-indigo-500 hover:text-indigo-700 w-full text-center mt-2 border-t border-indigo-100 pt-2">
                                                               Limpar Diagnóstico M.E.S
                                                           </button>
                                                       </div>
                                                   )}
                                                </div>
                                            ) : (
                                                // Painel Antigo Tático Baseado na Avaliação Estática (Para Operários)
                                                <>
                                                   <h3 className="text-xs uppercase tracking-widest font-extrabold text-indigo-800 mb-4 flex items-center gap-2 border-b border-indigo-100 pb-3 relative z-10">
                                                       <Lightbulb size={16} className="text-indigo-600" /> Analítica PDI: Assistente Tático Baseado na Avaliação
                                                   </h3>
                                                   
                                                   <div className="relative z-10">
                                                       <div className="flex items-center gap-2 mb-2">
                                                           <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${analysis.severity === 'Crítico' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                               Detetado Desvio: Nível {analysis.severity}
                                                           </span>
                                                           <span className="text-xs font-bold text-slate-700">{worstSubjectObj.subject} (Score Base de Dados: {score.toFixed(1)})</span>
                                                       </div>
                                                       <div className="bg-white/90 p-4 rounded-lg border border-indigo-50 shadow-sm relative mt-3 transition-all hover:border-indigo-200">
                                                           <div className="absolute left-0 top-0 w-1 h-full bg-indigo-400 rounded-l-lg"></div>
                                                           <p className="text-[13px] text-slate-800 leading-relaxed font-semibold italic pl-2">
                                                               "{analysis.suggestion}"
                                                           </p>
                                                       </div>
                                                       <div className="mt-3 text-[9px] text-indigo-400 font-bold uppercase tracking-widest text-right flex items-center justify-end gap-1">
                                                           <Activity size={10} /> Consultoria M.E.S Operacional
                                                       </div>
                                                   </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* COL 2: Trajetória Temporal & Feedbacks (Linear + Lista) */}
                            <div className="xl:col-span-3 space-y-8">
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-[400px]">
                                    <h3 className="text-xs uppercase tracking-widest font-extrabold text-slate-500 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                                        <Activity size={16} className="text-blue-500" /> {isLeader ? 'Tendência Eficiência e Gestão' : 'Tendência Produtividade OEE'} (30 Dias)
                                    </h3>
                                    <div className="h-[280px]">
                                        <LineClientChart data={historicoLinha} />
                                    </div>
                                </div>

                                <div className="bg-rose-50/30 rounded-xl shadow-sm border border-rose-100 p-6">
                                    <h3 className="text-xs uppercase tracking-widest font-extrabold text-rose-800 mb-6 flex items-center gap-2 border-b border-rose-100 pb-3">
                                        <AlertTriangle size={16} className="text-rose-600" /> Diário de Inconformidades (Feedback Mode)
                                    </h3>

                                    {apontamentosNegativos.length === 0 ? (
                                        <div className="text-center py-8 text-emerald-600 font-medium bg-emerald-50 rounded-lg border border-emerald-100">
                                            🎉 Nenhuma infração ou nota inferior a 2.0 foi registada nos últimos tempos. Desempenho Impecável!
                                        </div>
                                    ) : (
                                        <ul className="space-y-4">
                                            {apontamentosNegativos.map((incidente, i) => (
                                                <li key={i} className="bg-white p-4 rounded-lg shadow-sm border border-rose-100 relative overflow-hidden group">
                                                    <div className="absolute left-0 top-0 w-1 h-full bg-rose-400"></div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <XCircle size={14} className="text-rose-500" />
                                                            <span className="font-bold text-slate-800 text-sm">Problema de {incidente.topico_falhado}</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold tracking-wider text-rose-500 bg-rose-50 px-2 py-1 rounded">Nota: {incidente.nota_atribuida}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-md border border-slate-100 my-3">
                                                        "{incidente.justificacao}"
                                                    </p>
                                                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                        <span>Registado a {new Date(incidente.data_apontamento).toLocaleDateString('pt-PT')}</span>
                                                        <span>Auditor: {incidente.supervisor_nome}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

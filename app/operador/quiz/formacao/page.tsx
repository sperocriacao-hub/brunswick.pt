"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ArrowRight, ShieldCheck, Search, ShieldAlert, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { iniciarSessaoFormacao, carregarPerguntasFormacao, submeterFormacaoFeedback, IdentidadeFormacao } from './actions';
import { PerguntaQuizGroup } from '@/app/admin/rh/gestao-quizzes/actions';

export default function QuiosqueFormacao() {
    const router = useRouter();
    // 'login' | 'intro' | 'quiz' | 'obrigado'
    const [fase, setFase] = useState<'login' | 'intro' | 'quiz' | 'obrigado'>('login');
    const [rfidInput, setRfidInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [identidade, setIdentidade] = useState<IdentidadeFormacao | null>(null);
    const [perguntas, setPerguntas] = useState<PerguntaQuizGroup[]>([]);
    
    // Motor
    const [passoAtual, setPassoAtual] = useState(0);
    const [respostas, setRespostas] = useState<{formacao_id: string, pergunta_id: string, avaliador_id: string, nota: number}[]>([]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setIsLoading(true);

        const resId = await iniciarSessaoFormacao(rfidInput);
        if (!resId.success || !resId.data) {
            setErrorMsg(resId.error || "Operador não reconhecido em Planos de Formação.");
            setIsLoading(false);
            return;
        }

        const id = resId.data;
        const resPergts = await carregarPerguntasFormacao(id.funcao_ativa);
        
        if (resPergts.length === 0) {
            setErrorMsg(`Nenhum Inquérito programado para si (Papel: ${id.funcao_ativa}) neste momento.`);
            setIsLoading(false);
            return;
        }

        setIdentidade(id);
        setPerguntas(resPergts);
        setFase('intro');
        setIsLoading(false);
    };

    const iniciarQuiz = () => {
        setFase('quiz');
        setPassoAtual(0);
        setRespostas([]);
    };

    const handleResposta = async (nota: number) => {
        if (!identidade) return;
        const p = perguntas[passoAtual];
        const newAns = [...respostas, { 
            formacao_id: identidade.formacao_id, 
            pergunta_id: p.id, 
            avaliador_id: identidade.operador_id,
            nota: nota 
        }];
        
        if (passoAtual + 1 >= perguntas.length) {
            // FINISH
            setIsLoading(true);
            await submeterFormacaoFeedback(newAns);
            setIsLoading(false);
            setFase('obrigado');
            setTimeout(() => {
                router.push('/operador/quiz'); 
            }, 6000);
        } else {
            setRespostas(newAns);
            setPassoAtual(prev => prev + 1);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-orange-500">
            {fase === 'login' && (
                <div className="max-w-md w-full animate-in zoom-in duration-500">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-900/50">
                            <Search className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">Academia Fabril</h1>
                        <p className="text-orange-200 mt-2 font-medium">Classifique a Formação Ocorrente em Tempo Real</p>
                    </div>

                    <Card className="border-slate-800 bg-slate-900 shadow-2xl">
                        <CardContent className="pt-6">
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Passe o seu Crachá na Leitora</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        className="w-full h-14 bg-slate-800 border-2 border-slate-700 rounded-xl text-center text-2xl font-mono text-white tracking-widest focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all placeholder:text-slate-600"
                                        placeholder="OP-XXX"
                                        value={rfidInput}
                                        onChange={(e) => setRfidInput(e.target.value.toUpperCase())}
                                        disabled={isLoading}
                                    />
                                    {errorMsg && <p className="text-red-400 text-sm mt-3 text-center animate-bounce font-medium">{errorMsg}</p>}
                                </div>
                                <Button 
                                    className="w-full h-14 text-lg font-bold bg-orange-600 hover:bg-orange-500 text-white border-none"
                                    type="submit"
                                    disabled={!rfidInput || isLoading}
                                >
                                    {isLoading ? "A detetar Formação Ativa..." : "Validar Crachá"}
                                </Button>
                            </form>
                            <p className="text-xs text-slate-500 text-center mt-6">
                                Apenas formadores ou formandos com ILUO Academy ativo podem aceder a este quiosque.
                            </p>
                            <div className="mt-4 flex justify-center">
                                <Button variant="link" className="text-slate-500" onClick={() => router.push('/operador/quiz')}>Voltar ao Menu</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {fase === 'intro' && identidade && (
                <div className="max-w-2xl w-full text-center py-20 px-8 bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl animate-in slide-in-from-right duration-300">
                    <GraduationCap className="w-24 h-24 text-orange-500 mx-auto mb-6 opacity-90 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                    <h2 className="text-3xl font-black text-white">Sessão da Máquina: {identidade.estacao_nome}</h2>
                    
                    <div className="mt-6 inline-flex flex-col items-center bg-slate-800 rounded-3xl p-6 border border-slate-700">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">O seu papel nesta formação é de:</span>
                        <span className="text-2xl text-orange-400 font-black uppercase tracking-widest bg-orange-950/40 px-4 py-2 rounded-xl mb-4">{identidade.funcao_ativa}</span>
                        
                        <p className="text-slate-300 font-medium">Irá avaliar secretamente a performance e capacidades do Operador:</p>
                        <span className="text-3xl font-black text-white mt-1">{identidade.alvo_nome}</span>
                    </div>

                    <div className="mt-10">
                        <Button className="h-14 px-10 text-lg bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-full shadow-[0_0_20px_rgba(249,115,22,0.4)]" onClick={iniciarQuiz}>
                            Abrir Questionário <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                </div>
            )}

            {fase === 'quiz' && (
                <div className="max-w-4xl w-full animate-in slide-in-from-right duration-300">
                    {/* Progress Bar Laranja */}
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-8 shadow-inner">
                        <div 
                            className="h-full bg-orange-500 transition-all duration-500"
                            style={{ width: `${(passoAtual / (perguntas.length - 1)) * 100}%`}}
                        />
                    </div>

                    <div className="text-center bg-slate-900 rounded-[3rem] p-10 md:p-16 border border-slate-800 shadow-2xl">
                         <div className="mb-12">
                            <span className="text-orange-500 font-bold tracking-widest uppercase text-sm bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20">
                                Pergunta {passoAtual + 1} de {perguntas.length}
                            </span>
                            <h2 className="text-3xl md:text-5xl font-black text-white mt-8 leading-tight">
                                {perguntas[passoAtual].texto_pergunta}
                            </h2>
                         </div>

                         {/* Carinhas Formação (Estrelas numéricas largas) */}
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
                            {[1, 2, 3, 4].map(nota => (
                                <button
                                    key={nota}
                                    onClick={() => handleResposta(nota)}
                                    disabled={isLoading}
                                    className="group relative flex flex-col items-center justify-center p-8 md:py-16 bg-slate-800 rounded-3xl border-2 border-slate-700 hover:border-orange-500 hover:bg-slate-800 transition-all hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(249,115,22,0.2)] disabled:opacity-50"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-orange-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
                                    <span className="text-5xl font-black text-slate-400 group-hover:text-white z-10 transition-colors drop-shadow-md">{nota}</span>
                                    <div className="flex gap-1 mt-4 z-10">
                                        {[...Array(nota)].map((_, i) => <Star key={i} className="w-4 h-4 fill-orange-500 text-orange-500 animate-in zoom-in" />)}
                                    </div>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-4 group-hover:text-orange-300 z-10 transition-colors">
                                        {nota === 1 ? 'Insatisfatório' : nota === 2 ? 'Razoável' : nota === 3 ? 'Bom' : 'Excelente'}
                                    </span>
                                </button>
                            ))}
                         </div>
                    </div>
                </div>
            )}

            {fase === 'obrigado' && identidade && (
                 <div className="text-center animate-in zoom-in duration-500 border border-slate-800 bg-slate-900 p-16 rounded-[3rem] shadow-2xl max-w-xl w-full">
                    <ShieldCheck className="w-32 h-32 text-orange-500 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(249,115,22,0.3)]" />
                    <h1 className="text-5xl font-black text-white mb-4">Mural do Mérito Atualizado!</h1>
                    <p className="text-xl text-slate-400">
                        O seu feedback foi guardado de forma imutável e reflete-se a partir deste momento no Rating ILUO Formação. Ao terminar, a sua ficha será atualizada pelo gestor.
                    </p>
                    <div className="mt-10">
                        <p className="text-slate-600 font-mono text-sm animate-pulse">A encerrar ligação aos painéis Mestres da Administração...</p>
                    </div>
                 </div>
            )}
        </div>
    );
}

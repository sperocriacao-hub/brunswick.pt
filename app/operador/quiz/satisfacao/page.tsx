"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeartHandshake, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { carregarPerguntasSatisfacao, carregarAreasFoco, submeterSatisfacao } from './actions';
import { PerguntaQuizGroup } from '@/app/admin/rh/gestao-quizzes/actions';

export default function QuiosqueSatisfacao() {
    const router = useRouter();
    const [perguntas, setPerguntas] = useState<PerguntaQuizGroup[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    
    // State Machine
    const [fase, setFase] = useState<'area' | 'quiz' | 'obrigado'>('area');
    const [areaEscolhida, setAreaEscolhida] = useState<string | null>(null);
    const [passoAtual, setPassoAtual] = useState(0);
    const [respostas, setRespostas] = useState<{pergunta_id: string, nota: number}[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        carregarTudo();
    }, []);

    const carregarTudo = async () => {
        const [pergs, ar] = await Promise.all([
            carregarPerguntasSatisfacao(),
            carregarAreasFoco()
        ]);
        setPerguntas(pergs);
        setAreas(ar);
    };

    const handleSelectArea = (id: string | null) => {
        setAreaEscolhida(id);
        if (perguntas.length > 0) {
            setFase('quiz');
        } else {
            setFase('obrigado'); // Não há perguntas!
        }
    };

    const handleResposta = async (nota: number) => {
        const p = perguntas[passoAtual];
        const newAns = [...respostas, { pergunta_id: p.id, nota }];
        
        if (passoAtual + 1 >= perguntas.length) {
            // FIM
            setIsSubmitting(true);
            await submeterSatisfacao(areaEscolhida, newAns);
            setIsSubmitting(false);
            setFase('obrigado');
            setTimeout(() => {
                router.push('/operador/quiz'); // Volta para o hub após 5 segundos
            }, 5000);
        } else {
            setRespostas(newAns);
            setPassoAtual(prev => prev + 1);
        }
    };

    return (
        <div className="min-h-screen bg-pink-950/20 flex flex-col items-center justify-center p-4 selection:bg-pink-500">
            {/* Header de Segurança e Anonimato */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center opacity-50 pointer-events-none">
                <div className="flex items-center gap-2 font-mono text-sm text-slate-500">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" /> Sessão 100% Criptografada e Anónima
                </div>
            </div>

            {fase === 'area' && (
                <div className="max-w-3xl w-full animate-in zoom-in duration-500 text-center">
                    <HeartHandshake className="w-24 h-24 text-pink-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-4">Como se sentiu hoje?</h1>
                    <p className="text-slate-500 text-lg mb-10 max-w-xl mx-auto">Queremos ouvir a sua voz! Sem nomes, sem medo. As suas respostas ajudam à construção coletiva de uma Brunswick melhor. Diga-nos primeiro: em que secção trabalhou hoje predominantemente?</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <button 
                            onClick={() => handleSelectArea(null)}
                            className="p-6 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl shadow-md transition-transform hover:scale-105 flex flex-col items-center"
                        >
                            <HelpCircle className="w-8 h-8 opacity-50 mb-2" />
                            <span className="font-bold">Prefiro Não Dizer</span>
                        </button>
                        {areas.map(a => (
                            <button 
                                key={a.id}
                                onClick={() => handleSelectArea(a.id)}
                                className="p-6 bg-white hover:bg-pink-50 text-slate-800 border-2 border-transparent hover:border-pink-200 rounded-2xl shadow-md transition-transform hover:scale-105 font-bold flex items-center justify-center"
                            >
                                {a.nome_area}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {fase === 'quiz' && perguntas.length > 0 && (
                <div className="max-w-3xl w-full animate-in slide-in-from-right duration-300">
                    {/* Progress Bar Verde/Rosa */}
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mb-12 shadow-inner">
                        <div 
                            className="h-full bg-pink-500 transition-all duration-500"
                            style={{ width: `${(passoAtual / (perguntas.length - 1)) * 100}%`}}
                        />
                    </div>

                    <div className="text-center bg-white rounded-[3rem] p-10 md:p-16 border border-slate-100 shadow-2xl">
                         <div className="mb-12">
                            <span className="text-pink-500 font-bold tracking-widest uppercase text-sm bg-pink-50 px-3 py-1 rounded-full">
                                {perguntas[passoAtual].categoria || "Clima Geral"}
                            </span>
                            <h2 className="text-3xl md:text-5xl font-black text-slate-800 mt-6 leading-tight">
                                {perguntas[passoAtual].texto_pergunta}
                            </h2>
                         </div>

                         {/* Carinhas */}
                         <div className="grid grid-cols-5 gap-2 md:gap-4 mt-12">
                            {[1,2,3,4,5].map(nota => (
                                <button
                                    key={nota}
                                    onClick={() => handleResposta(nota)}
                                    disabled={isSubmitting}
                                    className="group flex flex-col items-center gap-4 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                                >
                                    <div className={`w-14 h-14 md:w-24 md:h-24 rounded-full flex items-center justify-center border-[3px] shadow transition-all ${
                                        nota === 1 ? 'border-red-500 bg-red-50 text-red-600' :
                                        nota === 2 ? 'border-orange-500 bg-orange-50 text-orange-600' :
                                        nota === 3 ? 'border-amber-400 bg-amber-50 text-amber-500' :
                                        nota === 4 ? 'border-lime-500 bg-lime-50 text-lime-600' :
                                        'border-green-500 bg-green-50 text-green-600'
                                    } group-hover:bg-opacity-100 group-hover:text-white ${
                                        nota === 1 ? 'group-hover:bg-red-500' :
                                        nota === 2 ? 'group-hover:bg-orange-500' :
                                        nota === 3 ? 'group-hover:bg-amber-400' :
                                        nota === 4 ? 'group-hover:bg-lime-500' :
                                        'group-hover:bg-green-500'
                                    }`}>
                                        <span className="text-2xl md:text-4xl font-black">{nota}</span>
                                    </div>
                                </button>
                            ))}
                         </div>
                         <div className="flex justify-between w-full mt-6 text-slate-400 font-bold uppercase tracking-widest text-xs px-2">
                            <span>Discordo Totalmente</span>
                            <span>Concordo Plenamente</span>
                         </div>
                    </div>
                </div>
            )}

            {fase === 'obrigado' && (
                 <div className="text-center animate-in zoom-in duration-500 border border-pink-200 bg-white p-16 rounded-[3rem] shadow-xl max-w-xl w-full">
                    <HeartHandshake className="w-32 h-32 text-pink-500 mx-auto mb-6 drop-shadow-md" />
                    <h1 className="text-5xl font-black text-slate-800 mb-4">Gratidão!</h1>
                    <p className="text-xl text-slate-500">
                        O seu anonimato foi preservado. Entregámos a sua mensagem nos cofres do Sistema de Clima Pessoal.
                    </p>
                    <div className="mt-10">
                        <Button variant="outline" className="rounded-full shadow" onClick={() => router.push('/operador/quiz')}>Voltar ao Menu do Quiosque</Button>
                    </div>
                 </div>
            )}
        </div>
    );
}

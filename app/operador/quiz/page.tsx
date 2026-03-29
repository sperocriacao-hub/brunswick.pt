"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowRight, ShieldCheck, UserCheck, Search, Frown, Meh, Smile, Heart, ThumbsDown, Star } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    iniciarSessaoQuiosque, 
    IdentidadeAnonima, 
    carregarPerguntasAtivasParaQuiosque, 
    submeterQuizAnonimo, 
    RespostaAnonimaDTO 
} from './actions';
import { PerguntaQuiz } from '@/app/admin/rh/quiz-cultura/actions';

export default function QuiosqueFormalOperador() {
    // Fases: 'login' | 'quiz' | 'obrigado'
    const [fase, setFase] = useState<'login' | 'quiz' | 'obrigado'>('login');
    const [rfidInput, setRfidInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [identidade, setIdentidade] = useState<IdentidadeAnonima | null>(null);
    const [perguntas, setPerguntas] = useState<PerguntaQuiz[]>([]);
    const [respostas, setRespostas] = useState<RespostaAnonimaDTO[]>([]);

    // Índice da pergunta atual no carrossel
    const [passoAtual, setPassoAtual] = useState(0);

    // Estrutura plana de "Páginas do Quiz" para o utilizador
    const [paginas, setPaginas] = useState<{
        tipo: 'lider_intro' | 'super_intro' | 'gestor_intro' | 'cultura_intro' | 'pergunta';
        title?: string;
        pergunta?: PerguntaQuiz;
        alvoConfig?: { nome: string; escala: string }; // Se for pergunta de Liderança
    }[]>([]);

    useEffect(() => {
        carregarConfigPeloSistema();
    }, []);

    const carregarConfigPeloSistema = async () => {
        const res = await carregarPerguntasAtivasParaQuiosque();
        if (res.success && res.data) {
            setPerguntas(res.data);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setIsLoading(true);

        const res = await iniciarSessaoQuiosque(rfidInput);
        if (!res.success || !res.data) {
            setErrorMsg(res.error || "Operador não reconhecido na Linha.");
            setIsLoading(false);
            return;
        }

        setIdentidade(res.data);
        montarCarrossel(res.data, perguntas);
        setFase('quiz');
        setPassoAtual(0);
        setIsLoading(false);
    };

    const montarCarrossel = (id: IdentidadeAnonima, pergs: PerguntaQuiz[]) => {
        let flow: any[] = [];
        const liders = pergs.filter(p => p.tipo_alvo === 'Liderança');
        const cults = pergs.filter(p => p.tipo_alvo === 'Cultura');

        if (id.lider_nome && liders.length > 0) {
            flow.push({ tipo: 'lider_intro', title: `Avaliação do Coordenador` });
            liders.forEach(p => flow.push({ tipo: 'pergunta', pergunta: p, alvoConfig: { nome: id.lider_nome!, escala: 'Coordenador' }}));
        }
        if (id.supervisor_nome && liders.length > 0) {
            flow.push({ tipo: 'super_intro', title: `Avaliação do Supervisor` });
            liders.forEach(p => flow.push({ tipo: 'pergunta', pergunta: p, alvoConfig: { nome: id.supervisor_nome!, escala: 'Supervisor' }}));
        }
        if (id.gestor_nome && liders.length > 0) {
            flow.push({ tipo: 'gestor_intro', title: `Avaliação do Gestor` });
            liders.forEach(p => flow.push({ tipo: 'pergunta', pergunta: p, alvoConfig: { nome: id.gestor_nome!, escala: 'Gestor' }}));
        }
        if (cults.length > 0) {
            flow.push({ tipo: 'cultura_intro', title: `Avaliação do Ambiente de Fábrica` });
            cults.forEach(p => flow.push({ tipo: 'pergunta', pergunta: p, alvoConfig: null }));
        }

        setPaginas(flow);
    };

    const handleResposta = async (nota: number) => {
        const pag = paginas[passoAtual];
        if (pag.tipo === 'pergunta' && pag.pergunta) {
            setRespostas(prev => [...prev, {
                pergunta_id: pag.pergunta!.id,
                nota: nota,
                lider_avaliado_nome: pag.alvoConfig?.nome || null,
                escala_alvo: pag.alvoConfig?.escala || null
            }]);
        }

        if (passoAtual + 1 >= paginas.length) {
            // FIM do Quiz
            setIsLoading(true);
            await submeterQuizAnonimo(respostas.concat([{ // Garante a inclusão do atual no state de envio
                pergunta_id: pag.pergunta!.id, nota, lider_avaliado_nome: pag.alvoConfig?.nome || null, escala_alvo: pag.alvoConfig?.escala || null
            }]));
            setIsLoading(false);
            setFase('obrigado');
            setTimeout(() => {
                resetQuiosque();
            }, 6000);
        } else {
            setPassoAtual(prev => prev + 1);
        }
    };

    const proximoPassoZeroNota = () => {
        setPassoAtual(prev => prev + 1);
    };

    const resetQuiosque = () => {
        setFase('login');
        setRfidInput("");
        setRespostas([]);
        setPassoAtual(0);
        setIdentidade(null);
    };

    if (perguntas.length === 0 && fase === 'login') {
        return <div className="p-20 text-center flex flex-col items-center">
            <ShieldAlert className="w-16 h-16 text-slate-300 mb-4 animate-pulse" />
            <h1 className="text-2xl font-bold text-slate-700">Quiosque de Recursos Humanos</h1>
            <p className="text-slate-500">Sem inquéritos ativos de momento.</p>
        </div>
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-blue-500">
            {fase === 'login' && (
                <div className="max-w-md w-full animate-in zoom-in duration-500">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-900/50">
                            <Search className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">Portal RH</h1>
                        <p className="text-blue-200 mt-2 font-medium">Inquérito Cultural e Diário (100% Anónimo)</p>
                    </div>

                    <Card className="border-slate-800 bg-slate-900 shadow-2xl">
                        <CardContent className="pt-6">
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Passe o Crachá ou insira Nº de Operador</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        className="w-full h-14 bg-slate-800 border-2 border-slate-700 rounded-xl text-center text-2xl font-mono text-white tracking-widest focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-600"
                                        placeholder="OP-XXX"
                                        value={rfidInput}
                                        onChange={(e) => setRfidInput(e.target.value.toUpperCase())}
                                        disabled={isLoading}
                                    />
                                    {errorMsg && <p className="text-red-400 text-sm mt-3 text-center animate-bounce font-medium">{errorMsg}</p>}
                                </div>
                                <Button 
                                    className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white border-none"
                                    type="submit"
                                    disabled={!rfidInput || isLoading}
                                >
                                    {isLoading ? "A Verificar Base de Dados..." : "Entrar de Forma Anónima"}
                                </Button>
                            </form>
                            <p className="text-xs text-slate-500 text-center mt-6">
                                Este inquérito é matematicamente encriptado. A administração não tem forma de relacionar o seu código operativo com a classificação que irá dar na sala seguinte.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {fase === 'quiz' && paginas.length > 0 && (
                <div className="max-w-2xl w-full animate-in slide-in-from-right duration-300">
                    
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-8">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${(passoAtual / (paginas.length - 1)) * 100}%`}}
                        />
                    </div>

                    {paginas[passoAtual].tipo.endsWith('_intro') ? (
                        <div className="text-center py-20 px-4 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl">
                            <UserCheck className="w-24 h-24 text-blue-500 mx-auto mb-6 opacity-80" />
                            <h2 className="text-3xl font-black text-white">{paginas[passoAtual].title}</h2>
                            {paginas[passoAtual].tipo !== 'cultura_intro' && (
                                <div className="mt-4 inline-block px-6 py-2 bg-slate-800 rounded-full border border-slate-700">
                                    <p className="text-xl text-blue-300 font-bold uppercase tracking-widest">Alvo: {identidade && (paginas[passoAtual].tipo === 'lider_intro' ? identidade.lider_nome : paginas[passoAtual].tipo === 'super_intro' ? identidade.supervisor_nome : identidade.gestor_nome)}</p>
                                </div>
                            )}
                            <p className="text-slate-400 mt-6 text-lg">Responda honestamente mediante 1 a 5 estrelas às questões que se seguem.</p>
                            <Button className="mt-10 h-14 px-10 text-lg bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full" onClick={proximoPassoZeroNota}>
                                Começar <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center bg-slate-900 rounded-3xl p-10 border border-slate-800 shadow-2xl">
                             <div className="mb-8">
                                <span className="text-blue-500 font-bold tracking-widest uppercase text-sm">
                                    {paginas[passoAtual].alvoConfig ? `Avaliação: ${paginas[passoAtual].alvoConfig?.escala} - ${paginas[passoAtual].alvoConfig?.nome}` : "Cultura Organizacional"}
                                </span>
                                <h2 className="text-3xl md:text-5xl font-black text-white mt-4 leading-tight">
                                    {paginas[passoAtual].pergunta?.texto_pergunta}
                                </h2>
                             </div>

                             <div className="grid grid-cols-5 gap-3 md:gap-6 mt-12">
                                {[1,2,3,4,5].map(nota => (
                                    <button
                                        key={nota}
                                        onClick={() => handleResposta(nota)}
                                        className="group flex flex-col items-center gap-4 transition-all hover:scale-110 active:scale-95"
                                    >
                                        <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center border-4 shadow-xl transition-all ${
                                            nota === 1 ? 'border-red-500 bg-red-500/10 text-red-500' :
                                            nota === 2 ? 'border-orange-500 bg-orange-500/10 text-orange-500' :
                                            nota === 3 ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500' :
                                            nota === 4 ? 'border-lime-500 bg-lime-500/10 text-lime-500' :
                                            'border-green-500 bg-green-500/10 text-green-500'
                                        } group-hover:bg-opacity-30`}>
                                            <span className="text-3xl md:text-5xl font-black">{nota}</span>
                                        </div>
                                    </button>
                                ))}
                             </div>
                             <div className="flex justify-between w-full mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs">
                                <span>Péssimo</span>
                                <span>Excelente</span>
                             </div>
                        </div>
                    )}
                </div>
            )}

            {fase === 'obrigado' && (
                 <div className="text-center animate-in zoom-in duration-500 border border-emerald-900 bg-emerald-950/50 p-16 rounded-3xl">
                    <ShieldCheck className="w-32 h-32 text-emerald-500 mx-auto mb-6" />
                    <h1 className="text-5xl font-black text-white mb-4">Obrigado!</h1>
                    <p className="text-xl text-emerald-200/70 max-w-lg mx-auto">
                        O seu inquérito 360 e Diagnóstico de Cultura foram guardados no Cofre da Brunswick de forma criptograficamente secreta. A sua participação melhora a fábrica.
                    </p>
                    <div className="mt-10">
                        <p className="text-slate-500 text-sm animate-pulse">A encerrar sessão HMI para o próximo colega...</p>
                    </div>
                 </div>
            )}
        </div>
    );
}

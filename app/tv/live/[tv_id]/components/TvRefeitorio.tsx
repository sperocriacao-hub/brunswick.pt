'use client';

import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, Award, Star, Activity, UserCheck, PartyPopper } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

export function TvRefeitorio({ config, data }: { config: any, data: any }) {
    const opcoes = config.opcoes_layout || {};
    const loopTempo = (opcoes.loopTempoSegundos || 15) * 1000;

    const [activeIdx, setActiveIdx] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Build the array of active slides
    const slides: { id: string, label: string, render: () => React.ReactNode }[] = [];

    if (opcoes.showRefeitorioAniversarios && data.aniversariantes?.length > 0) {
        slides.push({ id: 'NIVERS', label: 'Aniversariantes do Mês', render: () => <SlideAniversarios aniversariantes={data.aniversariantes} /> });
    }
    if (opcoes.showRefeitorioAdmissao && data.admissoes?.length > 0) {
        slides.push({ id: 'ADMISSAO', label: 'Aniversários de Admissão', render: () => <SlideAdmissoes admissoes={data.admissoes} /> });
    }
    if (opcoes.showRefeitorioHeroi && data.heroi) {
        slides.push({ id: 'HEROI', label: 'Herói do Mês', render: () => <SlideHeroi heroi={data.heroi} /> });
    }
    if (opcoes.showRefeitorioSegurancaGlob) {
        slides.push({ id: 'SEGURANCA', label: 'Dashboard de Segurança', render: () => <SlideSeguranca safetyCross={data.safetyCross} heatmap={data.heatmap} /> });
    }
    if (opcoes.showRefeitorioQualidade && data.qcis) {
        slides.push({ id: 'QUALIDADE', label: 'Quality Control (QCIS)', render: () => <SlideQualidade qcis={data.qcis} /> });
    }
    if (opcoes.showRefeitorioOee && data.oee) {
        slides.push({ id: 'OEE', label: 'Eficiência e OEE Global', render: () => <SlideOee oee={data.oee} /> });
    }
    if (opcoes.showRefeitorio5S) {
        slides.push({ id: '5S', label: 'Limpeza e 5S', render: () => <Slide5S /> });
    }

    useEffect(() => {
        const timerClock = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerClock);
    }, []);

    useEffect(() => {
        if (slides.length <= 1) return;
        const timerSlide = setInterval(() => {
            setActiveIdx(prev => (prev + 1) % slides.length);
        }, loopTempo);
        return () => clearInterval(timerSlide);
    }, [slides.length, loopTempo]);

    if (slides.length === 0) {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-300">
                <Settings size={64} className="text-slate-700 mb-4 animate-spin-slow" />
                <h1 className="text-4xl font-black uppercase tracking-widest text-slate-500">A Aguardar Configuração</h1>
                <p className="text-xl text-slate-600 mt-2">Nenhum slide ativo no backoffice para este refeitório.</p>
            </div>
        );
    }

    const currentSlide = slides[activeIdx];

    return (
        <div className="w-screen h-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100 selection:bg-blue-500/30">
            {/* Cabecalho Minimalista Institucional */}
            <header className="flex items-center justify-between px-8 py-4 bg-slate-900/80 border-b border-slate-800 shrink-0 shadow-lg">
                <div className="flex items-center gap-6">
                    {/* Brunswick Logo Mock */}
                    <div className="font-black text-3xl tracking-tighter text-white">BRUNSWICK <span className="text-blue-500">•</span> M.E.S.</div>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></span>
                        {config.nome_tv}
                    </h2>
                </div>
                <div className="flex items-center gap-8">
                    {/* Carousel Nav Hint */}
                    <div className="flex items-center gap-2">
                        {slides.map((s, i) => (
                            <div key={s.id} className={`h-2 rounded-full transition-all duration-500 ${i === activeIdx ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'}`}></div>
                        ))}
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-white tracking-widest leading-none">
                            {currentTime.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                            {currentTime.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' })}
                        </div>
                    </div>
                </div>
            </header>

            {/* Area de Conteudo Rotativo (O SLIDE EM SI) */}
            <main className="flex-1 relative w-full h-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
                <div key={currentSlide.id} className="absolute inset-0 w-full h-full flex flex-col animate-in fade-in zoom-in-95 duration-1000 p-8">
                    {currentSlide.render()}
                </div>
            </main>
        </div>
    );
}

// ----------------------------------------------------
// SLIDES COMPONENTS
// ----------------------------------------------------

function SlideAniversarios({ aniversariantes }: { aniversariantes: any[] }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <PartyPopper size={80} className="text-amber-500 mb-6 animate-bounce" />
            <h1 className="text-7xl font-black text-amber-400 uppercase tracking-tighter mb-4 text-center" style={{ textShadow: '0 10px 30px rgba(245,158,11,0.3)' }}>
                Aniversariantes do Mês
            </h1>
            <p className="text-3xl text-slate-400 font-bold uppercase tracking-widest mb-12">Muitos Parabéns à Nossa Equipa!</p>
            
            <div className="flex flex-wrap justify-center gap-8 max-w-7xl">
                {aniversariantes.slice(0, 12).map((a, i) => (
                    <div key={i} className="bg-slate-900/80 border-2 border-slate-700 p-6 rounded-3xl flex flex-col items-center justify-center min-w-[250px] shadow-2xl">
                        <div className="w-24 h-24 bg-slate-800 rounded-full border-4 border-amber-500 mb-4 overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                            {a.foto ? (
                                <img src={a.foto} alt={a.nome} className="w-full h-full object-cover" />
                            ) : (
                                <UserCheck size={32} className="text-slate-500" />
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-white text-center line-clamp-1 truncate w-full">{a.nome}</h2>
                        <div className="bg-amber-500 text-black px-4 py-1.5 mt-3 rounded-full text-sm font-black uppercase tracking-widest shadow-lg">
                            Dia {a.dia}
                        </div>
                    </div>
                ))}
            </div>
            {aniversariantes.length > 12 && (
                <p className="text-amber-500 mt-8 font-bold text-xl animate-pulse">E MAIS {aniversariantes.length - 12} COLEGAS NESTE MÊS!</p>
            )}
        </div>
    );
}

function SlideAdmissoes({ admissoes }: { admissoes: any[] }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <Award size={80} className="text-blue-500 mb-6 animate-pulse" />
            <h1 className="text-7xl font-black text-blue-400 uppercase tracking-tighter mb-4 text-center" style={{ textShadow: '0 10px 30px rgba(59,130,246,0.3)' }}>
                Celebração de Carreira
            </h1>
            <p className="text-3xl text-slate-400 font-bold uppercase tracking-widest mb-12">Obrigado pela dedicação contínua!</p>
            
            <div className="grid grid-cols-3 gap-8 max-w-6xl w-full">
                {admissoes.slice(0, 6).map((a, i) => (
                    <div key={i} className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-blue-900/50 p-6 rounded-3xl flex items-center gap-6 shadow-2xl">
                        <div className="w-20 h-20 bg-slate-800 rounded-2xl border-2 border-blue-400 flex items-center justify-center shrink-0">
                            {a.foto ? (
                                <img src={a.foto} alt={a.nome} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <UserCheck size={32} className="text-blue-500" />
                            )}
                        </div>
                        <div className="flex flex-col flex-1 truncate">
                            <h2 className="text-2xl font-black text-white truncate">{a.nome}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="bg-blue-600 text-white px-3 py-1 rounded text-xl font-black shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                                    {a.anos} ANOS
                                </span>
                                <span className="text-slate-500 font-bold text-sm uppercase">Dia {a.dia}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SlideHeroi({ heroi }: { heroi: any }) {
    return (
        <div className="w-full h-full flex gap-12 items-center justify-center">
            <div className="w-1/3 flex flex-col items-end text-right">
                <Star size={100} className="text-yellow-400 mb-8 fill-yellow-400 drop-shadow-[0_0_50px_rgba(250,204,21,0.6)]" />
                <h1 className="text-7xl font-black text-white uppercase tracking-tighter leading-none mb-4">Herói<br/><span className="text-yellow-400">do Mês</span></h1>
                <p className="text-2xl text-slate-400 font-medium uppercase tracking-widest max-w-sm">Prémio de Excelência e Alta Eficiência Operacional</p>
            </div>
            <div className="w-[2px] h-2/3 bg-gradient-to-b from-transparent via-slate-700 to-transparent"></div>
            <div className="w-1/2 flex flex-col items-start">
                <div className="relative">
                    <div className="absolute -inset-4 bg-yellow-500/20 blur-3xl rounded-full"></div>
                    <div className="w-64 h-64 bg-slate-900 rounded-full border-8 border-yellow-400 mb-8 overflow-hidden relative z-10 shadow-[0_0_60px_rgba(250,204,21,0.3)] flex items-center justify-center">
                        {heroi.foto ? (
                            <img src={heroi.foto} alt="Hero" className="w-full h-full object-cover" />
                        ) : (
                            <UserCheck size={100} className="text-slate-600" />
                        )}
                    </div>
                </div>
                <h2 className="text-6xl font-black text-white mb-4 uppercase">{heroi.nome}</h2>
                <div className="flex items-center gap-4">
                    <div className="bg-yellow-400 text-black px-6 py-2 rounded-xl text-3xl font-black tracking-widest">
                        ⭐ {(heroi.score || 0).toFixed(1)}% Efi.
                    </div>
                    <span className="text-slate-500 font-bold uppercase tracking-widest">Desempenho Global Excecional</span>
                </div>
            </div>
        </div>
    );
}

function SlideQualidade({ qcis }: { qcis: any }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="flex items-center justify-center gap-6 mb-8">
                <Activity size={60} className="text-indigo-400" />
                <h1 className="text-6xl font-black text-indigo-400 uppercase tracking-tighter" style={{ textShadow: '0 10px 30px rgba(129,140,248,0.3)' }}>
                    Indicadores de Qualidade QCIS
                </h1>
            </div>
            <p className="text-2xl text-slate-400 font-bold uppercase tracking-widest mb-16 border-b border-indigo-900/50 pb-4">
                Fecho Global Diário ({qcis.dateStr})
            </p>

            <div className="grid grid-cols-2 gap-12 max-w-6xl w-full">
                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-[3rem] p-12 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.1)] relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full"></div>
                    <h2 className="text-3xl font-bold text-indigo-200 uppercase tracking-widest mb-8 text-center">First Time Through<br/><span className="text-sm text-slate-400">Zero Defeitos (Testes Funcionais)</span></h2>
                    <span className="text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] tracking-tighter">
                        {qcis.ftr}%
                    </span>
                    <div className="mt-8 bg-black/40 px-6 py-2 rounded-full border border-indigo-500/20">
                        <span className="text-slate-400 font-bold tracking-widest uppercase">Objetivo Cima de 95%</span>
                    </div>
                </div>

                <div className="bg-rose-950/40 border border-rose-500/30 rounded-[3rem] p-12 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.1)] relative overflow-hidden">
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-rose-600/20 blur-[100px] rounded-full"></div>
                    <h2 className="text-3xl font-bold text-rose-200 uppercase tracking-widest mb-8 text-center">Defects Per Unit<br/><span className="text-sm text-slate-400">Inspecção Final Embalamento</span></h2>
                    <span className="text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] tracking-tighter">
                        {qcis.dpu}
                    </span>
                    <div className="mt-8 bg-black/40 px-6 py-2 rounded-full border border-rose-500/20 flex gap-4">
                        <span className="text-slate-400 font-bold tracking-widest uppercase">Meta Menor que 0.5</span>
                        <span className="text-rose-400 font-bold tracking-widest uppercase">| Barcos Embalados: {qcis.embalados}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SlideOee({ oee }: { oee: any }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <h1 className="text-6xl font-black text-emerald-400 uppercase tracking-tighter mb-4" style={{ textShadow: '0 10px 30px rgba(52,211,153,0.3)' }}>
                Rendimento & Eficiência
            </h1>
            <p className="text-2xl text-slate-400 font-bold uppercase tracking-widest mb-16">Acumulado do Mês Corrente</p>

            <div className="bg-slate-900 border-2 border-emerald-900/50 rounded-[4rem] p-16 flex items-center justify-between max-w-5xl w-full shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)]"></div>
                
                <div className="flex flex-col items-center z-10 w-1/3 border-r border-slate-700 pr-12">
                    <h3 className="text-2xl font-bold text-slate-400 uppercase tracking-widest mb-6">Eficiência Global</h3>
                    <div className="w-64 h-64 rounded-full border-[12px] border-slate-800 flex flex-col items-center justify-center relative shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="116" cy="116" r="110" fill="none" stroke="rgba(52,211,153,0.2)" strokeWidth="12" />
                            <circle cx="116" cy="116" r="110" fill="none" stroke="#34d399" strokeWidth="12" strokeDasharray={`${oee.percentual * 6.9} 800`} strokeLinecap="round" className="drop-shadow-[0_0_10px_#10b981]" />
                        </svg>
                        <span className="text-6xl font-black text-white">{oee.percentual}%</span>
                        <span className="text-emerald-500 font-bold tracking-widest uppercase text-sm mt-1">META 75%</span>
                    </div>
                </div>

                <div className="flex flex-col z-10 w-2/3 pl-12 gap-10">
                    <div className="bg-slate-950 rounded-3xl p-8 border border-slate-800 flex justify-between items-center group hover:border-emerald-500/50 transition-colors">
                        <div>
                            <h4 className="text-slate-500 font-bold uppercase tracking-widest mb-1 text-lg">Horas H/H Ganhas</h4>
                            <p className="text-sm text-slate-600 font-medium">Horas de atividade geradas face ao standard de engenharia</p>
                        </div>
                        <span className="text-5xl font-black text-white group-hover:text-emerald-400 transition-colors">{oee.horasGanhas}</span>
                    </div>
                    <div className="bg-slate-950 rounded-3xl p-8 border border-slate-800 flex justify-between items-center">
                        <div>
                            <h4 className="text-slate-500 font-bold uppercase tracking-widest mb-1 text-lg">Horas Trabalhadas</h4>
                            <p className="text-sm text-slate-600 font-medium">Tempo total de força laboral no pavilhão fabril</p>
                        </div>
                        <span className="text-5xl font-black text-white">{oee.horasTrabalhadas}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SlideSeguranca({ safetyCross, heatmap }: { safetyCross: any[], heatmap: any[] }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="flex items-center gap-6 mb-12">
                <ShieldAlert size={64} className="text-red-500 animate-pulse" />
                <h1 className="text-6xl font-black text-red-500 uppercase tracking-tighter" style={{ textShadow: '0 10px 30px rgba(239,68,68,0.3)' }}>
                    Fábrica Segura (Safety First)
                </h1>
            </div>

            <div className="flex gap-16 w-full max-w-7xl">
                {/* Cruz de Seguranca Simplificada */}
                <div className="w-1/2 flex flex-col items-center">
                    <h2 className="text-2xl font-bold text-slate-400 uppercase tracking-widest mb-8">Cruz de Segurança (Mês Corrente)</h2>
                    <div className="grid grid-cols-7 gap-1.5 p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl">
                        {Array.from({ length: 31 }, (_, i) => {
                            const dia = i + 1;
                            const hstDay = safetyCross.find(s => s.dia === dia);
                            let color = 'bg-slate-800 text-slate-500';
                            if (hstDay) {
                                if (hstDay.level === 0) color = 'bg-emerald-500 text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]';
                                else if (hstDay.level === 1) color = 'bg-yellow-400 text-black font-bold shadow-[0_0_15px_rgba(250,204,21,0.4)]';
                                else if (hstDay.level === 2) color = 'bg-orange-500 text-black font-bold';
                                else if (hstDay.level === 3) color = 'bg-red-600 text-white font-bold animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.8)]';
                            }
                            // Formato em cruz basic (if we wanted to make it exactly cross shaped, we would need complex grid template areas, 
                            // but a square 7x5 calendar view is more legible from 10 meters away in a cafeteria)
                            return (
                                <div key={dia} className={`w-14 h-14 rounded-lg flex items-center justify-center text-xl transition-all ${color} border border-slate-700/50`}>
                                    {dia}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Radar Zonas Heatmap */}
                <div className="w-1/2 flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold text-slate-400 uppercase tracking-widest mb-8">Radar Zonas de Perigo (Agora)</h2>
                    <div className="w-full grid grid-cols-2 gap-4">
                        {heatmap.map((h, i) => (
                            <div key={i} className={`p-6 rounded-2xl border-2 flex justify-between items-center shadow-lg
                                ${h.cor === 'red' ? 'bg-red-950/40 border-red-500/50' : 
                                  h.cor === 'yellow' ? 'bg-yellow-950/30 border-yellow-600/40' : 
                                  'bg-slate-900 border-slate-800'}`}>
                                <span className={`text-xl font-black uppercase ${h.cor === 'red' ? 'text-red-400' : h.cor === 'yellow' ? 'text-yellow-400' : 'text-slate-300'}`}>
                                    {h.nome}
                                </span>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black
                                    ${h.cor === 'red' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' : 
                                      h.cor === 'yellow' ? 'bg-yellow-400 text-black' : 
                                      'bg-slate-800 text-emerald-400'}`}>
                                    {h.incidentes > 0 ? h.incidentes : '✓'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Slide5S() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            <h1 className="text-8xl font-black text-white uppercase tracking-tighter text-center mb-8 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] leading-tight relative z-10">
                PILARES 5S:<br/>
                <span className="text-emerald-400">ORGANIZAÇÃO & LIMPEZA</span>
            </h1>
            
            <p className="text-4xl text-slate-300 font-bold uppercase tracking-widest text-center max-w-5xl leading-snug relative z-10">
                Um posto de trabalho organizado é um posto de trabalho seguro. Mantenha a sua área limpa no final de cada turno!
            </p>

            <div className="mt-16 flex gap-6 relative z-10">
                {['Seiri (Utilização)', 'Seiton (Organização)', 'Seiso (Limpeza)', 'Seiketsu (Padronização)', 'Shitsuke (Disciplina)'].map((s, i) => (
                    <div key={i} className="bg-slate-900/90 border border-slate-700 px-6 py-4 rounded-full text-white font-bold uppercase tracking-widest text-lg shadow-xl">
                        {s}
                    </div>
                ))}
            </div>
        </div>
    );
}

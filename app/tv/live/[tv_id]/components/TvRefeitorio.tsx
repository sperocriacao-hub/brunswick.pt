'use client';

import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, Award, Star, Activity, UserCheck, PartyPopper } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

export function TvRefeitorio({ config, data, embedMode = false }: { config: any, data: any, embedMode?: boolean }) {
    const opcoes = config.opcoes_layout || {};
    const loopTempo = (opcoes.loopTempoSegundos || 15) * 1000;

    const [activeIdx, setActiveIdx] = useState(0);

    // Build the array of active slides
    const slides: { id: string, label: string, render: () => React.ReactNode }[] = [];

    const showAniv = opcoes.showRefeitorioAniversarios ?? true;
    const showAdm = opcoes.showRefeitorioAdmissao ?? true;
    const showHer = opcoes.showRefeitorioHeroi ?? true;
    const showSeg = opcoes.showRefeitorioSegurancaGlob ?? true;
    const showQual = opcoes.showRefeitorioQualidade ?? true;
    const showOee = opcoes.showRefeitorioOee ?? true;
    const show5s = opcoes.showRefeitorio5S ?? true;

    function splitPages(arr: any[], max: number) {
        const pages = [];
        for (let i = 0; i < arr.length; i += max) pages.push(arr.slice(i, i + max));
        return pages;
    }

    if (showAniv) {
        if (data.aniversariantes?.length > 0) {
            const pages = splitPages(data.aniversariantes, 8);
            pages.forEach((pageBatch, idx) => {
                slides.push({ id: `NIVERS_${idx}`, label: `Aniversários ${idx+1}/${pages.length}`, render: () => <SlideAniversarios aniversariantes={pageBatch} /> });
            });
        } else {
            slides.push({ id: 'NIVERS_EMPTY', label: 'Aniversários do Mês', render: () => <SlideAniversarios aniversariantes={[]} /> });
        }
    }
    if (showAdm) {
        if (data.admissoes?.length > 0) {
            const pages = splitPages(data.admissoes, 6);
            pages.forEach((pageBatch, idx) => {
                slides.push({ id: `ADMISSAO_${idx}`, label: `Lendas ${idx+1}/${pages.length}`, render: () => <SlideAdmissoes admissoes={pageBatch} /> });
            });
        } else {
            slides.push({ id: 'ADMISSAO_EMPTY', label: 'Lendas da Empresa', render: () => <SlideAdmissoes admissoes={[]} /> });
        }
    }
    if (showHer && data.herois?.length > 0) {
        const pages = splitPages(data.herois, 4);
        pages.forEach((pageBatch, idx) => {
            slides.push({ id: `HEROI_${idx}`, label: `Heróis ${idx+1}/${pages.length}`, render: () => <SlideHerois herois={pageBatch} /> });
        });
    }
    if (showSeg) {
        slides.push({ id: 'SEGURANCA', label: 'Dashboard de Segurança', render: () => <SlideSeguranca safetyCross={data.safetyCross || []} heatmap={data.heatmap || []} /> });
    }
    if (showQual && data.qcis) {
        slides.push({ id: 'QUALIDADE', label: 'Quality Control (QCIS)', render: () => <SlideQualidade qcis={data.qcis} /> });
    }
    if (showOee && data.oee) {
        slides.push({ id: 'OEE', label: 'Eficiência e OEE Global', render: () => <SlideOee oee={data.oee} /> });
    }
    if (show5s) {
        slides.push({ id: '5S', label: 'Cultura 5S e Limpeza', render: () => <Slide5S heatmap={data.heatmap5s || []} /> });
    }
    if (opcoes.showRefeitorioAcaoMes && opcoes.urlImagemAcaoMes) {
        slides.push({ id: 'ACAO_MES', label: 'Destaque e Ação do Mês', render: () => <SlideAcaoMes urlImagem={opcoes.urlImagemAcaoMes!} /> });
    }

    useEffect(() => {
        if (slides.length <= 1) return;
        const timerSlide = setInterval(() => {
            setActiveIdx(prev => (prev + 1) % slides.length);
        }, loopTempo);
        return () => clearInterval(timerSlide);
    }, [slides.length, loopTempo]);

    if (slides.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center bg-slate-950 text-slate-300 ${embedMode ? 'w-full h-full rounded-[3rem]' : 'w-screen h-screen'}`}>
                <Settings size={64} className="text-slate-700 mb-4 animate-spin-slow" />
                <h1 className="text-4xl font-black uppercase tracking-widest text-slate-500">A Aguardar Configuração</h1>
                <p className="text-xl text-slate-600 mt-2">Nenhum slide ativo no backoffice para este refeitório.</p>
            </div>
        );
    }

    const currentSlide = slides[activeIdx];

    return (
        <div className={`flex flex-col overflow-hidden bg-slate-950 text-slate-100 selection:bg-blue-500/30 ${embedMode ? 'w-full h-full rounded-[3rem]' : 'w-screen h-screen'}`}>
            
            {!embedMode && (
                <header className="flex items-center justify-between px-8 py-4 bg-slate-900/80 border-b border-slate-800 shrink-0 shadow-lg">
                    <div className="flex items-center gap-6">
                        <div className="font-black text-3xl tracking-tighter text-white">BRUNSWICK <span className="text-blue-500">•</span> M.E.S.</div>
                        <div className="h-6 w-px bg-slate-700"></div>
                        <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400 flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></span>
                            {config.nome_tv}
                        </h2>
                    </div>
                </header>
            )}

            {/* Area de Conteudo Rotativo (O SLIDE EM SI) */}
            <main className="flex-1 relative w-full h-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black rounded-[3rem]">
                
                {/* Embedded Carousel Hint */}
                {embedMode && slides.length > 1 && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-800">
                        {slides.map((s, i) => (
                            <div key={s.id} className={`h-2 rounded-full transition-all duration-500 flex items-center justify-center overflow-hidden
                                ${i === activeIdx ? 'w-32 bg-blue-500' : 'w-2 bg-slate-700'}`}>
                                {i === activeIdx && (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white whitespace-nowrap opacity-80 px-2">{s.label}</span>
                                )}    
                            </div>
                        ))}
                    </div>
                )}

                <div key={currentSlide.id} className="absolute inset-0 w-full h-full flex flex-col animate-in fade-in zoom-in-95 duration-1000 p-8">
                    {currentSlide.render()}
                </div>
            </main>

            {/* Cache Debug Watermark */}
            {data.serverTimeForDebugging && (
                <div className="absolute bottom-2 right-4 text-[10px] text-white/20 font-mono tracking-widest z-50 pointer-events-none flex flex-col items-end">
                    <span>NO-CACHE BUILD: {new Date(data.serverTimeForDebugging).toLocaleTimeString()}</span>
                    {data.debugErrors && data.debugErrors.length > 0 && (
                        <span className="text-red-500 font-bold">{data.debugErrors.join(' | ')}</span>
                    )}
                </div>
            )}
        </div>
    );
}

// ----------------------------------------------------
// SLIDES COMPONENTS
// ----------------------------------------------------

function SlideAniversarios({ aniversariantes }: { aniversariantes: any[] }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-amber-500/10 to-transparent"></div>
            
            <PartyPopper size={80} className="text-amber-400 mb-6 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-bounce relative z-10" />
            <h1 className="text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 uppercase tracking-tighter mb-4 text-center relative z-10 drop-shadow-[0_5px_15px_rgba(245,158,11,0.2)]">
                Aniversariantes do Mês
            </h1>
            <p className="text-2xl lg:text-3xl text-slate-300 font-bold uppercase tracking-widest mb-12 relative z-10">Muitos Parabéns à Nossa Equipa!</p>
            
            <div className="flex flex-col gap-4 max-w-5xl w-full px-12 relative z-10 bg-slate-900/40 backdrop-blur-md p-8 rounded-[3rem] border border-slate-700/50 shadow-2xl">
                {aniversariantes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <PartyPopper size={60} className="text-amber-600/50 mb-4" />
                        <h2 className="text-3xl font-black text-amber-500/80 uppercase tracking-widest text-center shadow-black drop-shadow-md">
                            Nenhum Aniversariante Registado neste Mês
                        </h2>
                        <p className="text-slate-400 mt-2 font-bold tracking-wider">Aguardamos as próximas celebrações!</p>
                    </div>
                ) : (
                    aniversariantes.map((a, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-700/50 pb-4 last:border-0 last:pb-0">
                            <h2 className="text-3xl font-black text-white leading-tight uppercase tracking-wider">{a.nome}</h2>
                            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-2 rounded-xl text-white font-black uppercase tracking-widest shadow-[0_5px_15px_rgba(245,158,11,0.4)] min-w-[120px] justify-center text-xl">
                                Dia {a.dia}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function SlideAdmissoes({ admissoes }: { admissoes: any[] }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute bottom-0 w-full h-2/3 bg-gradient-to-t from-blue-900/20 to-transparent"></div>
            
            <Award size={80} className="text-blue-400 mb-6 drop-shadow-[0_0_20px_rgba(96,165,250,0.6)] animate-pulse relative z-10" />
            <h1 className="text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-blue-500 to-indigo-400 uppercase tracking-tighter mb-4 text-center relative z-10 drop-shadow-[0_5px_15px_rgba(59,130,246,0.2)]">
                Lendas da Empresa
            </h1>
            <p className="text-2xl lg:text-3xl text-slate-300 font-bold uppercase tracking-widest mb-12 relative z-10">Reconhecimento de Antiguidade & Dedicação</p>
            
            <div className="flex flex-col gap-4 max-w-5xl w-full px-12 relative z-10 bg-slate-900/40 backdrop-blur-md p-8 rounded-[3rem] border border-blue-500/20 shadow-2xl">
                {admissoes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Award size={60} className="text-blue-600/50 mb-4" />
                        <h2 className="text-3xl font-black text-blue-500/80 uppercase tracking-widest text-center shadow-black drop-shadow-md">
                            Nenhum Herói Celebra Antiguidade este Mês
                        </h2>
                        <p className="text-slate-400 mt-2 font-bold tracking-wider">Aguardamos os marcos do próximo mês!</p>
                    </div>
                ) : (
                    admissoes.map((a, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-700/50 pb-4 last:border-0 last:pb-0">
                            <h2 className="text-3xl font-black text-white leading-tight uppercase tracking-wider">{a.nome}</h2>
                            <div className="flex items-center gap-4">
                                <span className="text-blue-200/60 font-black text-lg uppercase tracking-widest bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                                    Dia {a.dia}
                                </span>
                                <div className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 rounded-xl text-xl font-black shadow-[0_4px_10px_rgba(37,99,235,0.4)] min-w-[120px]">
                                    {a.anos} ANOS
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function SlideHerois({ herois }: { herois: any[] }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.15)_0%,transparent_70%)] pointer-events-none"></div>

            <div className="flex flex-col items-center mb-12 relative z-10">
                <Star size={80} className="text-yellow-400 mb-4 fill-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-pulse" />
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 uppercase tracking-tighter text-center leading-none mb-4 drop-shadow-[0_5px_15px_rgba(234,179,8,0.3)]">
                    Funcionários do Mês<br/><span className="text-3xl text-yellow-500/80">Por Área de Produção</span>
                </h1>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl w-full px-8 relative z-10 items-end justify-center">
                {herois.map((heroi, i) => (
                    <div key={i} className="flex flex-col items-center group relative">
                        {/* Area Tag Floating */}
                        <div className="bg-slate-800 border-2 border-yellow-500/50 px-6 py-1.5 rounded-full text-yellow-400 font-black uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(234,179,8,0.2)] mb-8 whitespace-nowrap z-20 translate-y-4 group-hover:-translate-y-2 transition-transform">
                            {heroi.area_nome || 'Fábrica'}
                        </div>
                        
                        <div className="relative w-full aspect-[3/4] max-h-[320px] bg-slate-900/60 rounded-[2rem] border border-slate-700/50 flex flex-col items-center justify-end p-6 pb-24 shadow-2xl overflow-visible transition-all duration-500 group-hover:bg-slate-800/80 group-hover:border-yellow-500/30 group-hover:shadow-[0_20px_40px_rgba(250,204,21,0.15)]">
                            <div className="absolute -top-16 w-36 h-36 bg-slate-950 rounded-full border-[6px] border-yellow-400 overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.4)] flex items-center justify-center z-10 transition-transform duration-500 group-hover:scale-110">
                                {heroi.foto ? (
                                    <img src={heroi.foto} alt="Hero" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCheck size={64} className="text-slate-600" />
                                )}
                            </div>
                            
                            <h2 className="text-2xl font-black text-white mb-2 uppercase text-center leading-tight line-clamp-2 w-full px-2 mt-4 z-10">
                                {heroi.nome}
                            </h2>
                            
                            <div className="absolute -bottom-6 flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black px-5 py-2 rounded-xl text-xl font-black tracking-widest shadow-[0_10px_20px_rgba(250,204,21,0.4)] z-20 group-hover:scale-110 transition-transform">
                                ⭐ {(heroi.score || 0).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SlideQualidade({ qcis }: { qcis: any }) {
    const safeQcis = qcis || { dateStr: 'A carregar', ftr: 0, dpu: 0, embalados: 0, categorias: [] };
    const categoriasVisiveis = safeQcis.categorias || [];

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8">
            <div className="flex items-center justify-center gap-6 mb-8 mt-4">
                <Activity size={60} className="text-indigo-400" />
                <h1 className="text-6xl font-black text-indigo-400 uppercase tracking-tighter" style={{ textShadow: '0 10px 30px rgba(129,140,248,0.3)' }}>
                    Indicadores de Qualidade QCIS
                </h1>
            </div>
            <p className="text-2xl text-slate-400 font-bold uppercase tracking-widest mb-10 border-b border-indigo-900/50 pb-4">
                Fecho Diário Global ({safeQcis.dateStr})
            </p>

            <div className="flex gap-8 max-w-[1400px] w-full h-[65%]">
                {/* Main Global KPIs */}
                <div className="w-1/3 flex flex-col gap-6">
                    <div className="flex-1 bg-indigo-950/40 border border-indigo-500/30 rounded-[2rem] p-8 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.1)] relative overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full"></div>
                        <h2 className="text-2xl font-bold text-indigo-200 uppercase tracking-widest mb-6 text-center">First Time Through<br/><span className="text-sm text-slate-400">Zero Defeitos (Funcionais)</span></h2>
                        <span className="text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] tracking-tighter">
                            {safeQcis.ftr}%
                        </span>
                        <div className="mt-6 bg-black/40 px-6 py-2 rounded-full border border-indigo-500/20">
                            <span className="text-slate-400 font-bold tracking-widest uppercase text-sm">Meta Cima de 95%</span>
                        </div>
                    </div>

                    <div className="flex-1 bg-rose-950/40 border border-rose-500/30 rounded-[2rem] p-8 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.1)] relative overflow-hidden">
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-rose-600/20 blur-[100px] rounded-full"></div>
                        <h2 className="text-2xl font-bold text-rose-200 uppercase tracking-widest mb-6 text-center">DPU Embalamento<br/><span className="text-sm text-slate-400">Inspeção Final</span></h2>
                        <span className="text-8xl font-black text-rose-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] tracking-tighter">
                            {safeQcis.dpu}
                        </span>
                        <div className="mt-6 bg-black/40 px-6 py-2 rounded-full border border-rose-500/20">
                            <span className="text-slate-400 font-bold tracking-widest uppercase text-sm">Total Barcos: {safeQcis.embalados}</span>
                        </div>
                    </div>
                </div>

                {/* Categorias Grid */}
                <div className="w-2/3 bg-slate-900/60 rounded-[2rem] border border-slate-700 p-8 flex flex-col shadow-2xl relative">
                     <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">
                         DPU por Categoria
                     </h2>

                     {categoriasVisiveis.length === 0 ? (
                         <div className="flex-1 flex items-center justify-center text-slate-600 font-bold text-xl uppercase tracking-widest border-2 border-dashed border-slate-800 rounded-2xl">
                             Sem registos de defeitos ontem
                         </div>
                     ) : (
                         <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 flex-1 auto-rows-fr">
                             {categoriasVisiveis.map((c: any, i: number) => (
                                 <div key={i} className="bg-slate-950 border border-slate-700/50 rounded-2xl p-5 flex flex-col shadow-inner justify-between transition-transform hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-[0_10px_30px_rgba(99,102,241,0.15)] group">
                                     <h3 className="text-xl font-black text-slate-200 uppercase truncate w-full group-hover:text-white transition-colors">
                                         {c.nome}
                                     </h3>
                                     <div className="flex items-end justify-between mt-auto">
                                         <div className="flex flex-col gap-1">
                                             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Defeitos: <span className="text-rose-400 text-sm ml-1">{c.total_defeitos}</span></span>
                                             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Amostra: <span className="text-blue-400 text-sm ml-1">{c.unicos} uni</span></span>
                                         </div>
                                         <div className="flex flex-col items-end">
                                             <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-0.5">DPUS</span>
                                             <span className="bg-indigo-500/20 text-indigo-300 font-black text-2xl px-3 py-1 rounded-lg border border-indigo-500/30">
                                                 {c.dpu.toFixed(2)}
                                             </span>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
}

function SlideOee({ oee }: { oee: any }) {
    const safeOee = oee || { percentual: 0, horasGanhas: 0, horasTrabalhadas: 0 };
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
                            <circle cx="116" cy="116" r="110" fill="none" stroke="#34d399" strokeWidth="12" strokeDasharray={`${safeOee.percentual * 6.9} 800`} strokeLinecap="round" className="drop-shadow-[0_0_10px_#10b981]" />
                        </svg>
                        <span className="text-6xl font-black text-white">{safeOee.percentual}%</span>
                        <span className="text-emerald-500 font-bold tracking-widest uppercase text-sm mt-1">META 75%</span>
                    </div>
                </div>

                <div className="flex flex-col z-10 w-2/3 pl-12 gap-10">
                    <div className="bg-slate-950 rounded-3xl p-8 border border-slate-800 flex justify-between items-center group hover:border-emerald-500/50 transition-colors">
                        <div>
                            <h4 className="text-slate-500 font-bold uppercase tracking-widest mb-1 text-lg">Horas H/H Ganhas</h4>
                            <p className="text-sm text-slate-600 font-medium">Horas de atividade geradas face ao standard de engenharia</p>
                        </div>
                        <span className="text-5xl font-black text-white group-hover:text-emerald-400 transition-colors">{safeOee.horasGanhas}</span>
                    </div>
                    <div className="bg-slate-950 rounded-3xl p-8 border border-slate-800 flex justify-between items-center">
                        <div>
                            <h4 className="text-slate-500 font-bold uppercase tracking-widest mb-1 text-lg">Horas Trabalhadas</h4>
                            <p className="text-sm text-slate-600 font-medium">Tempo total de força laboral no pavilhão fabril</p>
                        </div>
                        <span className="text-5xl font-black text-white">{safeOee.horasTrabalhadas}</span>
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
                    <div className="grid grid-cols-7 gap-2 p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl">
                        {[
                            null, null, 1, 2, 3, null, null,
                            null, null, 4, 5, 6, null, null,
                            7, 8, 9, 10, 11, 12, 13,
                            14, 15, 16, 17, 18, 19, 20,
                            21, 22, 23, 24, 25, 26, 27,
                            null, null, 28, 29, 30, null, null,
                            null, null, null, 31, null, null, null
                        ].map((dia, i) => {
                            if (dia === null) {
                                return <div key={`empty-${i}`} className="w-14 h-14"></div>;
                            }

                            const hstDay = safetyCross.find(s => s.dia === dia);
                            let color = 'bg-slate-800 text-slate-500 border-slate-700/50';
                            
                            if (hstDay) {
                                if (hstDay.level === 0) color = 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]';
                                else if (hstDay.level === 1) color = 'bg-orange-500 border-orange-400 text-black shadow-[0_0_20px_rgba(249,115,22,0.5)] animate-pulse';
                                else if (hstDay.level >= 2) color = 'bg-red-600 border-red-500 text-white animate-bounce shadow-[0_0_30px_rgba(220,38,38,0.8)] scale-110 z-10';
                            }
                            
                            return (
                                <div key={dia} className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black transition-all border-2 ${color}`}>
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

function Slide5S({ heatmap }: { heatmap: any[] }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            <h1 className="text-6xl font-black text-white uppercase tracking-tighter text-center mb-6 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] leading-tight relative z-10">
                PILARES 5S:<br/>
                <span className="text-emerald-400 text-7xl">ORGANIZAÇÃO & LIMPEZA</span>
            </h1>
            
            <p className="text-3xl text-slate-300 font-bold uppercase tracking-widest text-center max-w-5xl leading-snug relative z-10 mb-12">
                Auditorias 5S Diárias: Mapa de Classificação
            </p>

            <div className="w-full max-w-7xl grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 px-8">
                {heatmap.length === 0 ? (
                    <div className="col-span-4 text-center text-slate-500 font-bold uppercase tracking-widest py-10 border-2 border-dashed border-slate-700 rounded-3xl">
                        A Aguardar Dados de Auditorias 5S do Mês
                    </div>
                ) : (
                    heatmap.map((h, i) => (
                        <div key={i} className={`p-6 rounded-3xl border-2 flex flex-col justify-center items-center shadow-2xl relative overflow-hidden ${h.cor}`}>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                            
                            <span className="text-xl font-black uppercase mb-4 text-center z-10 leading-tight">
                                {h.nome}
                            </span>

                            <div className="bg-slate-950/80 px-6 py-2 rounded-2xl flex items-center justify-center border border-white/10 z-10 shadow-inner w-full">
                                <span className={`text-5xl font-mono font-black tracking-tighter ${h.cor.includes('red') ? 'text-red-400' : h.cor.includes('yellow') ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                    {h.score}
                                </span>
                            </div>

                            {h.cor.includes('red') && (
                                <div className="absolute top-2 right-2 text-white animate-bounce z-10">
                                    <ShieldAlert size={24} />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="mt-12 flex gap-4 relative z-10 flex-wrap justify-center">
                {['Seiri (Utilização)', 'Seiton (Organização)', 'Seiso (Limpeza)', 'Seiketsu (Padronização)', 'Shitsuke (Disciplina)'].map((s, i) => (
                    <div key={i} className="bg-slate-900/90 border border-slate-700 px-5 py-2 rounded-full text-slate-400 font-bold uppercase tracking-widest text-sm shadow-xl">
                        {s}
                    </div>
                ))}
            </div>
        </div>
    );
}

function SlideAcaoMes({ urlImagem }: { urlImagem: string }) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-black relative overflow-hidden group">
            {/* The actual image covering everything */}
            <img 
                src={urlImagem} 
                alt="Ação do Mês" 
                className="w-full h-full object-contain absolute inset-0 z-0 bg-slate-950"
            />
            {/* Blurry background version to fill raw screen gaps if not 16:9 */}
            <div 
                className="absolute inset-0 z-[-1] opacity-40 blur-3xl scale-110 bg-no-repeat bg-cover bg-center" 
                style={{ backgroundImage: `url(${urlImagem})` }}
            ></div>
            
            <div className="absolute top-8 left-8 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 z-10 shadow-lg">
                <span className="text-white/80 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                    <Star size={14} className="text-amber-400" /> Ação Especial do Mês
                </span>
            </div>
        </div>
    );
}

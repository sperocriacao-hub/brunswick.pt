"use client";

import React from 'react';
import { Network, ShieldCheck, Zap, Crosshair, HeartPulse, HardHat, Recycle, LayoutGrid, Handshake, ShieldAlert, Cpu, Trophy, BarChart3, LineChart, BookOpen, Quote, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const PILARES = [
    { 
        id: '1', 
        title: 'Higiene e Segurança (HST)', 
        icon: ShieldAlert, 
        color: 'from-amber-400 to-amber-600', 
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        quote: "O único número aceitável de acidentes é zero.",
        desc: 'Promova "Safety Walks" diários e não hesite em parar tudo por um risco. Como líder, você é o guardião inegociável da integridade física de cada membro. Um ambiente seguro reflete diretamente numa equipa moralmente forte.' 
    },
    { 
        id: '2', 
        title: 'Rigor EPI', 
        icon: HardHat, 
        color: 'from-orange-400 to-orange-600',
        bg: 'bg-orange-50',
        text: 'text-orange-700', 
        quote: "A disciplina pessoal reflete a excelência operacional.",
        desc: 'Não permita exceções. O rigor não implica ser autoritário, mas sim pedagógico. Aborde os desvios primeiro como oportunidades de consciencialização. A consistência no uso diário molda o padrão de cultura de todos.' 
    },
    { 
        id: '3', 
        title: 'Metodologia 5S', 
        icon: Recycle, 
        color: 'from-emerald-400 to-emerald-600', 
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        quote: "A fábrica é o espelho da mente do líder.",
        desc: 'A limpeza e organização são os alicerces da eficiência. Institua ritmos de 5 minutos diários no final de cada turno para arrumação. Lembre a equipa: "Tudo tem o seu lugar, e há um lugar para cada coisa".' 
    },
    { 
        id: '4', 
        title: 'Eficiência (H/H)', 
        icon: Zap, 
        color: 'from-indigo-400 to-indigo-600', 
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        quote: "Otimizar talento humano gera fluidez produtiva.",
        desc: 'Como aloca os recursos disponíveis no turno? Mapeie as aptidões. O OEE das horas úteis só é atingido de forma saudável se alocar os operários no posto correto com base na matriz de poli-competência.' 
    },
    { 
        id: '5', 
        title: 'Foco no Objetivo', 
        icon: Crosshair, 
        color: 'from-red-400 to-red-600', 
        bg: 'bg-red-50',
        text: 'text-red-700',
        quote: "Missão passada é missão acompanhada.",
        desc: 'Seja claro nas métricas do dia nas reuniões de Stand Up. A equipa deve saber exatamente o que será considerado uma "vitória" hoje. Ajude o grupo a remover obstáculos sempre que perderem a trajetória do alvo.' 
    },
    { 
        id: '6', 
        title: 'Inteligência Emocional', 
        icon: HeartPulse, 
        color: 'from-rose-400 to-rose-600', 
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        quote: "Liderar pessoas é calibrar emoções e garantir segurança psicológica.",
        desc: 'Cultive um terreno onde os operários reportem falhas sem medo da punição cega. Seja um elo de empatia e ética. Adapte o seu trato e evite contágios de stress agudo de modo a garantir uma atitude humana mas com foco no rigor.' 
    },
    { 
        id: '7', 
        title: 'Gestão e Motivação', 
        icon: Trophy, 
        color: 'from-yellow-400 to-yellow-600', 
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        quote: "Não se gere de braços cruzados, gere-se no Gemba.",
        desc: 'O líder real é visto na linha durante o aperto. Mantenha os seus coesos quando os prazos pesam. Use elogios sinceros e corrija sempre em tom instrucional; é a atitude justa que ganha a lealdade do Chão de Fábrica.' 
    },
    { 
        id: '8', 
        title: 'Mentoria Ativa', 
        icon: Network, 
        color: 'from-violet-400 to-violet-600', 
        bg: 'bg-violet-50',
        text: 'text-violet-700',
        quote: "O legado de um líder mede-se pelos que ele ensinou a liderar.",
        desc: 'Invista ativamente tempo de qualidade a formar e acompanhar. Não acumule conhecimento em silos. Transfira táticas complexas e prepare ativamente a próxima geração de sucessores e especialistas na linha.' 
    },
    { 
        id: '9', 
        title: 'Mentalidade Kaizen', 
        icon: LayoutGrid, 
        color: 'from-cyan-400 to-cyan-600', 
        bg: 'bg-cyan-50',
        text: 'text-cyan-700',
        quote: "Inconformismo perpétuo contra a ineficácia.",
        desc: 'Fomente a cultura antiburocrática do sistema *IDEAS*. Convoque o grupo a encontrar perdas (Muda, Muri, Mura) nos seus ritmos diários. Prove à equipa que o somatório de cada 1 segundo poupado altera o universo fabril.' 
    },
    { 
        id: '10', 
        title: 'Zelo e Qualidade', 
        icon: ShieldCheck, 
        color: 'from-teal-400 to-teal-600', 
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        quote: "Jamais sacrificaremos a qualidade no altar da rapidez.",
        desc: 'A primeira taxa de acerto (FTR) deve estar blindada. Incorpore no seio do turno o "Orgulho de Fazer Bem Direto à Primeira". Cobre que as embarcações saiam sempre intactas, limpas e perfeitamente manipuladas.' 
    },
    { 
        id: '11', 
        title: 'Decisão Guiada a Dados', 
        icon: Cpu, 
        color: 'from-purple-400 to-purple-600', 
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        quote: "O que não é metodicamente medido, não pode ser melhorado.",
        desc: 'Consuma ativamente os dashboards M.E.S. Seja rápido a acatar Andons. Acompanhe gargalos (Bottlenecks) com o escrutínio de quem gere Takt-Time ao minuto. O líder reage aos números sem paralisar o instinto.' 
    },
    { 
        id: '12', 
        title: 'Melhoria Contínua', 
        icon: LineChart, 
        color: 'from-blue-400 to-blue-600', 
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        quote: "Seremos obrigatoriamente 1% melhores do que fomos ontem.",
        desc: 'Use os Root Cause Analyses (RCA) com paixão. Envolva a equipa na conceção das ferramentas standard. A resistência à mudança abate-se através da implementação de rotinas fáceis, infalíveis e evidentes na fábrica.' 
    },
    { 
        id: '13', 
        title: 'Transparência', 
        icon: BarChart3, 
        color: 'from-sky-400 to-sky-600', 
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        quote: "Todos remam na mesma direção se conseguirem visualizar o destino.",
        desc: 'Democratize a informação tática. Mostre a realidade à equipa. Se estamos mal na semana, todos precisam perceber porquê. Desfazer o silêncio corporativo cria compromisso genuíno com o trabalho diário.' 
    },
    { 
        id: '14', 
        title: 'Guardião da Cultura', 
        icon: Handshake, 
        color: 'from-pink-400 to-pink-600', 
        bg: 'bg-pink-50',
        text: 'text-pink-700',
        quote: "As suas atitudes gritam mais alto que o seu título.",
        desc: 'O famoso *Walk the talk*. Você estabelece o patamar com o seu próprio exemplo. Realize um Onboarding digno para recém-chegados, invista ativamente em conversas 1-on-1 genuínas, e personifique com entusiasmo o modo Brunswick de trabalhar.' 
    },
];

export default function LiderancaManifesto() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative overflow-hidden pb-20">
            
            {/* Elegant Header Backgrounds */}
            <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-950 skew-y-[3deg] origin-top-left -z-10 shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/graphy.png')] opacity-[0.2]"></div>
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-sky-500/30 blur-[100px] rounded-full"></div>
                <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 blur-[150px] rounded-full"></div>
            </div>

            <main className="max-w-[1500px] mx-auto px-6 pt-16 z-10">
                {/* Cabeçalho */}
                <div className="flex flex-col items-center justify-center text-center space-y-6 pt-6 pb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-900/40 backdrop-blur-md border border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.3)] rounded-full text-blue-200 text-xs font-mono font-bold tracking-widest uppercase">
                        <BookOpen size={16} /> Escola Superior de Liderança Estratégica M.E.S.
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight uppercase max-w-5xl leading-tight">
                        Manifesto <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-sky-100 drop-shadow-md">Liderança Brunswick 360</span>
                    </h1>
                    
                    <p className="text-blue-100/90 max-w-4xl text-base lg:text-lg font-medium leading-relaxed mt-2 drop-shadow">
                        O guia definitivo de conduta, gestão mental e eficiência para Lideranças. Este compêndio não dita apenas regras operacionais de avaliação; ele serve de estudo prático, consciencialização profunda e matriz filosófica sobre como motivar as equipas rumo à Inovação e Respeito Mútuo Fabril.
                    </p>

                    <nav className="mt-8">
                        <Link href="/admin/rh/produtividade-lideranca">
                            <Button className="bg-white hover:bg-slate-100 text-indigo-900 font-bold tracking-widest uppercase px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all flex border border-indigo-100 items-center gap-2">
                                <ChevronLeft size={20} />
                                Regressar ao Dashboard Analítico
                            </Button>
                        </Link>
                    </nav>
                </div>

                {/* Grid Educacional - Cartões Glassmorfos Premium */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 -mt-10 px-0 md:px-8">
                    {PILARES.map((p, i) => {
                        const Icon = p.icon;
                        return (
                            <div 
                                key={p.id} 
                                className="group bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 relative flex flex-col justify-between"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                                    <Icon size={120} />
                                </div>
                                
                                <div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white shadow-lg overflow-hidden relative`}>
                                            <div className="absolute inset-0 bg-white/20 -skew-x-12 translate-x-4"></div>
                                            <Icon size={28} strokeWidth={2.5} className="drop-shadow-sm" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">
                                                Nº {String(i+1).padStart(2, '0')}
                                            </span>
                                            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight">
                                                {p.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className={`p-4 rounded-xl mb-6 ${p.bg} border border-transparent`}>
                                        <div className="flex gap-2">
                                            <Quote className={`shrink-0 w-4 h-4 opacity-70 ${p.text}`} />
                                            <p className={`font-semibold text-[13px] leading-relaxed italic ${p.text}`}>
                                                {p.quote}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-5">
                                    <h4 className="text-[11px] font-black tracking-widest uppercase text-slate-400 mb-3 flex items-center gap-2">
                                        <BookOpen size={14} className="text-blue-500" /> Orientações e Missão
                                    </h4>
                                    <p className="text-slate-600 text-sm leading-relaxed font-medium">
                                        {p.desc}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-20 pt-10 border-t-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-70">
                    <HardHat size={32} className="text-slate-300 mb-4" />
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                        A excelência da fábrica é moldada pela sua liderança.
                    </p>
                    <p className="text-xs mt-2 text-slate-400 font-medium">Bússola Estrutural & PDI Co-Pilot (Inteligência Artificial) • Ano de 2026</p>
                </div>
            </main>
        </div>
    );
}

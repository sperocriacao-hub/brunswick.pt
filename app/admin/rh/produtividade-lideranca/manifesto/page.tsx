"use client";

import React from 'react';
import { Network, ShieldCheck, Zap, Crosshair, HeartPulse, HardHat, Recycle, LayoutGrid, Handshake, ShieldAlert, Cpu, Trophy, BarChart3, LineChart } from 'lucide-react';
import Link from 'next/link';

const PILARES = [
    { id: '1', title: 'HST (Higiene e Segurança)', icon: ShieldAlert, color: 'text-amber-400', desc: 'Como esta a area gerida pelo líder a níveis de Segurança e higiene do trabalho, fomenta um ambiente de trabalho seguro?; se preocupa com a segurança ocupacional a fim de prevenir lesões, baixas, acidentes, evitando a falta de fornecimento laboral?' },
    { id: '2', title: 'Rigor EPI', icon: HardHat, color: 'text-amber-500', desc: 'Como esta a area gerida a níveis de segurança pessoal do operario, é rigoroso no cumprimento das normas? no uso diário? nas permissões de trabalho?' },
    { id: '3', title: 'Metodologia 5S', icon: Recycle, color: 'text-emerald-400', desc: 'Limpeza e organização profunda. Elimina o desnecessário? O ambiente de trabalho está otimizado e de fácil acesso ao operário? Como está o hábito cultural da equipa?' },
    { id: '4', title: 'Eficiência (H/H)', icon: Zap, color: 'text-blue-400', desc: 'Capacidade de extrair valor (horas ganhas / horas gastas). As pessoas necessárias estavam distribuídas inteligentemente de acordo as necessidades no posto de trabalho?' },
    { id: '5', title: 'Alcançar o Objetivo', icon: Crosshair, color: 'text-red-400', desc: 'Missão dada é missão cumprida. Avaliamos não apenas os números, mas ações e exercícios. O desafio imposto à linha foi alcançado neste perímetro?' },
    { id: '6', title: 'Atitude (Int. Emocional)', icon: HeartPulse, color: 'text-rose-400', desc: 'Empatia, integridade, ética, foco no desenvolvimento de pessoas, Segurança Psicológica, adaptabilidade e mentalidade rigorosa, mas humana, focada em resultados.' },
    { id: '7', title: 'Gestão e Motivação', icon: Trophy, color: 'text-yellow-400', desc: 'Avalia a habilidade da liderança em manter a equipa coesa, alinhada e focada sob pressão fabril extrema.' },
    { id: '8', title: 'Desenvolvimento e Mentoria', icon: Network, color: 'text-indigo-400', desc: 'Capacidade de expansão de talentos. Mentoria ativa, matriz de polivalência, e formação orgânica de novos sucessores.' },
    { id: '9', title: 'Caça ao Desperdício (Kaizen)', icon: LayoutGrid, color: 'text-cyan-400', desc: 'Fomentar o envolvimento da equipa no Kaizen e Gemba Walking. Não apenas identificar, mas envolver e aplicar o tratamento do desperdício.' },
    { id: '10', title: 'Zelo e Qualidade', icon: ShieldCheck, color: 'text-emerald-500', desc: 'Zelo pela integridade. Produto sempre limpo, protegido. Avalia a proteção da qualidade em cada etapa sem sacrifício em nome da rapidez.' },
    { id: '11', title: 'Métricas de Operações', icon: Cpu, color: 'text-purple-400', desc: 'Identificar gargalos (OEE, FPY), Tempos de Ciclo / Takt-Time, combater retrabalhos/refugos, OTIF, Turnover de equipa e custos operacionais.' },
    { id: '12', title: 'Melhoria Contínua', icon: LineChart, color: 'text-green-400', desc: 'Medir a cultura e fome do líder por melhorar 1% todos os dias. A atitude insaciável por otimizar o fluxo, ferramentas e condições.' },
    { id: '13', title: 'Transparência de KPIs', icon: BarChart3, color: 'text-blue-500', desc: 'Como está a ser feita a passagem de KPIs para as bases? Toda a gente está comprometida com a realidade e com os números da empresa?' },
    { id: '14', title: 'Guardião da Cultura', icon: Handshake, color: 'text-pink-400', desc: 'O verdadeiro "Walk the Talk". Reuniões 1-on-1 de feedback, consistência moral, eNPS alto, Onboarding alinhado com a cultura Brunswick.' },
];

export default function LiderancaManifesto() {
    return (
        <div className="min-h-screen bg-neutral-950 font-sans text-slate-300 relative overflow-hidden">
            {/* Background Grid & Glow (High-Tech Space Theme) */}
            <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[150px] rounded-full"></div>

            <main className="relative max-w-[1600px] mx-auto px-6 py-12 lg:p-16 z-10">
                {/* Cabeçalho */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/40 border border-blue-500/30 rounded-full text-blue-400 text-xs font-mono font-bold tracking-widest uppercase">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            Brunswick Architecture
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight uppercase">
                            Manifesto <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Liderança 360</span>
                        </h1>
                        <p className="text-slate-400 max-w-3xl text-sm md:text-base font-light leading-relaxed">
                            Matriz Operacional e Filosófica de Avaliação de Comando. Este é o conjunto rigoroso de vetores onde esperamos que as nossas chefias 
                            atinjam a excelência contínua (Top-down, Bottom-up e Algorítmica). 
                        </p>
                    </div>
                    
                    <Link href="/admin/rh/produtividade-lideranca" className="hidden md:inline-flex items-center gap-2 px-6 py-3 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-all rounded text-sm font-bold uppercase tracking-widest text-slate-300">
                        Regressar ao Dashboard
                    </Link>
                </div>

                {/* Grade dos 14 Pilares no estilo Dark / Glassmorphism */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {PILARES.map((p, i) => {
                        const Icon = p.icon;
                        return (
                            <div key={p.id} className="group relative bg-[#0b0c10] border border-slate-800 hover:border-slate-600 p-6 rounded-xl transition-all duration-500 overflow-hidden">
                                {/* Linha neon no fundo */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="flex items-start gap-5 relative z-10">
                                    <div className={`p-4 bg-slate-900/50 rounded-lg border border-slate-800 ${p.color} ring-1 ring-white/5`}>
                                        <Icon size={28} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-100 tracking-tight mb-2">
                                            <span className="text-slate-600 font-mono text-xs mr-2">{String(i+1).padStart(2, '0')}</span> 
                                            {p.title}
                                        </h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            {p.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between">
                    <p className="text-xs font-mono text-slate-600 uppercase tracking-widest">
                        Documento Protocolado // Sistema AI de Avaliação Inteligente
                    </p>
                    <Link href="/admin/rh/produtividade-lideranca" className="md:hidden mt-4 inline-flex items-center gap-2 px-6 py-3 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-all rounded text-sm font-bold uppercase tracking-widest text-slate-300">
                        Regressar
                    </Link>
                </div>
            </main>
        </div>
    );
}

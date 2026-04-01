"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HeartHandshake, GraduationCap, ArrowRight, Crosshair } from 'lucide-react';

export default function QuiosqueHub() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-blue-500">
            <div className="text-center mb-16 animate-in slide-in-from-top duration-700">
                <Crosshair className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">Terminal de Feedback 360</h1>
                <p className="text-blue-200 mt-4 font-medium text-lg max-w-2xl mx-auto">
                    Selecione qual a via de comunicação que deseja utilizar. Os Inquéritos de Clima são criptografados garantindo anonimato absoluto.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
                
                {/* 1. Liderança e Cultura */}
                <Link href="/operador/quiz/lideranca" className="group relative bg-slate-900 border-2 border-slate-800 hover:border-blue-500 rounded-3xl p-8 transition-all hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-slate-800 group-hover:bg-blue-950 rounded-full flex items-center justify-center mb-6 transition-all">
                        <ShieldCheck className="w-12 h-12 text-blue-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Avaliação de Cultura e Liderança</h2>
                    <p className="text-slate-400 mb-8 flex-1">Inquérito onde submete a sua perceção sobre o Posto de Trabalho, ferramentas, e a performance do seu Coordenador de Linha.</p>
                    <div className="w-full flex items-center justify-between px-6 py-4 bg-slate-800 group-hover:bg-blue-600 rounded-xl transition-colors">
                        <span className="font-bold text-white uppercase tracking-widest text-xs">Entrar no Quiosque</span>
                        <ArrowRight className="text-white w-5 h-5" />
                    </div>
                </Link>

                {/* 2. Satisfação e Clima */}
                <Link href="/operador/quiz/satisfacao" className="group relative bg-slate-900 border-2 border-slate-800 hover:border-pink-500 rounded-3xl p-8 transition-all hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(236,72,153,0.15)] flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-slate-800 group-hover:bg-pink-950 rounded-full flex items-center justify-center mb-6 transition-all">
                        <HeartHandshake className="w-12 h-12 text-pink-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Inquérito de Satisfação Geral</h2>
                    <p className="text-slate-400 mb-8 flex-1">Portal totalmente livre para comunicar o seu estado de espírito e sugestões criativas de melhoria contínua na fábrica.</p>
                    <div className="w-full flex items-center justify-between px-6 py-4 bg-slate-800 group-hover:bg-pink-600 rounded-xl transition-colors">
                        <span className="font-bold text-white uppercase tracking-widest text-xs">Acesso Anónimo</span>
                        <ArrowRight className="text-white w-5 h-5" />
                    </div>
                </Link>

                {/* 3. Formação / Mestre e Aprendiz */}
                <Link href="/operador/quiz/formacao" className="group relative bg-slate-900 border-2 border-slate-800 hover:border-orange-500 rounded-3xl p-8 transition-all hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(249,115,22,0.15)] flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-slate-800 group-hover:bg-orange-950 rounded-full flex items-center justify-center mb-6 transition-all">
                        <GraduationCap className="w-12 h-12 text-orange-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Feedback de Formação Fabril</h2>
                    <p className="text-slate-400 mb-8 flex-1">Foi Formador hoje? Foi Formando e aprendeu a usar uma máquina nova? Responda a este pequeno inquérito do seu desempenho ILUO.</p>
                    <div className="w-full flex items-center justify-between px-6 py-4 bg-slate-800 group-hover:bg-orange-600 rounded-xl transition-colors">
                        <span className="font-bold text-white uppercase tracking-widest text-xs">Identificar Módulo</span>
                        <ArrowRight className="text-white w-5 h-5" />
                    </div>
                </Link>

            </div>
        </div>
    );
}

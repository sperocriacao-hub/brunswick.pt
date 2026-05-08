"use client";

import React from 'react';
import Link from 'next/link';
import { Activity, Target, ArrowRight, Crosshair } from 'lucide-react';

export default function QuiosqueLeanHub() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-teal-500">
            <div className="text-center mb-16 animate-in slide-in-from-top duration-700">
                <Target className="w-16 h-16 text-teal-500 mx-auto mb-6" />
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">Terminal Lean & 5S</h1>
                <p className="text-teal-200 mt-4 font-medium text-lg max-w-2xl mx-auto">
                    Selecione a operação de Melhoria Contínua. Ajude a manter o chão de fábrica limpo, organizado e eficiente.
                </p>
            </div>

            <div className="flex justify-center max-w-4xl mx-auto w-full">
                {/* 1. Ronda 5S */}
                <Link href="/operador/5s/ronda" className="group relative bg-slate-900 border-2 border-slate-800 hover:border-teal-500 rounded-3xl p-8 transition-all hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(20,184,166,0.15)] flex flex-col items-center text-center max-w-md w-full">
                    <div className="w-24 h-24 bg-slate-800 group-hover:bg-teal-950 rounded-full flex items-center justify-center mb-6 transition-all">
                        <Activity className="w-12 h-12 text-teal-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Auditoria 5S (Ronda)</h2>
                    <p className="text-slate-400 mb-8 flex-1">Inicie uma nova ronda de avaliação 5S para a sua área ou estação. Siga os passos e registe as conformidades.</p>
                    <div className="w-full flex items-center justify-between px-6 py-4 bg-slate-800 group-hover:bg-teal-600 rounded-xl transition-colors">
                        <span className="font-bold text-white uppercase tracking-widest text-xs">Iniciar Ronda</span>
                        <ArrowRight className="text-white w-5 h-5" />
                    </div>
                </Link>
            </div>
        </div>
    );
}

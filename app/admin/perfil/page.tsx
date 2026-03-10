"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { User, Settings, Shield, LogOut, Moon, Sun, Monitor, Ruler, Save, Loader2 } from 'lucide-react';

export default function PerfilPage() {
    const supabase = createClient();
    const router = useRouter();

    const [userEmail, setUserEmail] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'pessoais' | 'preferencias' | 'seguranca'>('pessoais');
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user?.email) {
                setUserEmail(data.user.email);
            }
        });
    }, [supabase.auth]);

    const handleLogoff = async () => {
        setIsLoggingOut(true);
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
            <header className="mb-8 border-b border-slate-200 pb-6 flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0">
                    {userEmail?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">O Meu Perfil</h1>
                    <p className="text-slate-500 font-medium mt-1">{userEmail || 'A carregar email...'}</p>
                </div>
                <div className="ml-auto">
                    <button
                        onClick={handleLogoff}
                        disabled={isLoggingOut}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold rounded-md transition-colors border border-red-200 shadow-sm disabled:opacity-50"
                    >
                        {isLoggingOut ? <Loader2 className="animate-spin" size={18} /> : <LogOut size={18} />}
                        Encerrar Sessão
                    </button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Tabs Sidebar */}
                <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('pessoais')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${activeTab === 'pessoais' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <User size={18} /> Dados Pessoais
                    </button>
                    <button
                        onClick={() => setActiveTab('preferencias')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${activeTab === 'preferencias' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <Settings size={18} /> Preferências M.E.S
                    </button>
                    <button
                        onClick={() => setActiveTab('seguranca')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${activeTab === 'seguranca' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <Shield size={18} /> Segurança
                    </button>
                </aside>

                {/* Tab Content */}
                <main className="flex-1 min-w-0">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                        {/* Tab: DADOS PESSOAIS */}
                        {activeTab === 'pessoais' && (
                            <div className="p-6 md:p-8 animate-in slide-in-from-right-4 duration-300">
                                <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Identidade Digital</h2>

                                <div className="space-y-4 max-w-md">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Principal (Login)</label>
                                        <input
                                            type="text"
                                            disabled
                                            value={userEmail}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-500 cursor-not-allowed font-medium"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">Para alterar o email corporativo, contacte o seu Gestor de Recursos Humanos.</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nível de Acesso Ativo</label>
                                        <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 font-bold flex items-center gap-2 text-sm">
                                            <Shield size={16} className="text-emerald-500" /> Confirmado via JWT e Tabela RH
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: PREFERÊNCIAS */}
                        {activeTab === 'preferencias' && (
                            <div className="p-6 md:p-8 animate-in slide-in-from-right-4 duration-300">
                                <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Configurações de Layout (Brevemente)</h2>

                                <div className="space-y-8">
                                    {/* Tema Visual */}
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Monitor size={16} className="text-slate-400" /> Tema Global</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <button className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg opacity-50 cursor-not-allowed bg-slate-50">
                                                <Sun size={24} className="text-amber-500 mb-2" />
                                                <span className="text-sm font-bold text-slate-600">Modo Claro</span>
                                            </button>
                                            <button className="flex flex-col items-center justify-center p-4 border-2 border-slate-900 rounded-lg bg-slate-900 shadow-md">
                                                <Moon size={24} className="text-slate-300 mb-2" />
                                                <span className="text-sm font-bold text-white">Modo Escuro</span>
                                            </button>
                                            <button className="flex flex-col items-center justify-center p-4 border-2 border-blue-600 rounded-lg bg-blue-50">
                                                <Monitor size={24} className="text-blue-600 mb-2" />
                                                <span className="text-sm font-bold text-blue-900">Sistema (Auto)</span>
                                                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full absolute -top-2 -right-2">Ativo</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Unidades */}
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Ruler size={16} className="text-slate-400" /> Sistema de Medidas Europeu</h3>
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">Métrico (Centímetros, Kg)</p>
                                                <p className="text-xs text-slate-500 mt-0.5">Norma Brunswick Vila Nova de Cerveira</p>
                                            </div>
                                            <div className="px-3 py-1 bg-green-100 text-green-800 font-bold text-xs rounded-full border border-green-200">
                                                Obrigatório
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: SEGURANÇA */}
                        {activeTab === 'seguranca' && (
                            <div className="p-6 md:p-8 animate-in slide-in-from-right-4 duration-300">
                                <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2 flex items-center gap-2">
                                    <Shield size={20} className="text-amber-500" /> Auditoria e Password
                                </h2>

                                <div className="space-y-6">
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                        <h3 className="text-sm font-bold text-amber-800">Alteração de Password</h3>
                                        <p className="text-xs text-amber-700 mt-1 mb-4">
                                            A funcionalidade de troca rápida de palavra-passe requer um email transacional (SMTP) ativo, que será integrado futuramente no M.E.S.
                                            Se necessita de reset imediato, peça à Administração de TI.
                                        </p>
                                        <button disabled className="px-4 py-2 bg-amber-600 text-white font-bold rounded-md opacity-50 cursor-not-allowed shadow-sm text-sm">
                                            Solicitar Redefinição de Password
                                        </button>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-slate-700 mb-2">Sessões Ativas</h3>
                                        <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <Monitor className="text-blue-500 mt-0.5" size={20} />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">Sessão Atual (Web Browser)</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Autenticação Válida Edge DB</p>
                                                </div>
                                            </div>
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-200">Este Dispositivo</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

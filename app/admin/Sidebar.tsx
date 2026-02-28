"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, GitBranch, Layers, Settings, CalendarDays, Activity, Menu, X, AlertTriangle } from 'lucide-react';

export function Sidebar({ userEmail }: { userEmail: string | undefined }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { name: "Dashboard", href: "/admin", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg> },
        { name: "Ordens de Produção", href: "/admin/producao/nova", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
        { name: "Terminal HMI (Operador)", href: "/operador", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg> }
    ];

    return (
        <>
            {/* Mobile Touch Header (Visível apenas em Mobile) */}
            <div className="md:hidden flex items-center justify-between bg-blue-900 text-white p-4 shadow-md shrink-0 sticky top-0 z-30">
                <div className="font-bold tracking-tight text-white flex items-center gap-2">
                    <Layers className="text-white" size={24} /> Brunswick.pt
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1 rounded-md hover:bg-blue-800 transition-colors"
                >
                    {isOpen ? <X size={26} /> : <Menu size={26} />}
                </button>
            </div>

            {/* Mobile Overlay Escurecimento */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* A Barra Lateral do M.E.S */}
            <aside className={`fixed md:relative top-0 left-0 w-64 bg-blue-900 text-white flex flex-col justify-between h-full overflow-y-auto shadow-xl z-50 transform transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex flex-col flex-1 whitespace-nowrap">
                    {/* O Logo é Oculto no Mobile Side (Porque já está no Mobile Header Supremo) */}
                    <div className="hidden md:flex text-2xl font-bold tracking-tight text-white mb-8 px-2 items-center gap-2">
                        <Layers className="text-white" /> Brunswick.pt
                    </div>
                    <div className="flex flex-col gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${isActive
                                        ? 'bg-blue-800 text-white shadow-sm border border-transparent'
                                        : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'
                                        }`}
                                >
                                    <span className={`${isActive ? 'text-white' : 'text-blue-300'} w-5 h-5 flex items-center justify-center`}>
                                        {link.icon}
                                    </span>
                                    <span className="text-sm">{link.name}</span>
                                </Link>
                            );
                        })}

                        <div className="mt-8">
                            <p className="px-3 text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-2">Equipas e Talento</p>
                            <nav className="flex flex-col gap-1 mb-6">
                                <Link onClick={() => setIsOpen(false)} href="/admin/rh" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === '/admin/rh' || pathname.startsWith('/admin/rh/cadastro') ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <Settings size={18} className={pathname === '/admin/rh' || pathname.startsWith('/admin/rh/cadastro') ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Gerir Operadores</span>
                                </Link>
                                <Link onClick={() => setIsOpen(false)} href="/admin/rh/avaliacoes" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/rh/avaliacoes') ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <CalendarDays size={18} className={pathname.includes('/admin/rh/avaliacoes') ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Avaliações Diárias</span>
                                </Link>
                                <Link onClick={() => setIsOpen(false)} href="/admin/rh/produtividade" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/rh/produtividade') ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <Activity size={18} className={pathname.includes('/admin/rh/produtividade') ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Produtividade OEE</span>
                                </Link>
                                <Link onClick={() => setIsOpen(false)} href="/admin/rh/assiduidade" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/rh/assiduidade') ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <CalendarDays size={18} className={pathname.includes('/admin/rh/assiduidade') ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Assiduidade Ativa</span>
                                </Link>
                            </nav>
                            <p className="px-3 text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-2 mt-6">M.E.S Logística</p>
                            <nav className="flex flex-col gap-1 mb-6">
                                <Link onClick={() => setIsOpen(false)} href="/admin/producao/planeamento" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/producao/planeamento') ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <CalendarDays size={18} className={pathname.includes('/admin/producao/planeamento') ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Planeamento Semanal</span>
                                </Link>
                                <Link onClick={() => setIsOpen(false)} href="/admin/producao/live" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/producao/live') ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <Box size={18} className={pathname.includes('/admin/producao/live') ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Monitorização Live</span>
                                </Link>
                                <Link onClick={() => setIsOpen(false)} href="/admin/producao/andon" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/producao/andon') ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <AlertTriangle size={18} className={pathname.includes('/admin/producao/andon') ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Saúde OEE do Andon</span>
                                </Link>
                            </nav>
                            <p className="px-3 text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-2">Engenharia</p>
                            <nav className="flex flex-col gap-1 mb-6">
                                <Link onClick={() => setIsOpen(false)} href="/admin/modelos" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/modelos') ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <Box size={18} className={pathname.includes('/admin/modelos') ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Modelos & Produto</span>
                                </Link>
                                <Link onClick={() => setIsOpen(false)} href="/admin/engenharia/regras" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/engenharia/regras') ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <GitBranch size={18} className={pathname.includes('/admin/engenharia/regras') ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Regras Sequenciais</span>
                                </Link>
                                <Link onClick={() => setIsOpen(false)} href="/admin/engenharia/roteiros" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/engenharia/roteiros') ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <Layers size={18} className={pathname.includes('/admin/engenharia/roteiros') ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Tempos Roteiro OEE</span>
                                </Link>
                                <Link onClick={() => setIsOpen(false)} href="/admin/engenharia/oee" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/engenharia/oee') ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <Activity size={18} className={pathname.includes('/admin/engenharia/oee') ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Desperdício OEE</span>
                                </Link>
                                <Link onClick={() => setIsOpen(false)} href="/admin/engenharia/genealogia" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/engenharia/genealogia') ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <Layers size={18} className={pathname.includes('/admin/engenharia/genealogia') ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Rastreabilidade B.O.M</span>
                                </Link>
                            </nav>

                            <p className="px-3 text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-2">Configuração Fabril</p>
                            <nav className="flex flex-col gap-1 mb-6">
                                <Link onClick={() => setIsOpen(false)} href="/admin/fabrica" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/fabrica') ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <Settings size={18} className={pathname.includes('/admin/fabrica') ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Fábrica & Estações</span>
                                </Link>
                                <Link onClick={() => setIsOpen(false)} href="/admin/qualidade/templates" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/qualidade') ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <Settings size={18} className={pathname.includes('/admin/qualidade') ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Checklists Qualidade</span>
                                </Link>
                            </nav>

                            <p className="px-3 text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-2">Sistema</p>
                            <nav className="flex flex-col gap-1">
                                <Link onClick={() => setIsOpen(false)} href="/admin/diagnostico" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === '/admin/diagnostico' ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <Settings size={18} className={pathname === '/admin/diagnostico' ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Central Dispositivos</span>
                                </Link>
                                <Link onClick={() => setIsOpen(false)} href="/admin/configuracoes" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === '/admin/configuracoes' || pathname.startsWith('/admin/configuracoes') ? 'bg-blue-800 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
                                    <Settings size={18} className={pathname === '/admin/configuracoes' || pathname.startsWith('/admin/configuracoes') ? 'text-white' : 'text-blue-300'} />
                                    <span className="text-sm border-transparent">Configurações Globais</span>
                                </Link>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Bottom Section - User Profile / Auth */}
                <div className="p-4 border-t border-[rgba(255,255,255,0.05)] bg-[rgba(15,23,42,0.6)] mt-auto">
                    <div className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-blue-800/50 rounded-lg transition-colors border border-transparent hover:border-[rgba(255,255,255,0.1)]">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                            {userEmail?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold text-white truncate">{userEmail}</span>
                            <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider mt-0.5">Administrador</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

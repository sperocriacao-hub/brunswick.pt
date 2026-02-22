"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, GitBranch, Layers, Settings, CalendarDays, Activity } from 'lucide-react';

export function Sidebar({ userEmail }: { userEmail: string | undefined }) {
    const pathname = usePathname();

    const navLinks = [
        { name: "Dashboard", href: "/admin", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg> },
        { name: "Ordens de Produção", href: "/admin/producao/nova", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
        { name: "Terminal HMI (Operador)", href: "/operador", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg> }
    ];

    return (
        <aside className="w-64 bg-white text-slate-600 flex flex-col justify-between h-full overflow-y-auto border-r border-slate-200 shadow-sm relative z-20">
            <div className="p-6 flex flex-col flex-1 whitespace-nowrap">
                <div className="text-2xl font-extrabold tracking-tight text-slate-800 mb-8 px-2 flex items-center gap-2">
                    <Layers className="text-blue-600" /> Brunswick.pt
                </div>
                <div className="flex flex-col gap-1">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${isActive
                                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                    }`}
                            >
                                <span className={`${isActive ? 'text-blue-600' : 'text-slate-400'} w-5 h-5 flex items-center justify-center`}>
                                    {link.icon}
                                </span>
                                <span className="text-sm">{link.name}</span>
                            </Link>
                        );
                    })}

                    <div className="mt-8">
                        <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Equipas e Talento</p>
                        <nav className="flex flex-col gap-1 mb-6">
                            <Link href="/admin/rh" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === '/admin/rh' || pathname.startsWith('/admin/rh/cadastro') ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                <Settings size={18} className={pathname === '/admin/rh' || pathname.startsWith('/admin/rh/cadastro') ? 'text-blue-600' : 'text-slate-400'} />
                                <span className="text-sm border-transparent">Gerir Operadores</span>
                            </Link>
                            <Link href="/admin/rh/avaliacoes" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/rh/avaliacoes') ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                <CalendarDays size={18} className={pathname.includes('/admin/rh/avaliacoes') ? 'text-blue-600' : 'text-slate-400'} />
                                <span className="text-sm border-transparent">Avaliações Diárias</span>
                            </Link>
                            <Link href="/admin/rh/produtividade" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/rh/produtividade') ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                <Activity size={18} className={pathname.includes('/admin/rh/produtividade') ? 'text-blue-600' : 'text-slate-400'} />
                                <span className="text-sm border-transparent">Produtividade OEE</span>
                            </Link>
                            <Link href="/admin/rh/assiduidade" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/rh/assiduidade') ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                <CalendarDays size={18} className={pathname.includes('/admin/rh/assiduidade') ? 'text-blue-600' : 'text-slate-400'} />
                                <span className="text-sm border-transparent">Assiduidade Ativa</span>
                            </Link>
                        </nav>
                        <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 mt-6">M.E.S Logística</p>
                        <nav className="flex flex-col gap-1 mb-6">
                            <Link href="/admin/producao/planeamento" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/producao/planeamento') ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                <CalendarDays size={18} className={pathname.includes('/admin/producao/planeamento') ? 'text-blue-600' : 'text-slate-400'} />
                                <span className="text-sm border-transparent">Planeamento Semanal</span>
                            </Link>
                            <Link href="/admin/producao/live" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/producao/live') ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                <Box size={18} className={pathname.includes('/admin/producao/live') ? 'text-blue-600' : 'text-slate-400'} />
                                <span className="text-sm border-transparent">Monitorização Live</span>
                            </Link>
                        </nav>
                        <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Engenharia</p>
                        <nav className="flex flex-col gap-1 mb-6">
                            <Link href="/admin/modelos" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/modelos') ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                <Box size={18} className={pathname.includes('/admin/modelos') ? 'text-blue-600' : 'text-slate-400'} />
                                <span className="text-sm border-transparent">Modelos & Produto</span>
                            </Link>
                            <Link href="/admin/engenharia/regras" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/engenharia/regras') ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                <GitBranch size={18} className={pathname.includes('/admin/engenharia/regras') ? 'text-blue-600' : 'text-slate-400'} />
                                <span className="text-sm border-transparent">Regras Sequenciais</span>
                            </Link>
                            <Link href="/admin/engenharia/roteiros" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/engenharia/roteiros') ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                <Layers size={18} className={pathname.includes('/admin/engenharia/roteiros') ? 'text-blue-600' : 'text-slate-400'} />
                                <span className="text-sm border-transparent">Tempos Roteiro OEE</span>
                            </Link>
                        </nav>

                        <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Configuração Fabril</p>
                        <nav className="flex flex-col gap-1 mb-6">
                            <Link href="/admin/fabrica" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/fabrica') ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                <Settings size={18} className={pathname.includes('/admin/fabrica') ? 'text-blue-600' : 'text-slate-400'} />
                                <span className="text-sm border-transparent">Fábrica & Estações</span>
                            </Link>
                            <Link href="/admin/qualidade/templates" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes('/admin/qualidade') ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                <Settings size={18} className={pathname.includes('/admin/qualidade') ? 'text-blue-600' : 'text-slate-400'} />
                                <span className="text-sm border-transparent">Checklists Qualidade</span>
                            </Link>
                        </nav>

                        <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Sistema</p>
                        <nav className="flex flex-col gap-1">
                            <Link href="/admin/diagnostico" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === '/admin/diagnostico' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                <Settings size={18} className={pathname === '/admin/diagnostico' ? 'text-blue-600' : 'text-slate-400'} />
                                <span className="text-sm border-transparent">Central Dispositivos</span>
                            </Link>
                            <Link href="/admin/configuracoes" className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === '/admin/configuracoes' || pathname.startsWith('/admin/configuracoes') ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                <Settings size={18} className={pathname === '/admin/configuracoes' || pathname.startsWith('/admin/configuracoes') ? 'text-blue-600' : 'text-slate-400'} />
                                <span className="text-sm border-transparent">Notificações</span>
                            </Link>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Bottom Section - User Profile / Auth */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 mt-auto">
                <div className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-200/50 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                    <div className="w-8 h-8 rounded-full bg-blue-600 border border-blue-300 flex items-center justify-center text-white font-bold shadow-sm">
                        {userEmail?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-slate-800 truncate">{userEmail}</span>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">Administrador</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}

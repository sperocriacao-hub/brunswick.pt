"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, GitBranch, Layers, Settings, CalendarDays } from 'lucide-react';

export function Sidebar({ userEmail }: { userEmail: string | undefined }) {
    const pathname = usePathname();

    const navLinks = [
        { name: "Dashboard", href: "/admin", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg> },
        { name: "Ordens de Produção", href: "/admin/producao/nova", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
        { name: "Terminal HMI (Operador)", href: "/operador", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg> }
    ];

    return (
        <aside className="w-64 border-r bg-card flex flex-col justify-between h-full overflow-y-auto">
            <div className="p-6 flex flex-col flex-1 whitespace-nowrap">
                <div className="text-2xl font-bold tracking-tight text-primary mb-8 px-2 flex items-center gap-2">
                    <Layers className="text-primary" /> Brunswick.pt
                </div>
                <div className="flex flex-col gap-1">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive
                                    ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                <span className="text-muted-foreground w-5 h-5 flex items-center justify-center">
                                    {link.icon}
                                </span>
                                <span className="text-sm">{link.name}</span>
                            </Link>
                        );
                    })}

                    <div className="mt-8">
                        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Equipas e Talento</p>
                        <nav className="flex flex-col gap-1 mb-6">
                            <Link href="/admin/rh" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === '/admin/rh' || pathname.startsWith('/admin/rh/cadastro') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>
                                <Settings size={20} />
                                <span className="text-sm">Gerir Operadores</span>
                            </Link>
                            <Link href="/admin/rh/avaliacoes" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname.includes('/admin/rh/avaliacoes') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>
                                <CalendarDays size={20} />
                                <span className="text-sm">Avaliações Diárias</span>
                            </Link>
                        </nav>
                        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">M.E.S Logística</p>
                        <nav className="flex flex-col gap-1 mb-6">
                            <Link href="/admin/producao/planeamento" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname.includes('/admin/producao/planeamento') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>
                                <CalendarDays size={20} />
                                <span className="text-sm">Planeamento Semanal</span>
                            </Link>
                            <Link href="/admin/producao/live" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname.includes('/admin/producao/live') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>
                                <Box size={20} />
                                <span className="text-sm">Monitorização Live</span>
                            </Link>
                        </nav>
                        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Engenharia</p>
                        <nav className="flex flex-col gap-1 mb-6">
                            <Link href="/admin/modelos" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname.includes('/admin/modelos') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>
                                <Box size={20} />
                                <span className="text-sm">Modelos & Produto</span>
                            </Link>
                            <Link href="/admin/engenharia/regras" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname.includes('/admin/engenharia/regras') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>
                                <GitBranch size={20} />
                                <span className="text-sm">Regras Sequenciais</span>
                            </Link>
                            <Link href="/admin/engenharia/roteiros" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname.includes('/admin/engenharia/roteiros') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>
                                <Layers size={20} />
                                <span className="text-sm">Tempos Roteiro OEE</span>
                            </Link>
                        </nav>

                        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Configuração Fabril</p>
                        <nav className="flex flex-col gap-1 mb-6">
                            <Link href="/admin/fabrica" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname.includes('/admin/fabrica') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>
                                <Settings size={20} />
                                <span className="text-sm">Fábrica & Estações</span>
                            </Link>
                            <Link href="/admin/qualidade/templates" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname.includes('/admin/qualidade') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>
                                <Settings size={20} />
                                <span className="text-sm">Checklists Qualidade</span>
                            </Link>
                        </nav>

                        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sistema</p>
                        <nav className="flex flex-col gap-1">
                            <Link href="/admin/diagnostico" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === '/admin/diagnostico' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>
                                <Settings size={20} />
                                <span className="text-sm">Central Dispositivos</span>
                            </Link>
                            <Link href="/admin/configuracoes" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === '/admin/configuracoes' || pathname.startsWith('/admin/configuracoes') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>
                                <Settings size={20} />
                                <span className="text-sm">Notificações</span>
                            </Link>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Bottom Section - User Profile / Auth */}
            <div className="p-4 border-t mt-auto">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {userEmail?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-foreground truncate">{userEmail}</span>
                        <span className="text-xs text-muted-foreground">Administrador</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}

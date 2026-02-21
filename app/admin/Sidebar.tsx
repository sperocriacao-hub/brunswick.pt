"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, GitBranch, Layers, Settings } from 'lucide-react';

export function Sidebar({ userEmail }: { userEmail: string | undefined }) {
    const pathname = usePathname();

    const navLinks = [
        { name: "Dashboard", href: "/admin", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg> },
        { name: "Ordens de Produção", href: "/admin/producao/nova", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
        { name: "Terminal HMI (Operador)", href: "/operador", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg> }
    ];

    return (
        <aside className="sidebar flex flex-col justify-between">
            <div style={{ flex: 1 }} className="sidebar-top">
                <div className="brand-title">Brunswick.pt</div>
                <nav className="flex flex-col gap-4 mt-8 sidebar-nav">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`p-4 flex items-center gap-4 sidebar-link ${isActive ? 'active glass-panel' : ''}`}
                                style={{
                                    opacity: isActive ? 1 : 0.7,
                                    transition: "all 0.2s",
                                    borderLeft: isActive ? "4px solid var(--primary)" : "4px solid transparent"
                                }}
                            >
                                {link.icon}
                                <span style={{ fontWeight: 500 }} className="sidebar-text">{link.name}</span>
                            </Link>
                        );
                    })}

                    <div className="mb-8 mt-4"> {/* Added margin-top for spacing */}
                        <p className="sidebar-group-title">M.E.S Logística</p>
                        <nav className="flex flex-col gap-2 mb-4">
                            <Link href="/admin/producao/live" className={`p-4 flex items-center gap-4 sidebar-link ${pathname.includes('/admin/producao/live') ? 'active glass-panel' : ''}`}
                                style={{
                                    opacity: pathname.includes('/admin/producao/live') ? 1 : 0.7,
                                    transition: "all 0.2s",
                                    borderLeft: pathname.includes('/admin/producao/live') ? "4px solid var(--primary)" : "4px solid transparent"
                                }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /><path d="M15 3v18" /></svg>
                                <span style={{ fontWeight: 500 }} className="sidebar-text">Monitorização Live</span>
                            </Link>
                        </nav>
                        <p className="sidebar-group-title">Engenharia</p>
                        <nav className="flex flex-col gap-2">
                            <Link href="/admin/modelos" className={`p-4 flex items-center gap-4 sidebar-link ${pathname === '/admin/modelos' ? 'active glass-panel' : ''}`}
                                style={{
                                    opacity: pathname.includes('/admin/modelos') ? 1 : 0.7,
                                    transition: "all 0.2s",
                                    borderLeft: pathname.includes('/admin/modelos') ? "4px solid var(--primary)" : "4px solid transparent"
                                }}>
                                <Box size={20} />
                                <span style={{ fontWeight: 500 }} className="sidebar-text">Modelos & Produto</span>
                            </Link>
                            <Link href="/admin/engenharia/regras" className={`p-4 flex items-center gap-4 sidebar-link ${pathname.includes('/admin/engenharia/regras') ? 'active glass-panel' : ''}`}
                                style={{
                                    opacity: pathname.includes('/admin/engenharia/regras') ? 1 : 0.7,
                                    transition: "all 0.2s",
                                    borderLeft: pathname.includes('/admin/engenharia/regras') ? "4px solid var(--primary)" : "4px solid transparent"
                                }}>
                                <GitBranch size={20} />
                                <span style={{ fontWeight: 500 }} className="sidebar-text">Regras de Sequenciamento</span>
                            </Link>
                            <Link href="/admin/engenharia/roteiros" className={`p-4 flex items-center gap-4 sidebar-link ${pathname.includes('/admin/engenharia/roteiros') ? 'active glass-panel' : ''}`}
                                style={{
                                    opacity: pathname.includes('/admin/engenharia/roteiros') ? 1 : 0.7,
                                    transition: "all 0.2s",
                                    borderLeft: pathname.includes('/admin/engenharia/roteiros') ? "4px solid var(--primary)" : "4px solid transparent"
                                }}>
                                <Layers size={20} />
                                <span style={{ fontWeight: 500 }} className="sidebar-text">Roteiros Produtivos</span>
                            </Link>
                            <Link href="/admin/fabrica" className={`p-4 flex items-center gap-4 sidebar-link ${pathname.includes('/admin/fabrica') ? 'active glass-panel' : ''}`}
                                style={{
                                    opacity: pathname.includes('/admin/fabrica') ? 1 : 0.7,
                                    transition: "all 0.2s",
                                    borderLeft: pathname.includes('/admin/fabrica') ? "4px solid var(--primary)" : "4px solid transparent"
                                }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                <span style={{ fontWeight: 500 }} className="sidebar-text">Estrutura de Fábrica</span>
                            </Link>
                        </nav>
                    </div>

                    <div className="mb-4">
                        <p className="sidebar-group-title">Plataforma</p>
                        <nav className="flex flex-col gap-2">
                            <Link href="/admin/configuracoes" className={`p-4 flex items-center gap-4 sidebar-link ${pathname.includes('/admin/configuracoes') ? 'active glass-panel' : ''}`}
                                style={{
                                    opacity: pathname.includes('/admin/configuracoes') ? 1 : 0.7,
                                    transition: "all 0.2s",
                                    borderLeft: pathname.includes('/admin/configuracoes') ? "4px solid var(--primary)" : "4px solid transparent"
                                }}>
                                <Settings size={20} />
                                <span style={{ fontWeight: 500 }} className="sidebar-text">Configurações Globais</span>
                            </Link>
                            <Link href="/admin/diagnostico" className={`p-4 flex items-center gap-4 sidebar-link ${pathname.includes('/admin/diagnostico') ? 'active glass-panel' : ''}`}
                                style={{
                                    opacity: pathname.includes('/admin/diagnostico') ? 1 : 0.7,
                                    transition: "all 0.2s",
                                    borderLeft: pathname.includes('/admin/diagnostico') ? "4px solid var(--primary)" : "4px solid transparent"
                                }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                <span style={{ fontWeight: 500 }} className="sidebar-text">Diagnóstico ESP32</span>
                            </Link>
                        </nav>
                    </div>
                </nav>
            </div>

            <div className="user-info-bottom" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                <div className="flex items-center gap-3">
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <div style={{ overflow: 'hidden' }} className="user-email-container">
                        <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: 0 }}>Logado como</p>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={userEmail}>{userEmail}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

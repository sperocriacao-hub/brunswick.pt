"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar({ userEmail }: { userEmail: string | undefined }) {
    const pathname = usePathname();

    const navLinks = [
        { name: "Dashboard", href: "/admin", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg> },
        { name: "Ordens de Produção", href: "/admin/producao/nova", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
        { name: "Modelos e Moldes", href: "/admin/modelos/novo", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg> },
        { name: "Diagnóstico ESP32", href: "/admin/diagnostico", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> }
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

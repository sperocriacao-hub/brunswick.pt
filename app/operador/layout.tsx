export default function OperadorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Layout super simples e focado no Shopfloor (Sem menus complexos, ideal para Ecrãs Industriais HMI e Tablets)
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)'
        }}>
            {/* Cabecalho Minimalista Focado no Chão de Fábrica */}
            <header style={{
                padding: '1rem 2rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="brand-title" style={{ margin: 0, fontSize: '1.5rem' }}>Brunswick.pt</div>
                    <span style={{ padding: '0.2rem 0.6rem', background: 'var(--accent)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>HMI TERMINAL</span>
                </div>
            </header>

            <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {children}
            </main>
        </div>
    );
}

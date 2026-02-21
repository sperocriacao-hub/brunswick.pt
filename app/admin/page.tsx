export default function Home() {
  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-title">Brunswick.pt</div>

        <nav className="flex flex-col gap-4 mt-8">
          <a href="/admin" className="p-4 glass-panel flex items-center gap-4" style={{ borderLeft: "4px solid var(--primary)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            <span style={{ fontWeight: 500 }}>Dashboard</span>
          </a>
          <a href="/admin/producao/nova" className="p-4 flex items-center gap-4" style={{ opacity: 0.7, transition: "opacity 0.2s" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span style={{ fontWeight: 500 }}>Ordens de Produção</span>
          </a>
          <a href="/admin/modelos/novo" className="p-4 flex items-center gap-4" style={{ opacity: 0.7, transition: "opacity 0.2s" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            <span style={{ fontWeight: 500 }}>Modelos e Moldes</span>
          </a>
          <a href="/admin/diagnostico" className="p-4 flex items-center gap-4" style={{ opacity: 0.7, transition: "opacity 0.2s" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            <span style={{ fontWeight: 500 }}>Diagnóstico ESP32</span>
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h1>Painel de Diagnóstico</h1>
            <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "0.25rem" }}>Bem-vindo ao sistema de controle central.</p>
          </div>
          <button className="btn btn-primary">Novo Relatório</button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="glass-panel p-6 animate-fade-in animate-delay-1">
            <h3 style={{ color: "var(--primary)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "1px" }}>ESP32 Conectados</h3>
            <div className="flex items-center gap-4 mt-4">
              <span style={{ fontSize: "2.5rem", fontWeight: 700 }}>24</span>
              <span style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>+3 hoje</span>
            </div>
          </div>
          <div className="glass-panel p-6 animate-fade-in animate-delay-2">
            <h3 style={{ color: "var(--secondary)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "1px" }}>Leituras / Minuto</h3>
            <div className="flex items-center gap-4 mt-4">
              <span style={{ fontSize: "2.5rem", fontWeight: 700 }}>1,240</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
          </div>
          <div className="glass-panel p-6 animate-fade-in animate-delay-3">
            <h3 style={{ color: "var(--danger)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "1px" }}>Falhas (Últ. 24h)</h3>
            <div className="flex items-center gap-4 mt-4">
              <span style={{ fontSize: "2.5rem", fontWeight: 700 }}>0</span>
              <span style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>100% Uptime</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <section className="glass-panel p-8 animate-fade-in animate-delay-3" style={{ minHeight: "400px" }}>
          <div className="flex justify-between items-center mb-6">
            <h2>Atividade de Produção</h2>
            <button className="btn btn-outline">Filtrar</button>
          </div>

          <div style={{ opacity: 0.5, textAlign: "center", paddingTop: "4rem" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto", marginBottom: "1rem" }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <p>A aguardar sincronização inicial de dados do Supabase referentes as leituras dos painéis RFID.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

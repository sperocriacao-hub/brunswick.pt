export default function Home() {
  return (
    <>
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
    </>
  );
}

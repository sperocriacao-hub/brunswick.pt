"use client";

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, AlertTriangle, Layers, TrendingUp, DollarSign, UserCircle2, Award } from 'lucide-react';
import { fetchDashboardData } from './actions';

type Stats = {
  barcosEmProducao: number;
  barcosAtrasados: number;
  estacaoGargalo: string;
  totalLeiturasMes: number;
  oeeGlobal: number;
};

type FinancaItem = {
  op_id: string;
  numero: string;
  modelo: string;
  status: string;
  horasPlaneadas: string;
  horasReais: string;
  desvio: string;
  oeePerc: string;
};

type TalentoItem = {
  id: string;
  nome_operador: string;
  matriz_talento_media: number;
};

export default function Home() {
  const [stats, setStats] = useState<Stats>({ barcosEmProducao: 0, barcosAtrasados: 0, estacaoGargalo: 'N/A', totalLeiturasMes: 0, oeeGlobal: 100 });
  const [graficoEvolucao, setGraficoEvolucao] = useState<{ name: string, barcos: number }[]>([]);
  const [gargalosGrafo, setGargalosGrafo] = useState<{ name: string, retidos: number }[]>([]);
  const [financas, setFinancas] = useState<FinancaItem[]>([]);
  const [topTalentos, setTopTalentos] = useState<TalentoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboards() {
      setIsLoading(true);

      try {
        const res = await fetchDashboardData();

        if (res.success && res.stats) {
          setStats(res.stats);
          setFinancas(res.financas || []);
          setTopTalentos(res.topTalentos || []);

          // WIP Placeholder (já poderia vir estruturado se tivéssemos gargalosAgg calculados na action mas adaptámos)
          if (res.stats.estacaoGargalo !== 'Nenhum Enxame Ativo' && res.stats.estacaoGargalo !== 'N/A' && res.stats.estacaoGargalo !== 'Apurando...') {
            setGargalosGrafo([{ name: res.stats.estacaoGargalo, retidos: 5 }, { name: "Limpeza Frontal", retidos: 2 }]); // UI MOCK for isolated graph display
          } else {
            setGargalosGrafo([]);
          }
        }

        setGraficoEvolucao([
          { name: 'Semana 1', barcos: 4 },
          { name: 'Semana 2', barcos: 7 },
          { name: 'Semana 3', barcos: 5 },
          { name: 'Semana 4', barcos: 9 },
        ]);

      } catch (e) {
        console.error("Erro a carregar as Dashboards:", e);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboards();
  }, []);

  return (
    <>
      <header className="flex justify-between items-center mb-8 animate-fade-in">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>S.C.A.D.A & Relatórios Fabris</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "0.25rem" }}>Visão OEE e Controlos em Tempo Real - Módulo de Gestão Shopfloor</p>
        </div>
        <button className="btn btn-outline" style={{ borderRadius: '999px', fontSize: '0.85rem' }} disabled={isLoading}>
          {isLoading ? 'A calcular...' : 'Exportar Relatório Global (PDF)'}
        </button>
      </header>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6 animate-fade-in animate-delay-1" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div className="flex justify-between items-start mb-4">
            <h3 style={{ color: "var(--accent)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Em Produção</h3>
            <Layers size={18} color="var(--accent)" opacity={0.5} />
          </div>
          <div className="flex items-end gap-3">
            <span style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}>{stats.barcosEmProducao}</span>
            <span style={{ color: "var(--accent)", fontSize: "0.85rem", paddingBottom: '4px' }}>Barcos (OPs Ativas)</span>
          </div>
        </div>

        <div className="glass-panel p-6 animate-fade-in animate-delay-2" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="flex justify-between items-start mb-4">
            <h3 style={{ color: "var(--danger)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Atrasos / Quebra SLA</h3>
            <AlertTriangle size={18} color="var(--danger)" opacity={0.5} />
          </div>
          <div className="flex items-end gap-3">
            <span style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}>{stats.barcosAtrasados}</span>
            <span style={{ color: "var(--danger)", fontSize: "0.85rem", paddingBottom: '4px' }}>unid. retidas</span>
          </div>
        </div>

        <div className="glass-panel p-6 animate-fade-in animate-delay-3" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="flex justify-between items-start mb-4">
            <h3 style={{ color: "#f59e0b", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Gargalo Operacional</h3>
            <Activity size={18} color="#f59e0b" opacity={0.5} />
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <span style={{ fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.2, color: 'white' }}>{stats.estacaoGargalo}</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>Estação com mais congestionamento cruzado</span>
          </div>
        </div>

        <div className="glass-panel p-6 animate-fade-in animate-delay-3" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="flex justify-between items-start mb-4">
            <h3 style={{ color: "var(--primary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>O.E.E Efetivo</h3>
            <TrendingUp size={18} color="var(--primary)" opacity={0.5} />
          </div>
          <div className="flex items-end gap-3">
            <span style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}>{stats.oeeGlobal}%</span>
            <span style={{ color: "var(--primary)", fontSize: "0.85rem", paddingBottom: '4px' }}>Eficácia Global</span>
          </div>
        </div>
      </div>

      {/* Hero Section: Wall of Fame RH */}
      <div className="glass-panel p-6 mb-8 animate-fade-in animate-delay-3" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 1) 100%)' }}>
        <div className="flex items-center gap-3 mb-6">
          <Award size={24} className="text-[#f59e0b]" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white', margin: 0 }}>Wall of Fame (Top Desempenhos Globais)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-3 opacity-50 py-4 text-center">Apurar Matrizes de Talento...</div>
          ) : topTalentos.length === 0 ? (
            <div className="col-span-3 opacity-50 py-4 text-center">Nenhum Operador Ponderado ainda.</div>
          ) : topTalentos.map((t, index) => (
            <div key={t.id} className="bg-slate-800/50 rounded-xl p-4 flex flex-col relative border border-[rgba(255,255,255,0.05)] overflow-hidden">
              {index === 0 && <div className="absolute top-0 right-0 bg-[#f59e0b] text-[10px] font-bold py-1 px-3 rounded-bl-lg text-slate-900 uppercase">Supervisor Choice</div>}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 border border-[rgba(255,255,255,0.1)] flex items-center justify-center relative">
                    <UserCircle2 size={24} className="opacity-50" />
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-slate-800 ${index === 0 ? 'bg-[#f59e0b] text-slate-900' : (index === 1 ? 'bg-slate-300 text-slate-800' : 'bg-[#d97706] text-white')}`}>#{index + 1}</div>
                  </div>
                  <h3 className="font-bold text-sm m-0 leading-tight">{t.nome_operador}</h3>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs opacity-60">Média Vitalícia (0-4)</span>
                <span className={`text-xl font-black ${index === 0 ? 'text-[#f59e0b]' : 'text-white'}`}>{Number(t.matriz_talento_media).toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráficos Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Gráfico Linear Area */}
        <section className="glass-panel p-6 animate-fade-in animate-delay-3 flex flex-col" style={{ minHeight: "400px" }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 600 }}>Caudal de Passagens (Performance Mensal)</h2>
          <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
            {isLoading ? (
              <div className="w-full h-full flex justify-center items-center opacity-50"><p>Processando Matriz...</p></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graficoEvolucao} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBarcos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Area type="monotone" dataKey="barcos" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorBarcos)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Gráfico de Barras WIP Gargalos */}
        <section className="glass-panel p-6 animate-fade-in animate-delay-3 flex flex-col" style={{ minHeight: "400px" }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 600 }}>Análise de WIP e Retenção por Estação</h2>
          <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
            {isLoading ? (
              <div className="w-full h-full flex justify-center items-center opacity-50"><p>Computando Telemetria...</p></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gargalosGrafo} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={120} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="retidos" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

      </div>

      {/* Relatório Financeiro (Desvio Laboral) */}
      <section className="glass-panel p-6 animate-fade-in animate-delay-3" style={{ borderTop: '4px solid var(--secondary)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }} className="flex gap-2 items-center">
            <DollarSign size={20} className="text-[#4ade80]" />
            Relatório OEE por Embarcação (SLA vs Real)
          </h2>
        </div>

        <div className="table-container">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Ordem (OP)</th>
                <th>Modelo</th>
                <th>Status M.E.S</th>
                <th>Orçamentado (SLA)</th>
                <th>Gasto (IoT)</th>
                <th>OEE (%)</th>
                <th>Balanço H/H</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 opacity-50">A calcular rendimentos...</td></tr>
              ) : financas.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 opacity-50">Sem dados financeiros para apresentar. Nenhuma Ordem processada.</td></tr>
              ) : (
                financas.map((f) => {
                  const desvioNum = Number(f.desvio);
                  const isLucro = desvioNum >= 0;

                  return (
                    <tr key={f.op_id}>
                      <td className="font-mono text-sm">{f.numero}</td>
                      <td className="font-medium text-[var(--primary)]">{f.modelo}</td>
                      <td>{f.status}</td>
                      <td>{f.horasPlaneadas} HH</td>
                      <td>{f.horasReais} HH</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div style={{ width: '40px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                            <div style={{ width: `${Math.min(100, Number(f.oeePerc))}%`, height: '100%', background: Number(f.oeePerc) >= 100 ? 'var(--secondary)' : (Number(f.oeePerc) >= 50 ? 'var(--primary)' : 'var(--danger)'), borderRadius: '3px' }}></div>
                          </div>
                          <span className="text-xs">{f.oeePerc}%</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '99px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: isLucro ? 'var(--secondary)' : 'rgba(239, 68, 68, 0.1)',
                          color: isLucro ? '#fff' : '#fca5a5',
                          border: isLucro ? '1px solid var(--secondary)' : '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                          {isLucro ? `+${f.desvio} HH Salvas` : `${f.desvio} HH Perdidas`}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

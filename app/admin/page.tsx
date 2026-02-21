"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, AlertTriangle, Layers, TrendingUp } from 'lucide-react';

type Stats = {
  barcosEmProducao: number;
  barcosAtrasados: number;
  estacaoGargalo: string;
  totalLeiturasMes: number;
};

export default function Home() {
  const supabase = createClient();
  const [stats, setStats] = useState<Stats>({ barcosEmProducao: 0, barcosAtrasados: 0, estacaoGargalo: 'N/A', totalLeiturasMes: 0 });
  const [graficoEvolucao, setGraficoEvolucao] = useState<{ name: string, barcos: number }[]>([]);
  const [gargalosGrafo, setGargalosGrafo] = useState<{ name: string, retidos: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboards() {
      setIsLoading(true);

      try {
        // 1. Barcos Em Produção
        const { count: countEmProducao } = await supabase
          .from('ordens_producao')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Em Produção');

        // 2. Gargalos e Work-in-Progress (Leituras RFID sem saída)
        // Procuramos registos realtime onde os ESP32 leram a entrada, mas ainda não leram o check-out (timestamp_fim is null)
        const { data: wips } = await supabase
          .from('registos_rfid_realtime')
          .select('estacao_id, estacoes(nome_estacao)')
          .is('timestamp_fim', null);

        let nomeGargalo = 'N/A';
        const contadorGargalos: Record<string, number> = {};

        if (wips && wips.length > 0) {
          wips.forEach((w: unknown) => {
            const wRecord = w as Record<string, unknown>;
            const estacoes = wRecord.estacoes as Record<string, unknown> | null;
            const nomeStr = estacoes && typeof estacoes === 'object' && 'nome_estacao' in estacoes ? String(estacoes.nome_estacao) : 'Desconhecida';
            contadorGargalos[nomeStr] = (contadorGargalos[nomeStr] || 0) + 1;
          });

          const maxRetidos = Math.max(...Object.values(contadorGargalos));
          nomeGargalo = Object.keys(contadorGargalos).find(k => contadorGargalos[k] === maxRetidos) || 'N/A';

          setGargalosGrafo(Object.entries(contadorGargalos).map(([k, v]) => ({ name: k, retidos: v })));
        } else {
          setGargalosGrafo([
            { name: "Laminação", retidos: 4 },
            { name: "Corte CNC", retidos: 1 }, // Fallback preview data em caso db vazo
            { name: "Montagem Elétrica", retidos: 7 },
            { name: "Inspeção", retidos: 2 }
          ]);
        }

        // Mock Dados para Chart Histórico de Produção Mensal (Simulado, requer tracking de Concluídos vs Data)
        setGraficoEvolucao([
          { name: 'Semana 1', barcos: 4 },
          { name: 'Semana 2', barcos: 7 },
          { name: 'Semana 3', barcos: 5 },
          { name: 'Semana 4', barcos: 9 },
        ]);

        setStats({
          barcosEmProducao: countEmProducao || 12, // fallback
          barcosAtrasados: 2, // Simulado (Requer calculo na view materializada contra Date.now e tempo_ciclo_especifico)
          estacaoGargalo: nomeGargalo !== 'N/A' ? nomeGargalo : 'Montagem (Demostração)',
          totalLeiturasMes: 1420
        });

      } catch (e) {
        console.error("Erro a carregar as Dashboards:", e);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboards();
  }, [supabase]);

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
            <h3 style={{ color: "var(--primary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Leituras ESP32 / Mês</h3>
            <TrendingUp size={18} color="var(--primary)" opacity={0.5} />
          </div>
          <div className="flex items-end gap-3">
            <span style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}>{stats.totalLeiturasMes}</span>
            <span style={{ color: "var(--primary)", fontSize: "0.85rem", paddingBottom: '4px' }}>pings IoT de rastreio</span>
          </div>
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
    </>
  );
}

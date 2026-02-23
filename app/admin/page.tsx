"use client";

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, AlertTriangle, Layers, TrendingUp, DollarSign, UserCircle2, Award } from 'lucide-react';
import { fetchDashboardData } from './actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { exportToCSV } from '@/utils/csvExport';

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
    <div className="max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-900">S.C.A.D.A & Relatórios Fabris</h1>
          <p className="text-muted-foreground mt-1">Visão OEE e Controlos em Tempo Real - Módulo de Gestão Shopfloor</p>
        </div>
        <Button variant="outline" disabled={isLoading} className="rounded-full shadow-sm" onClick={() => exportToCSV(financas, 'Relatorio_Financeiro_OEE.csv')}>
          {isLoading ? 'A calcular...' : 'Exportar OEE Financeiro (CSV)'}
        </Button>
      </header>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500 shadow-sm animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-blue-600 uppercase tracking-wider">Em Produção</CardTitle>
            <Layers size={18} className="text-blue-500 opacity-70" />
          </CardHeader>
          <CardContent className="flex items-end gap-3">
            <span className="text-4xl font-extrabold text-slate-800 leading-none">{stats.barcosEmProducao}</span>
            <span className="text-sm font-medium text-slate-500 pb-1">Unidades Ativas</span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-red-600 uppercase tracking-wider">Atrasos / Quebra SLA</CardTitle>
            <AlertTriangle size={18} className="text-red-500 opacity-70" />
          </CardHeader>
          <CardContent className="flex items-end gap-3">
            <span className="text-4xl font-extrabold text-slate-800 leading-none">{stats.barcosAtrasados}</span>
            <span className="text-sm font-medium text-slate-500 pb-1">Unid. Retidas</span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-amber-600 uppercase tracking-wider">Gargalo Operacional</CardTitle>
            <Activity size={18} className="text-amber-500 opacity-70" />
          </CardHeader>
          <CardContent className="flex flex-col mt-1">
            <span className="text-lg font-bold text-slate-800 leading-tight truncate" title={stats.estacaoGargalo}>{stats.estacaoGargalo}</span>
            <span className="text-xs font-medium text-slate-500 mt-1">Estação Corrompida</span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 shadow-sm animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-indigo-600 uppercase tracking-wider">O.E.E Efetivo</CardTitle>
            <TrendingUp size={18} className="text-indigo-500 opacity-70" />
          </CardHeader>
          <CardContent className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-slate-800 leading-none">{stats.oeeGlobal}%</span>
            <span className="text-sm font-medium text-indigo-600 pb-1">Eficácia Global</span>
          </CardContent>
        </Card>
      </div>

      {/* Hero Section: Wall of Fame RH */}
      <Card className="mb-8 overflow-hidden shadow-sm border border-slate-200 bg-white animate-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Award size={24} className="text-amber-500" />
            <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wider m-0">Wall of Fame (Top Desempenhos Globais)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-3 opacity-50 text-slate-400 py-4 text-center text-sm font-medium">Apurar Matrizes de Talento...</div>
            ) : topTalentos.length === 0 ? (
              <div className="col-span-3 opacity-50 text-slate-400 py-4 text-center text-sm font-medium">Nenhum Operador Ponderado ainda.</div>
            ) : topTalentos.map((t, index) => (
              <div key={t.id} className="bg-slate-50/50 rounded-xl p-5 flex flex-col relative border border-slate-200 hover:bg-slate-100/80 hover:-translate-y-1 transition-all shadow-sm">
                {index === 0 && <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-[10px] font-extrabold py-1 px-3 rounded-bl-lg text-amber-950 uppercase shadow-sm">Supervisor Choice</div>}
                <div className="flex justify-between items-center mb-4 pt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center relative shadow-inner border border-slate-300/50">
                      <UserCircle2 size={28} className="text-slate-500" />
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm ${index === 0 ? 'bg-amber-400 text-amber-950 border-white' : (index === 1 ? 'bg-slate-300 text-slate-800 border-white' : 'bg-amber-600 text-white border-white')}`}>#{index + 1}</div>
                    </div>
                    <h3 className="font-extrabold text-base text-slate-800 m-0 leading-tight">{t.nome_operador}</h3>
                  </div>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">Média (0-4)</span>
                  <span className={`text-2xl font-black ${index === 0 ? 'text-amber-500' : 'text-slate-700'}`}>{Number(t.matriz_talento_media).toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Gráfico Linear Area */}
        <Card className="shadow-sm animate-fade-in flex flex-col min-h-[400px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-800">Caudal de Passagens (Performance Mensal)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pt-4">
            {isLoading ? (
              <div className="w-full h-full flex justify-center items-center text-slate-400 font-medium">Processando Matriz...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graficoEvolucao} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBarcos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e40af', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', fontWeight: '500', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="barcos" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBarcos)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Barras WIP Gargalos */}
        <Card className="shadow-sm animate-fade-in flex flex-col min-h-[400px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-800">Análise de WIP e Retenção por Estação</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pt-4">
            {isLoading ? (
              <div className="w-full h-full flex justify-center items-center text-slate-400 font-medium">Computando Telemetria...</div>
            ) : gargalosGrafo.length === 0 ? (
              <div className="w-full h-full flex justify-center items-center text-slate-400 text-sm">Nenhum dado de retenção/gargalo na Base de Dados.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gargalosGrafo} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="retidos" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Relatório Financeiro (Desvio Laboral) */}
      <Card className="shadow-sm animate-fade-in mb-8">
        <CardHeader className="bg-white border-b border-slate-200 flex flex-row items-center justify-between py-4 rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-slate-800 text-lg font-extrabold">
            <DollarSign size={20} className="text-emerald-500" />
            Relatório OEE por Embarcação (SLA vs Real)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-extrabold tracking-widest">
                <tr>
                  <th className="px-6 py-4 font-extrabold text-slate-800">Ordem Lab</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">M.E.S Plan.</th>
                  <th className="px-6 py-4">M.E.S Efetivo</th>
                  <th className="px-6 py-4 text-right">Desvio Produtivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">Extraindo Ledger OEE...</td></tr>
                ) : financas.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">Nenhum dado produtivo na janela de tempo.</td></tr>
                ) : financas.map((f, i) => {
                  const desvioNum = Number(f.desvio);
                  const isLucro = desvioNum >= 0;

                  return (
                    <tr key={f.op_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-800">{f.numero}</div>
                        <div className="text-xs text-slate-400 font-medium truncate max-w-[200px]" title={f.modelo}>{f.modelo}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2.5 py-1 rounded shadow-sm border border-slate-200 uppercase tracking-widest">
                          {f.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{f.horasPlaneadas} HH</td>
                      <td className="px-6 py-4 font-extrabold text-slate-800">{f.horasReais} HH</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 font-mono">
                          <span className={`px-2.5 py-1 rounded text-xs font-extrabold ${isLucro
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm'
                            : 'bg-rose-50 text-rose-600 border border-rose-200 shadow-sm'
                            }`}>
                            {isLucro ? `+${f.desvio} HH Salvo` : `${f.desvio} HH Perda`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

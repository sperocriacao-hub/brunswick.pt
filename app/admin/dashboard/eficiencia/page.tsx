"use client";

import React, { useState, useEffect } from "react";
import { fetchDropdownOptions, getEficienciaDados, FiltrosEficiencia, ResultadoEficiencia } from "./actions";
import { Activity, CalendarDays, BarChart2, Hash, Layers, Monitor, Award, RefreshCcw } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";

export default function EficienciaDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Dropdown Data
  const [areas, setAreas] = useState<{ id: string; nome_area: string }[]>([]);
  const [linhas, setLinhas] = useState<{ id: string; letra_linha: string }[]>([]);
  const [estacoes, setEstacoes] = useState<{ id: string; nome_estacao: string }[]>([]);

  // Filtros
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd'T'00:00"));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd'T'23:59"));
  const [areaId, setAreaId] = useState("");
  const [linhaId, setLinhaId] = useState("");
  const [estacaoId, setEstacaoId] = useState("");

  // Resultados
  const [resultados, setResultados] = useState<ResultadoEficiencia>({
    horas_ganhas: 0,
    horas_trabalhadas: 0,
    eficiencia_percentual: 0,
    barcos_processados: 0
  });

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const res = await fetchDropdownOptions();
      if (res.success) {
        setAreas(res.areas);
        setLinhas(res.linhas);
        setEstacoes(res.estacoes);
      }
      setIsLoading(false);
      handleSearch(); // Initial load
    }
    init();
  }, []);

  const handleSearch = async () => {
    setIsSearching(true);
    const filtros: FiltrosEficiencia = {
      dataInicio,
      dataFim,
      areaId,
      linhaId,
      estacaoId
    };

    const res = await getEficienciaDados(filtros);
    if (res.success && res.data) {
      setResultados(res.data);
    }
    setIsSearching(false);
  };

  const getEficienciaColor = (eficiencia: number) => {
    if (eficiencia >= 100) return "var(--success, #10b981)";
    if (eficiencia >= 85) return "var(--warning, #f59e0b)";
    return "var(--danger, #ef4444)";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <div className="animate-spin text-blue-500 mb-4 h-12 w-12 border-4 border-current border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mt-8 animate-fade-in dashboard-layout" style={{ display: "block" }}>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="brand-title" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Award className="text-blue-400" size={32} /> Eficiência de Produção (H/H)
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "0.25rem" }}>
            Métricas executivas de Rácio Horas Ganhas vs. Horas Efetivas.
          </p>
        </div>
      </header>

      {/* FILTROS */}
      <section className="glass-panel p-6 mb-8 animate-delay-1">
        <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--primary)" }}>Configuração de Escopo</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="form-label text-xs">Data de Início</label>
            <input type="datetime-local" className="form-control" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          </div>
          <div>
            <label className="form-label text-xs">Data Fim</label>
            <input type="datetime-local" className="form-control" value={dataFim} onChange={e => setDataFim(e.target.value)} />
          </div>
          
          <div>
            <label className="form-label text-xs">Área Fabril</label>
            <select className="form-control" value={areaId} onChange={e => { setAreaId(e.target.value); setEstacaoId(""); }}>
              <option value="">-- Toda a Fábrica --</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nome_area}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label text-xs">Linha (Opcional)</label>
            <select className="form-control" value={linhaId} onChange={e => setLinhaId(e.target.value)} disabled={!areaId}>
              <option value="">-- Todas as Linhas --</option>
              {linhas.map(l => <option key={l.id} value={l.id}>Linha {l.letra_linha}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary w-full flex justify-center items-center" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <RefreshCcw size={18} className="animate-spin mr-2" /> : <BarChart2 size={18} className="mr-2" />}
              Analisar
            </button>
          </div>
        </div>
      </section>

      {/* KPIS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* KPI EFICIENCIA */}
        <div className="glass-panel p-6 relative overflow-hidden flex flex-col justify-center items-center" style={{ borderTop: `4px solid ${getEficienciaColor(resultados.eficiencia_percentual)}`}}>
          <h3 className="text-sm uppercase tracking-widest opacity-70 mb-2 font-bold flex items-center gap-2">
            Eficiência Geral
          </h3>
          <div className="text-5xl font-extrabold flex items-baseline gap-1" style={{ color: getEficienciaColor(resultados.eficiencia_percentual) }}>
            {resultados.eficiencia_percentual.toFixed(1)} <span className="text-xl opacity-70">%</span>
          </div>
          <p className="text-xs opacity-60 mt-4 text-center">
            Target H/H Ganhas vs Trabalhadas
          </p>
        </div>

        {/* KPI HORAS GANHAS */}
        <div className="glass-panel p-6 flex flex-col justify-center items-center">
           <div className="absolute top-4 right-4 opacity-20"><Activity size={40} /></div>
           <h3 className="text-sm uppercase tracking-widest opacity-70 mb-2 font-bold">H/H Ganhas (Target)</h3>
           <div className="text-4xl font-extrabold text-blue-400">
             {resultados.horas_ganhas.toFixed(1)} h
           </div>
           <p className="text-xs opacity-60 mt-2 text-center text-blue-200">
             Horas "Pagas" pela Construção
           </p>
        </div>

        {/* KPI HORAS TRABALHADAS */}
        <div className="glass-panel p-6 flex flex-col justify-center items-center">
           <div className="absolute top-4 right-4 opacity-20"><CalendarDays size={40} /></div>
           <h3 className="text-sm uppercase tracking-widest opacity-70 mb-2 font-bold">H/H Trabalhadas</h3>
           <div className="text-4xl font-extrabold" style={{ color: 'var(--accent)' }}>
             {resultados.horas_trabalhadas.toFixed(1)} h
           </div>
           <p className="text-xs opacity-60 mt-2 text-center" style={{ color: 'var(--accent)' }}>
             Registo Efetivo (Ponto Diário)
           </p>
        </div>

        {/* KPI BARCOS CONCLUIDOS */}
        <div className="glass-panel p-6 flex flex-col justify-center items-center">
           <div className="absolute top-4 right-4 opacity-20"><Hash size={40} /></div>
           <h3 className="text-sm uppercase tracking-widest opacity-70 mb-2 font-bold">Unidades Processadas</h3>
           <div className="text-4xl font-extrabold text-emerald-400">
             {resultados.barcos_processados}
           </div>
           <p className="text-xs opacity-60 mt-2 text-center text-emerald-200">
             Barcos que avançaram no escopo
           </p>
        </div>

      </div>

      {/* COMPARAÇÃO VISUAL - BARRAS */}
      <section className="glass-panel p-6 animate-delay-2">
        <h2 style={{ fontSize: "1.1rem", marginBottom: "2rem", color: "var(--primary)" }}>Delta de Eficiência (Ganho vs Real)</h2>
        
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
           <div className="relative">
             <div className="flex justify-between text-sm mb-1 font-bold text-blue-300">
                <span>Horas Ganhas Acumuladas</span>
                <span>{resultados.horas_ganhas.toFixed(1)} h</span>
             </div>
             <div className="w-full bg-slate-800 rounded-full h-6 overflow-hidden border border-slate-700">
                <div className="bg-blue-500 h-6 rounded-full transition-all duration-1000" style={{ width: resultados.horas_trabalhadas > 0 ? `${Math.min((resultados.horas_ganhas / Math.max(resultados.horas_ganhas, resultados.horas_trabalhadas)) * 100, 100)}%` : '0%' }}></div>
             </div>
           </div>

           <div className="relative">
             <div className="flex justify-between text-sm mb-1 font-bold" style={{ color: "var(--accent)" }}>
                <span>Horas Gastas pela Equipa</span>
                <span>{resultados.horas_trabalhadas.toFixed(1)} h</span>
             </div>
             <div className="w-full bg-slate-800 rounded-full h-6 overflow-hidden border border-slate-700">
                <div className="h-6 rounded-full transition-all duration-1000" style={{ backgroundColor: "var(--accent)", width: resultados.horas_ganhas > 0 ? `${Math.min((resultados.horas_trabalhadas / Math.max(resultados.horas_ganhas, resultados.horas_trabalhadas)) * 100, 100)}%` : '0%' }}></div>
             </div>
           </div>

           {resultados.eficiencia_percentual > 100 && (
              <div className="p-4 mt-4 bg-emerald-900/30 border border-emerald-500/50 rounded-md flex items-center gap-3 text-emerald-200">
                 <Award size={24} className="text-emerald-400 shrink-0" />
                 <div>
                    <h4 className="font-bold">Performance de Elite Detetada</h4>
                    <p className="text-sm opacity-90">A equipa produziu {((resultados.horas_ganhas - resultados.horas_trabalhadas)).toFixed(1)} horas de valor a mais do que o tempo investido, resultando num superavit operacional recorde.</p>
                 </div>
              </div>
           )}

           {resultados.eficiencia_percentual > 0 && resultados.eficiencia_percentual < 85 && (
              <div className="p-4 mt-4 bg-rose-900/30 border border-rose-500/50 rounded-md flex items-center gap-3 text-rose-200">
                 <Activity size={24} className="text-rose-400 shrink-0" />
                 <div>
                    <h4 className="font-bold">Aviso de Gargalo de Produtividade</h4>
                    <p className="text-sm opacity-90">Foram necessárias mais horas trabalhadas ({((resultados.horas_trabalhadas - resultados.horas_ganhas)).toFixed(1)} h de excesso) para bater os targets dos modelos inseridos neste período.</p>
                 </div>
              </div>
           )}
        </div>
      </section>

    </div>
  );
}

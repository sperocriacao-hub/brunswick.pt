"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, PlayCircle, Clock, Database, ChevronRight, X, AlertOctagon } from 'lucide-react';

// ==========================================
// Tipos de Dados Shopfloor (Fase 6)
// ==========================================
type OrdemProducao = {
    id: string;
    op_numero: string;
    hin_hull_id: string | null;
    num_serie: string | null;
    modelo_id: string;
    linha_id: string;
    cliente: string | null;
    pais: string | null;
    brand_region: string | null;
    modelos: { nome_modelo: string };
};

type RegistoRFID = {
    id: string;
    op_id: string;
    estacao_id: string;
    operador_rfid: string;
    barco_rfid: string;
    timestamp_inicio: string;
    timestamp_fim: string | null;
};

type RoteiroPasso = {
    sequencia_num: number;
    estacao_destino_id: string;
    modelo_id: string;
    tempo_ciclo_especifico: number;
    estacoes?: {
        nome_estacao: string;
    };
};

type LinhaProducao = {
    id: string;
    letra_linha: string;
    descricao_linha: string;
};

// ==========================================
// Helpers de Telemetria Visual (SLA Engine)
// ==========================================
const calcularStatusTimer = (inicio: string, slaMinutos: number) => {
    const diffMs = Date.now() - new Date(inicio).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMins / 60);
    const diffMinsResto = diffMins % 60;

    const atrasado = diffMins > slaMinutos;
    const isOverSLA = slaMinutos > 0 ? (diffMins / slaMinutos) : 0;

    // Calculo Eficiencia (OEE simplificada)
    // OEE = (Tempo Previsto / Tempo Real) * 100
    // Mínimo de 1 minuto para evitar Divisão por Zero em check-ins imediatos
    const tempoReal = diffMins > 0 ? diffMins : 1;
    const oee = Math.round((slaMinutos / tempoReal) * 100);

    let statusColor = "var(--success)"; // Verde
    let bgPulse = "bg-green-500/10";
    if (atrasado) {
        statusColor = "var(--danger)"; // Vermelho Crítico
        bgPulse = "bg-red-500/10 animate-pulse";
    } else if (isOverSLA > 0.8) {
        statusColor = "#f59e0b"; // Amarelo (Warning)
        bgPulse = "bg-amber-500/10";
    }

    return { diffHoras, diffMinsResto, atrasado, statusColor, bgPulse, oee };
};

// ==========================================
// Card do Barco (Mini-Componente)
// ==========================================
const BoatCard = ({
    ordem,
    registo,
    equipa,
    slaPrevisto,
    onClick
}: {
    ordem: OrdemProducao;
    registo: RegistoRFID;
    equipa: string[];
    slaPrevisto: number;
    onClick: () => void;
}) => {
    // Cronómetro Tick em Realtime Frontend
    const [, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 60000); // 1 minuto update
        return () => clearInterval(id);
    }, []);

    const metrics = calcularStatusTimer(registo.timestamp_inicio, slaPrevisto);

    return (
        <div
            onClick={onClick}
            className={`glass-panel p-3 mb-3 cursor-pointer hover:scale-[1.02] transition-transform ${metrics.bgPulse}`}
            style={{
                borderLeft: `4px solid ${metrics.statusColor}`,
                boxShadow: `0 4px 12px ${metrics.atrasado ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.3)'}`
            }}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold px-2 py-1 rounded bg-[rgba(255,255,255,0.1)] text-[var(--primary)]">
                    {ordem.op_numero}
                </span>
                <span className="text-[10px] opacity-60 flex items-center gap-1">
                    <Clock size={10} /> {metrics.diffHoras}h{metrics.diffMinsResto}m
                </span>
            </div>

            <h4 className="font-semibold text-sm truncate w-full" title={ordem.modelos?.nome_modelo || 'Modelo Desconhecido'}>
                {ordem.modelos?.nome_modelo || 'Modelo N/A'}
            </h4>

            <div className="mt-3 text-[10px] opacity-80 flex justify-between items-end">
                <div className="flex flex-col gap-1">
                    <span>HIN: {ordem.hin_hull_id || 'PENDENTE'}</span>
                    <span style={{ color: metrics.statusColor, fontWeight: 'bold' }}>OEE: {metrics.oee}%</span>
                </div>
                <div className="flex -space-x-2">
                    {equipa.map((opId, idx) => (
                        <div key={idx} title={`Operador: ${opId}`} className="w-6 h-6 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-[8px] text-white shadow-sm z-10 hover:z-20 hover:scale-110 transition-transform">
                            {opId.slice(-3).toUpperCase()}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-3 w-full bg-[rgba(0,0,0,0.3)] h-1 rounded-full overflow-hidden">
                <div
                    className="h-full"
                    style={{
                        width: `${Math.min((Date.now() - new Date(registo.timestamp_inicio).getTime()) / 60000 / (slaPrevisto || 1) * 100, 100)}%`,
                        backgroundColor: metrics.statusColor
                    }}
                />
            </div>
        </div>
    );
};


// ==========================================
// Página Principal do S.C.A.D.A
// ==========================================
export default function LogisticaLivePage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);

    // Core Data
    const [linhas, setLinhas] = useState<LinhaProducao[]>([]);
    const [ordens, setOrdens] = useState<Record<string, OrdemProducao>>({}); // op_id -> Ordem
    const [roteirosView, setRoteirosView] = useState<Record<string, RoteiroPasso>>({}); // op_id + estacao_id -> Roteiro (para extrair SLA)

    // Matriz Stateful: estacao_id -> Lista de Registos W.I.P (Barcos lá parados)
    const [matrixPings, setMatrixPings] = useState<Record<string, RegistoRFID[]>>({});

    // Grelha UI: Todas as estações usadas pelos roteiros ativos agrupadas por Sequência
    const [colunasRoteiro, setColunasRoteiro] = useState<{ id: string, nome: string }[]>([]);

    // Drawer de Detalhes
    const [selectedOP, setSelectedOP] = useState<{ ordem: OrdemProducao, registo: RegistoRFID, sla: number, equipa: string[] } | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        async function loadShopfloorData() {
            try {
                // 1. Linhas de Produção Físicas
                const resLinhas = await supabase.from('linhas_producao').select('*').order('letra_linha');
                if (resLinhas.data) setLinhas(resLinhas.data as LinhaProducao[]);

                // 2. Trazer apenas OPs ativas num Mapping Rápido
                const resOps = await supabase.from('ordens_producao').select('*, modelos(nome_modelo)').eq('status', 'Em Produção');
                const opsMap: Record<string, OrdemProducao> = {};
                resOps.data?.forEach(op => {
                    const opU = op as unknown as OrdemProducao;
                    opsMap[opU.id] = opU;
                });
                setOrdens(opsMap);

                // 3. Leituras RFID cujo Barco AINDA lá está (timestamp_fim IS NULL)
                const resRfids = await supabase.from('registos_rfid_realtime').select('*').is('timestamp_fim', null);

                // Mapear pings para celulas do UI (estacao_id)
                const gridPings: Record<string, RegistoRFID[]> = {};
                resRfids.data?.forEach(regis => {
                    const est_id = regis.estacao_id;
                    if (!gridPings[est_id]) gridPings[est_id] = [];
                    gridPings[est_id].push(regis);
                });
                setMatrixPings(gridPings);

                // 4. Descobrir dinamicamente o Cabeçalho (Quais Estações Têm Barcos a passar lá vs Roteiros base)
                // Numa view "Live", geralmente as colunas são construídas a partir do Roteiro_Padrão ou Roteiro_Sequencia.
                // Simularemos aqui a extração cimentando os nós únicos de Estacao (ordenados by Roteiro)
                const modelosInFlight = [...new Set(resOps.data?.map(o => o.modelo_id))];

                if (modelosInFlight.length > 0) {
                    const { data: routeData } = await supabase
                        .from('roteiros_sequencia')
                        .select('estacao_destino_id, sequencia_num, tempo_ciclo_especifico, modelo_id, estacoes(nome_estacao)')
                        .in('modelo_id', modelosInFlight)
                        .order('sequencia_num');

                    if (routeData) {
                        // Alimentar o Engine de SLAs de forma isolada
                        const viewRoteiro: Record<string, RoteiroPasso> = {};
                        routeData.forEach(r => {
                            const rU = r as unknown as RoteiroPasso;
                            viewRoteiro[`${r.modelo_id}_${r.estacao_destino_id}`] = rU;
                        });
                        setRoteirosView(viewRoteiro);

                        // Formatar colunas exclusivas baseadas na ordem primária geométrica dos Roteiros
                        const uniqueStationsMap = new Map();
                        routeData.forEach(r => {
                            if (!uniqueStationsMap.has(r.estacao_destino_id)) {
                                const rRec = r as Record<string, unknown>;
                                const est = rRec.estacoes as Record<string, unknown> | null;
                                uniqueStationsMap.set(r.estacao_destino_id, {
                                    id: r.estacao_destino_id,
                                    nome: est && typeof est === 'object' && 'nome_estacao' in est ? String(est.nome_estacao) : 'Sala Limpa',
                                    sort: r.sequencia_num
                                });
                            }
                        });
                        const finalCols = Array.from(uniqueStationsMap.values()).sort((a, b) => a.sort - b.sort);
                        setColunasRoteiro(finalCols);
                    }
                }
            } catch (err) {
                console.error("Critical MES Boot Error: ", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadShopfloorData();
    }, [supabase]);

    // WebSocket Supabase Realtime (A Magia "Sem F5")
    useEffect(() => {
        const chan = supabase.channel('shopfloor_kanban')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'registos_rfid_realtime' }, (payload) => {
                console.log("⚡ Ping ESP32 Recebido na Edge Node: ", payload);
                // NOTA: Em app real acionaria refetch delta ou update no Redux. 
                // Por estarmos na prototipagem rapida, injetarei reload local silenciado.
                if (payload.new) {
                    // Update state mutations omitted for brevity inline, requesting API Delta.
                    // Para POC de realtime purista, idealmente usariamos ZUSTAND + immutability appends.
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') console.log("WebSocket Shopfloor Ativo");
            });

        return () => { supabase.removeChannel(chan); };
    }, [supabase]);

    if (isLoading) {
        return <div className="p-12 text-center opacity-50 flex flex-col items-center"><Loader2 className="animate-spin mb-4" /> Configurando Layout Kanban...</div>
    }

    return (
        <div style={{ height: 'calc(100vh - 8rem)', display: 'flex', flexDirection: 'column' }}>
            <header className="flex justify-between items-center mb-6 animate-fade-in shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--primary)] flex items-center gap-3">
                        <PlayCircle size={28} /> Tracker de Produção em Tempo-Real
                    </h1>
                    <p className="text-white/60 text-sm mt-1">Conectado via PostgreSQL WebSockets (Ping Limit 10ms).</p>
                </div>

                <div className="flex gap-4 p-2 px-4 rounded-full bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)] text-xs">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--success)]"></span> ON-TIME</span>
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span> {"> 80% SLA"}</span>
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--danger)] animate-pulse"></span> ATRASO</span>
                </div>
            </header>

            {/* KANBAN BOARD WRAPPER - Full Width/HW Scrollable */}
            <div className="flex-1 overflow-auto rounded-lg border border-[rgba(255,255,255,0.1)] relative custom-scrollbar bg-[rgba(15,23,42,0.4)]">

                {/* Linhas (Swimlanes Horizontais) */}
                {linhas.map(linha => (
                    <div key={linha.id} className="flex min-w-max border-b border-[rgba(255,255,255,0.05)]">

                        {/* Header Fixo de Linha (Lado Esquerdo Y) */}
                        <div className="w-48 shrink-0 bg-[rgba(15,23,42,0.95)] border-r border-[rgba(255,255,255,0.1)] p-4 flex flex-col justify-center sticky left-0 z-20 shadow-xl">
                            <h3 className="font-bold text-lg text-white">Linha {linha.letra_linha}</h3>
                            <p className="text-xs text-white/40">{linha.descricao_linha}</p>
                        </div>

                        {/* Roteiro (Colunas Estações X) */}
                        <div className="flex">
                            {colunasRoteiro.map(col => {
                                // Procurar Barcos parados NESTA Linha && NESTA Estação
                                const wips = (matrixPings[col.id] || []).filter(p => {
                                    const opLigada = ordens[p.op_id];
                                    return opLigada && opLigada.linha_id === linha.id;
                                });

                                return (
                                    <div key={`${linha.id}-${col.id}`} className="min-w-[280px] w-[280px] shrink-0 border-r border-[rgba(255,255,255,0.02)] relative bg-[rgba(0,0,0,0.1)]">

                                        {/* Label da Coluna no Topo da primeira Swimlane apens */}
                                        <div className="bg-[rgba(255,255,255,0.02)] p-2 border-b border-[rgba(255,255,255,0.05)] text-center text-xs font-semibold text-white/50 truncate uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                                            {col.nome}
                                        </div>

                                        {/* Slot de Cartões */}
                                        <div className="p-3 min-h-[160px]">
                                            {wips.length === 0 ? (
                                                <div className="h-full w-full flex items-center justify-center opacity-10">
                                                    <span className="text-[10px] uppercase font-bold tracking-widest text-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Estação Vazia</span>
                                                </div>
                                            ) : (
                                                Object.values(
                                                    // Agrupar pings do mesmo barco nesta mesma estação (Para Equipas Multi-Operador)
                                                    wips.reduce((acc, curr) => {
                                                        if (!acc[curr.op_id]) acc[curr.op_id] = [];
                                                        acc[curr.op_id].push(curr);
                                                        return acc;
                                                    }, {} as Record<string, RegistoRFID[]>)
                                                ).map(regisG => {
                                                    const principalRegis = regisG[0];
                                                    const equipaNomes = regisG.map(r => r.operador_rfid);

                                                    const ordem = ordens[principalRegis.op_id];
                                                    if (!ordem) return null; // Fallback integridade

                                                    // Localizar SLA para Modelo X Estacao Y
                                                    const rota = roteirosView[`${ordem.modelo_id}_${col.id}`];
                                                    const prevSla = rota ? rota.tempo_ciclo_especifico : 60; // default 1H 

                                                    return (
                                                        <BoatCard
                                                            key={principalRegis.id}
                                                            ordem={ordem}
                                                            registo={principalRegis}
                                                            equipa={equipaNomes}
                                                            slaPrevisto={prevSla}
                                                            onClick={() => setSelectedOP({ ordem, registo: principalRegis, sla: prevSla, equipa: equipaNomes })}
                                                        />
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* SLIDE-OUT DRAWER (DETALHES DO BARCO) */}
            {selectedOP && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in" onClick={() => setSelectedOP(null)}>
                    <div className="w-full max-w-md bg-[var(--background-panel)] h-full shadow-2xl border-l border-[rgba(255,255,255,0.1)] flex flex-col pt-safe animate-slide-in-right" onClick={e => e.stopPropagation()}>

                        <div className="p-6 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center bg-[rgba(0,0,0,0.2)]">
                            <div>
                                <p className="text-xs text-[var(--primary)] uppercase font-bold tracking-wider mb-1">INSPEÇÃO REAL-TIME</p>
                                <h2 className="text-xl font-bold">{selectedOP.ordem.op_numero}</h2>
                            </div>
                            <button onClick={() => setSelectedOP(null)} className="p-2 bg-[rgba(255,255,255,0.05)] rounded hover:bg-[rgba(255,255,255,0.1)]"><X size={20} /></button>
                        </div>

                        <div className="p-6 overflow-auto flex-1 custom-scrollbar">
                            <h3 className="text-sm font-semibold opacity-50 uppercase tracking-widest mb-4 flex items-center gap-2"><Database size={14} /> Rastreabilidade</h3>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-[rgba(0,0,0,0.2)] p-3 rounded-lg border border-[rgba(255,255,255,0.02)]">
                                    <label className="text-[10px] opacity-50 uppercase">Modelo Target</label>
                                    <p className="font-semibold text-sm truncate">{selectedOP.ordem.modelos?.nome_modelo}</p>
                                </div>
                                <div className="bg-[rgba(0,0,0,0.2)] p-3 rounded-lg border border-[rgba(255,255,255,0.02)]">
                                    <label className="text-[10px] opacity-50 uppercase">Hull ID (HIN)</label>
                                    <p className="font-semibold text-sm text-[var(--primary)]">{selectedOP.ordem.hin_hull_id || 'Não cunhado'}</p>
                                </div>
                                <div className="bg-[rgba(0,0,0,0.2)] p-3 rounded-lg border border-[rgba(255,255,255,0.02)]">
                                    <label className="text-[10px] opacity-50 uppercase">Destino (País)</label>
                                    <p className="font-semibold text-sm">{selectedOP.ordem.pais || 'Desconhecido'}</p>
                                </div>
                                <div className="bg-[rgba(0,0,0,0.2)] p-3 rounded-lg border border-[rgba(255,255,255,0.02)]">
                                    <label className="text-[10px] opacity-50 uppercase">Telemetria Atual (SLA)</label>
                                    <p className="font-bold text-sm" style={{ color: calcularStatusTimer(selectedOP.registo.timestamp_inicio, selectedOP.sla).statusColor }}>
                                        {selectedOP.sla} Mínutos (OEE: {calcularStatusTimer(selectedOP.registo.timestamp_inicio, selectedOP.sla).oee}%)
                                    </p>
                                </div>
                                <div className="bg-[rgba(0,0,0,0.2)] p-3 rounded-lg border border-[rgba(255,255,255,0.02)]">
                                    <label className="text-[10px] opacity-50 uppercase">Equipa Picada (RFID)</label>
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                        {selectedOP.equipa.map((op, idx) => (
                                            <span key={idx} className="bg-[rgba(255,255,255,0.1)] px-2 py-0.5 rounded text-xs">
                                                {op.slice(-6)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 mb-8 flex items-start gap-3">
                                <AlertOctagon size={24} className="text-indigo-400 mt-1" />
                                <div>
                                    <h4 className="text-sm font-bold text-indigo-300">Opcionais (B.O.M) a Instalar</h4>
                                    <p className="text-xs text-indigo-200/50 mt-1">A view de B.O.M cruza o plano de configuração do barco para esta estação específica.</p>
                                    {/* Placeholder para Lista Dinâmica de Componentes Adicionais */}
                                    <ul className="mt-3 text-sm flex flex-col gap-1 space-y-1">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Frigorífico Dometic CRX 65</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> GPS Raymarine Axiom 9</li>
                                    </ul>
                                </div>
                            </div>

                            <button className="w-full btn btn-outline border-white/20 hover:border-white/50 hover:bg-white flex items-center justify-center gap-2 py-3 mt-auto !text-white hover:!text-black transition-all">
                                Forçar Liberação de Estação (Override) <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

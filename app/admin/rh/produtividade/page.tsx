import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Clock, Coffee, AlertCircle, MapPin, Users, Filter, CalendarDays } from 'lucide-react';

import { cookies } from 'next/headers';
import { FactoryHeatmap, DB_AvaliacaoDiaria, DB_OperadorArea } from '@/components/rh/FactoryHeatmap';
import { TopPerformersMural } from '@/components/rh/TopPerformersMural';
import { ColaboradorRaioXModal } from '@/components/rh/ColaboradorRaioXModal';

export const dynamic = 'force-dynamic';

export default async function ProdutividadeRH({ searchParams }: { searchParams: Promise<{ mes?: string, area?: string }> }) {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const SP = await searchParams;
    const currentMonthStr = SP.mes || new Date().toISOString().substring(0, 7); // yyyy-MM
    const selectedArea = SP.area || 'Todas';

    // 1. Fetch Todas as Áreas (Para a ComboBox)
    const { data: areasCatalog } = await supabase.from('areas_fabrica').select('id, nome_area').order('ordenacao');

    // 2. Fetch Operadores (Agora com filtro de área contextual)
    let queryOps = supabase
        .from('operadores')
        .select(`
            id, tag_rfid_operador, nome_operador, status, area_base_id,
            areas_fabrica(id, nome_area)
        `)
        .eq('status', 'Ativo');

    if (selectedArea !== 'Todas') {
        queryOps = queryOps.eq('area_base_id', selectedArea);
    }

    const { data: rawOperadores } = await queryOps;

    const operadores = rawOperadores?.map(op => ({
        ...op,
        area_nome: (op.areas_fabrica as any)?.nome_area || 'Geral'
    })) || [];

    // 3. Fetch Avaliações Diárias do Mês Corrente (Para Heatmap e Top 3)
    const firstDayStr = `${currentMonthStr}-01`;
    // Add 1 to month, handle year rollover, subtract 1 ms to get last day of current month
    const currentDate = new Date(`${currentMonthStr}-01T00:00:00Z`);
    const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const lastDayStr = new Date(nextMonthDate.getTime() - 1).toISOString().split('T')[0];

    const { data: avaliacoesMes } = await supabase
        .from('avaliacoes_diarias')
        .select('*')
        .gte('data_avaliacao', firstDayStr)
        .lte('data_avaliacao', lastDayStr);

    // 4. Fetch Tarefas (Value Added Time) de hoje
    const hojeIso = new Date().toISOString().split('T')[0];
    const { data: rawTarefas } = await supabase
        .from('registos_rfid_realtime')
        .select(`
            id, operador_rfid, timestamp_inicio, timestamp_fim, estacoes(nome_estacao)
        `)
        .gte('timestamp_inicio', `${hojeIso}T00:00:00Z`);

    // 5. Fetch Pausas (Non-Value Added Time) de hoje
    const { data: rawPausas } = await supabase
        .from('log_pausas_operador')
        .select(`
            id, operador_rfid, motivo, timestamp_inicio, timestamp_fim
        `)
        .gte('timestamp_inicio', `${hojeIso}T00:00:00Z`);

    // 6. Fetch Pontos (Assiduidade Bruta)
    const { data: rawPontos } = await supabase
        .from('log_ponto_diario')
        .select('*')
        .gte('timestamp', `${hojeIso}T00:00:00Z`);

    // Helper: Calc Minutes
    const diffMinutes = (inicio: string, fim: string | null) => {
        if (!inicio) return 0;
        const start = new Date(inicio).getTime();
        const end = fim ? new Date(fim).getTime() : new Date().getTime(); // Se não fechou, usa o Agora
        return Math.max(0, Math.floor((end - start) / 60000));
    };

    // Agregar Dados por Operador
    const statsOperador = operadores?.map(op => {
        const suasTarefas = rawTarefas?.filter(t => t.operador_rfid === op.tag_rfid_operador) || [];
        const suasPausas = rawPausas?.filter(p => p.operador_rfid === op.tag_rfid_operador) || [];

        const myStarts = rawPontos?.filter(p => p.operador_rfid === op.tag_rfid_operador && p.tipo_registo === 'ENTRADA') || [];
        const picouHoje = myStarts.length > 0;

        let totalTrabalhoEfetivo = 0; // OEE Value Added (Minutos Tarefas)
        suasTarefas.forEach(t => {
            totalTrabalhoEfetivo += diffMinutes(t.timestamp_inicio, t.timestamp_fim);
        });

        let totalPausas = 0; // OEE NVA (Minutos em WC, Medico, etc)
        suasPausas.forEach(p => {
            totalPausas += diffMinutes(p.timestamp_inicio, p.timestamp_fim);
        });

        // Contagem de Movimentos Geográficos (Quantas Estações diferentes ele visitou para trabalhar?)
        const estacoesVistas = new Set(suasTarefas.map(t => (t.estacoes as any)?.nome_estacao));
        const numEstacoesDiferentes = estacoesVistas.size;

        const totalTrackedTime = totalTrabalhoEfetivo + totalPausas;
        const valueRation = totalTrackedTime > 0 ? (totalTrabalhoEfetivo / totalTrackedTime) * 100 : 0;

        return {
            ...op,
            picouHoje,
            totalTrabalhoEfetivo,
            totalPausas,
            numEstacoesDiferentes,
            valueRation
        };
    }).sort((a, b) => b.totalTrabalhoEfetivo - a.totalTrabalhoEfetivo) || [];

    // Totais Globais OEE
    const kpiVABruto = statsOperador.reduce((acc, curr) => acc + curr.totalTrabalhoEfetivo, 0);
    const kpiNVABruto = statsOperador.reduce((acc, curr) => acc + curr.totalPausas, 0);
    const taxaProdutividade = kpiVABruto + kpiNVABruto > 0 ? (kpiVABruto / (kpiVABruto + kpiNVABruto)) * 100 : 0;

    // Totais Globais Assiduidade (Contados sob os trabalhadores do Scope "selectedArea" (se filtrado))
    const expectedWorkers = statsOperador.length;
    const presentWorkers = statsOperador.filter(w => w.picouHoje).length;
    // Heurística de Falso-Positivo (Fase 24): Se os Operadores Cadastrados > 0 mas o PresentWorkers = 0 E NINGUÉM FEZ NVA/VA na FABRICA... turno não arrancou!
    const turnoverFabricaHoje = kpiVABruto + kpiNVABruto;
    const absenteismRate = (expectedWorkers > 0 && (presentWorkers > 0 || turnoverFabricaHoje > 0))
        ? ((expectedWorkers - presentWorkers) / expectedWorkers) * 100
        : 0;

    // Gerador Array Meses Formulario (Ultimos 6 Meses)
    const ultimosMeses = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        ultimosMeses.push({
            value: d.toISOString().substring(0, 7),
            label: d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }).toUpperCase()
        });
    }

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in zoom-in duration-500 max-w-[1600px] mx-auto">
            {/* Cabeçalho Responsivo M.E.S */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2 flex items-center gap-3">
                        <Activity className="text-blue-600" size={32} />
                        Produtividade e Lean M.E.S.
                    </h1>
                    <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                        <Clock size={16} /> Raio-X Diário Focado ao Minuto (OEE Value Added, Absenteísmo e Heatmaps)
                    </p>
                </div>

                <form className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200 shadow-sm" method="GET">
                    <div className="flex items-center gap-2 px-2 border-r border-slate-200">
                        <Filter size={16} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest hidden md:inline">Filtros Globais</span>
                    </div>

                    <div className="relative">
                        <select name="mes" defaultValue={currentMonthStr} className="pl-9 pr-8 py-2 w-[180px] bg-white border border-slate-200 rounded-md text-sm font-semibold text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none">
                            {ultimosMeses.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="relative">
                        <select name="area" defaultValue={selectedArea} className="pl-9 pr-6 py-2 w-[160px] bg-white border border-slate-200 rounded-md text-sm font-semibold text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none">
                            <option value="Todas">Todas as Áreas</option>
                            {areasCatalog?.map(a => (
                                <option key={a.id} value={a.id}>{a.nome_area}</option>
                            ))}
                        </select>
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">
                        Aplicar
                    </button>
                </form>
            </div>

            {/* Macro KPIs - Expandida 4 Columns c/ Absentismo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border hover:border-blue-200 transition-colors shadow-sm">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-slate-500 text-[10px] font-bold tracking-widest uppercase flex items-center justify-between">
                            <span>Taxa de Absenteísmo</span>
                            <Users size={14} className="text-red-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-800">{absenteismRate.toFixed(1)}%</span>
                        </div>
                        <p className="text-slate-500 font-medium text-xs mt-1 border-t border-slate-100 pt-2">
                            Faltoso(s) Hoje: <strong className="text-red-500">{expectedWorkers - presentWorkers}</strong> de {expectedWorkers}.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border hover:border-blue-200 transition-colors shadow-sm">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-slate-500 text-[10px] font-bold tracking-widest uppercase flex items-center justify-between">
                            <span>OEE (Value-Added)</span>
                            <Activity size={14} className="text-indigo-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-extrabold text-indigo-600">{taxaProdutividade.toFixed(1)}%</div>
                        <p className="text-slate-500 font-medium text-xs mt-1 border-t border-slate-100 pt-2">
                            {kpiVABruto} Minutos Líquidos Efetivos na BD.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border hover:border-blue-200 transition-colors shadow-sm">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-slate-500 text-[10px] font-bold tracking-widest uppercase flex items-center justify-between">
                            <span>Tempo NVA (Desperdício)</span>
                            <Coffee size={14} className="text-rose-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-extrabold text-rose-600">{kpiNVABruto} <span className="text-lg text-rose-400">min</span></div>
                        <p className="text-slate-500 font-medium text-xs mt-1 border-t border-slate-100 pt-2">
                            Acumulado em Pausas Sistémicas Táticas.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border hover:border-blue-200 transition-colors shadow-sm">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-slate-500 text-[10px] font-bold tracking-widest uppercase flex items-center justify-between">
                            <span>Saltos Nomadas P. Operário</span>
                            <MapPin size={14} className="text-emerald-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-extrabold text-emerald-600">
                            {expectedWorkers > 0 ? (statsOperador.reduce((sum, curr) => sum + curr.numEstacoesDiferentes, 0) / expectedWorkers).toFixed(1) : 0}
                        </div>
                        <p className="text-slate-500 font-medium text-xs mt-1 border-t border-slate-100 pt-2">
                            Média de estações visitadas / Operador.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top 3 Performers do Mês */}
            <TopPerformersMural
                operadores={(operadores as unknown as DB_OperadorArea[])}
                avaliacoes={(avaliacoesMes as unknown as DB_AvaliacaoDiaria[]) || []}
            />

            {/* Mapa Longitudinal de Calor (Factory Heatmap) */}
            <div className="mt-8 mb-8">
                <FactoryHeatmap
                    avaliacoes={(avaliacoesMes as unknown as DB_AvaliacaoDiaria[]) || []}
                    operadores={(operadores as unknown as DB_OperadorArea[])}
                />
            </div>

            {/* Painel Central das Tabelas OEE RH */}
            <Card className="border-none shadow-xl bg-white overflow-hidden rounded-2xl ring-1 ring-slate-100">
                <CardHeader className="bg-slate-50 border-b border-slate-100 py-5">
                    <CardTitle className="text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Activity size={20} className="text-blue-600" /> Rendimento Humano Diário ({hojeIso})
                        </span>
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Equipa / Operador</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center items-center justify-center gap-1 group">
                                    Valor Produzido <span className="text-[10px] lowercase font-normal opacity-70">(minutos)</span>
                                </th>
                                <th className="px-6 py-4 text-center">
                                    Desperdício <span className="text-[10px] lowercase font-normal opacity-70">(NVA)</span>
                                </th>
                                <th className="px-6 py-4 text-center text-blue-800">Taxa Value %</th>
                                <th className="px-6 py-4 text-center">Zonas de Trânsito</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {statsOperador.map((worker) => (
                                <ColaboradorRaioXModal
                                    key={worker.id}
                                    operadorId={worker.id}
                                    operadorRfid={worker.tag_rfid_operador}
                                    nomeOperador={worker.nome_operador}
                                    funcaoArea={worker.area_nome}
                                >
                                    <tr className="hover:bg-blue-50/50 transition-colors w-full flex-table-row items-center border-b border-slate-100">
                                        <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm">
                                                {worker.nome_operador.substring(0, 2).toUpperCase()}
                                            </div>
                                            {worker.nome_operador}
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            {worker.picouHoje ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-widest shadow-sm">
                                                    In-Loco
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-widest shadow-sm">
                                                    Ausente
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <div className="font-bold text-slate-800 flex items-center justify-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (worker.totalTrabalhoEfetivo / 480) * 100)}%` }}></div>
                                                </div>
                                                {worker.totalTrabalhoEfetivo}m
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            {worker.totalPausas > 0 ? (
                                                <div className="font-bold text-rose-600 flex items-center justify-center gap-1">
                                                    <AlertCircle size={14} className="opacity-70" /> {worker.totalPausas}m
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 font-medium hidden sm:inline">--</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-center text-blue-900 font-extrabold text-lg">
                                            {worker.valueRation.toFixed(0)}%
                                        </td>

                                        <td className="px-6 py-4 text-center font-mono opacity-80 text-xs text-slate-700">
                                            {worker.numEstacoesDiferentes} <span className="hidden sm:inline">Stations</span>
                                        </td>
                                    </tr>
                                </ColaboradorRaioXModal>
                            ))}
                            {statsOperador.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">
                                        Nenhum Operador Ativo encontrado nestes Filtros M.E.S.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

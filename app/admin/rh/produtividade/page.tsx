import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Clock, Coffee, AlertCircle, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProdutividadeRH() {
    const supabase = await createClient();

    // 1. Fetch Operadores
    const { data: operadores } = await supabase.from('operadores').select('*').eq('status', 'Ativo');

    // 2. Fetch Tarefas (Value Added Time) de hoje
    const hojeIso = new Date().toISOString().split('T')[0];
    const { data: rawTarefas } = await supabase
        .from('registos_rfid_realtime')
        .select(`
            id, operador_rfid, timestamp_inicio, timestamp_fim, estacoes(nome_estacao)
        `)
        .gte('timestamp_inicio', `${hojeIso}T00:00:00Z`);

    // 3. Fetch Pausas (Non-Value Added Time) de hoje
    const { data: rawPausas } = await supabase
        .from('log_pausas_operador')
        .select(`
            id, operador_rfid, motivo, timestamp_inicio, timestamp_fim
        `)
        .gte('timestamp_inicio', `${hojeIso}T00:00:00Z`);

    // 4. Fetch Pontos (Assiduidade Bruta)
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

    // Totais Globais
    const kpiVABruto = statsOperador.reduce((acc, curr) => acc + curr.totalTrabalhoEfetivo, 0);
    const kpiNVABruto = statsOperador.reduce((acc, curr) => acc + curr.totalPausas, 0);
    const taxaProdutividade = kpiVABruto + kpiNVABruto > 0 ? (kpiVABruto / (kpiVABruto + kpiNVABruto)) * 100 : 0;

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-3xl font-extrabold text-blue-900 drop-shadow-sm mb-2 flex items-center gap-3">
                    <Activity className="text-blue-600" size={32} />
                    Produtividade e Lean M.E.S.
                </h1>
                <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                    <Clock size={16} /> Raio-X Diário Focado ao Minuto (Balanço de OEE Value Added vs Desperdícios M.E.S)
                </p>
            </div>

            {/* Macro KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-50 to-white border-none shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-indigo-900 text-sm font-bold tracking-widest uppercase flex items-center gap-2">
                            OEE Fábrica (Value-Added)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-indigo-700">{taxaProdutividade.toFixed(1)}%</div>
                        <p className="text-indigo-900/60 font-medium text-xs mt-1">
                            {kpiVABruto} Minutos Líquidos Trabalhados nos Barcos.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-50 to-white border-none shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-rose-900 text-sm font-bold tracking-widest uppercase flex items-center gap-2">
                            <Coffee size={18} /> Tempo NVA (Desperdício)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-rose-700">{kpiNVABruto} m</div>
                        <p className="text-rose-900/60 font-medium text-xs mt-1">
                            Minutos totais em justificação tática (WC, Médico).
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-white border-none shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-emerald-900 text-sm font-bold tracking-widest uppercase flex items-center gap-2">
                            <MapPin size={18} /> Saltos Nomadas Globais
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-emerald-700">
                            {statsOperador.reduce((sum, curr) => sum + curr.numEstacoesDiferentes, 0)}
                        </div>
                        <p className="text-emerald-900/60 font-medium text-xs mt-1">
                            Dedução do custo de trânsito pedonal no estaleiro.
                        </p>
                    </CardContent>
                </Card>
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
                                <tr key={worker.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm">
                                            {worker.nome_operador.substring(0,2).toUpperCase()}
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
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                 <div className="h-full bg-emerald-500" style={{ width: \`\${Math.min(100, (worker.totalTrabalhoEfetivo / 480)*100)}%\` }}></div>
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
                                            <span className="text-slate-400 font-medium">--</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-center text-blue-900 font-extrabold text-lg">
                                        {worker.valueRation.toFixed(0)}%
                                    </td>

                                    <td className="px-6 py-4 text-center font-mono opacity-80 text-xs text-slate-700">
                                        {worker.numEstacoesDiferentes} Stations
                                    </td>
                                </tr>
                            ))}
                        {statsOperador.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">
                                    Nenhum Operador Ativo encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
        </div>
            </Card >
        </div >
    );
}

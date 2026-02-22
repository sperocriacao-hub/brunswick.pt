import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, AlertTriangle, ShieldCheck, UserX, Activity, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AssiduidadeDashboard() {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const hojeStr = new Date().toISOString().split('T')[0];

    // 1. Fetch Operadores (Apenas Ativos) e a sua Área/Estação Mãe
    const { data: operadoresRaw } = await supabase.from('operadores')
        .select(`
            id, tag_rfid, nome, funcao_titulo, status,
            area_base_id,
            areas_fabrica ( nome ),
            estacao_base_id,
            estacoes ( nome )
        `)
        .eq('status', 'ATIVO');

    // 2. Fetch Quem Picou Hoje (Distinct RFID) - Considera NVA e VA
    const { data: presencasRaw } = await supabase.rpc('get_picagens_unicas_hoje_v2', { target_date: hojeStr });

    // Lista Plana de RFIDs detetados na fábrica hoje
    const rfidsPresentes = (presencasRaw || []).map((p: any) => p.rfid_operador);

    // 3. Processamento Nuclear Nível 1: Macro Fábrica
    const totalCadastrados = operadoresRaw?.length || 0;
    const totalPresentes = rfidsPresentes.length; // Quantos RFIDs unicos o Supabase leu hoje
    const totalAusentes = Math.max(0, totalCadastrados - totalPresentes);

    // Heurística Anti-Falso-Alarme:
    const turnoverIniciado = totalPresentes > 0;
    const taxaAbsentismo = (totalCadastrados > 0 && turnoverIniciado)
        ? ((totalAusentes) / totalCadastrados) * 100
        : 0;

    // 4. Processamento Nível 2: Agragação Por Área Fabril
    const areasStats: Record<string, { cadastrados: number, presentes: number, faltosos: any[] }> = {};

    operadoresRaw?.forEach(op => {
        const ar = op.areas_fabrica as any;
        const areaName = ar?.nome || 'Área Indefinida';
        if (!areasStats[areaName]) {
            areasStats[areaName] = { cadastrados: 0, presentes: 0, faltosos: [] };
        }

        areasStats[areaName].cadastrados += 1;
        const picou = rfidsPresentes.includes(op.tag_rfid);

        if (picou) {
            areasStats[areaName].presentes += 1;
        } else {
            areasStats[areaName].faltosos.push(op);
        }
    });

    // 5. Processamento Nível 3: O Gargalo da Estação (Workstations)
    const estacaoStats: Record<string, { nomeArea: string, cadastrados: number, presentes: number }> = {};

    operadoresRaw?.forEach(op => {
        const est = op.estacoes as any;
        const ar = op.areas_fabrica as any;
        const estacaoName = est?.nome || 'Estação Móvel/Geral';
        const areaName = ar?.nome || 'Indefinida';

        const chaveMix = `${areaName}::${estacaoName}`;

        if (!estacaoStats[chaveMix]) {
            estacaoStats[chaveMix] = { nomeArea: areaName, cadastrados: 0, presentes: 0 };
        }

        estacaoStats[chaveMix].cadastrados += 1;
        if (rfidsPresentes.includes(op.tag_rfid)) {
            estacaoStats[chaveMix].presentes += 1;
        }
    });

    // Flattening Station Arrays for UI
    const stationsArray = Object.keys(estacaoStats).map(key => {
        const [area, est] = key.split('::');
        const st = estacaoStats[key];
        return {
            area, estacao: est,
            cadastrados: st.cadastrados,
            presentes: st.presentes,
            defice: st.cadastrados - st.presentes
        };
    }).sort((a, b) => b.defice - a.defice); // Foco no Defice maior 1º


    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in zoom-in duration-500 max-w-7xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <Users className="text-blue-600" size={32} /> Central de Floor Balancing
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Gestão de Cobertura Laboral em Tempo-Real (Assiduidade Global vs Estação base)
                    </p>
                </div>
                {/* Ações Rápidas */}
                <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <Link href="/admin/rh/produtividade" className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-md transition-colors flex items-center gap-2">
                        <Activity size={16} /> OEE Global
                    </Link>
                    <div className="px-4 py-2 text-sm font-bold text-slate-900 bg-white shadow-sm rounded-md border border-slate-200 flex items-center gap-2">
                        <Users size={16} className="text-blue-500" /> Assiduidade
                    </div>
                </div>
            </header>

            {/* NÍVEL 1: HEADCOUNT GIGANTE */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase tracking-widest font-extrabold text-slate-400">Headcount Ativo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-slate-800">{totalCadastrados}</div>
                        <p className="text-xs text-slate-500 font-medium mt-1">Colaboradores Contratados</p>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase tracking-widest font-extrabold text-emerald-600 flex justify-between">
                            Em Pavilhão <ShieldCheck size={16} />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-emerald-700">{totalPresentes}</div>
                        <p className="text-xs text-emerald-600 font-medium mt-1 border-t border-emerald-200 pt-2 mt-2">Corpos M.E.S validados hoje</p>
                    </CardContent>
                </Card>

                <Card className="bg-rose-50 border-rose-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase tracking-widest font-extrabold text-rose-600 flex justify-between">
                            Faltas <UserX size={16} />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-rose-700">{turnoverIniciado ? totalAusentes : '--'}</div>
                        <p className="text-xs text-rose-600 font-medium mt-1 border-t border-rose-200 pt-2 mt-2">Recursos Humanos não-detetados</p>
                    </CardContent>
                </Card>

                <Card className={`border shadow-sm ${taxaAbsentismo > 10 ? 'bg-orange-50 border-orange-200' : 'bg-slate-800 border-slate-900'}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-xs uppercase tracking-widest font-extrabold flex justify-between ${taxaAbsentismo > 10 ? 'text-orange-600' : 'text-slate-300'}`}>
                            Tx. Absentismo <AlertTriangle size={16} />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!turnoverIniciado ? (
                            <div className="text-sm font-bold text-slate-400 mt-2">Dormência. Turno não iniciado.</div>
                        ) : (
                            <>
                                <div className={`text-4xl font-extrabold ${taxaAbsentismo > 10 ? 'text-orange-800' : 'text-white'}`}>
                                    {taxaAbsentismo.toFixed(1)}%
                                </div>
                                <p className={`text-xs font-medium mt-1 border-t pt-2 mt-2 ${taxaAbsentismo > 10 ? 'text-orange-700 border-orange-200' : 'text-slate-400 border-slate-700'}`}>
                                    {taxaAbsentismo > 10 ? 'ALERTA: Escassez Crítica!' : 'Padrão Saudável de RH.'}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* NÍVEL 2: AGREGADO POR ÁREA FABRIL */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-2">Impacto por Área M.E.S.</h3>

                    {Object.keys(areasStats).length === 0 && (
                        <p className="text-slate-500 text-sm italic">Nenhum dado estrutural.</p>
                    )}

                    {Object.keys(areasStats).map(areaKey => {
                        const area = areasStats[areaKey];
                        const capPercent = area.cadastrados > 0 ? (area.presentes / area.cadastrados) * 100 : 0;
                        const isKilled = capPercent < 75;

                        return (
                            <div key={areaKey} className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-slate-700">{areaKey}</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-100 ${isKilled ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {area.presentes} / {area.cadastrados} Pessoal
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
                                    <div
                                        className={`h-full ${isKilled ? 'bg-orange-400' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(100, capPercent)}%` }}
                                    ></div>
                                </div>

                                {area.faltosos.length > 0 && turnoverIniciado && (
                                    <div className="mt-4 pt-3 border-t border-slate-100">
                                        <div className="text-[10px] font-extrabold uppercase text-slate-400 mb-2">Ausentes Hoje:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {area.faltosos.map(f => (
                                                <span key={f.id} className="text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded cursor-help" title={`RFID: ${f.tag_rfid}`}>
                                                    {f.nome.split(' ')[0]} {f.nome.split(' ').length > 1 ? f.nome.split(' ')[f.nome.split(' ').length - 1] : ''}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* NÍVEL 3: ALOCAÇÃO DE ESTAÇÕES (FLOOR BALANCING TABLE) */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-2 flex justify-between items-center">
                        <span>Gargalos por Estação (Workstations)</span>
                        {turnoverIniciado && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">Ação Requerida</span>}
                    </h3>

                    <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-extrabold tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Linha / Estação</th>
                                        <th className="px-6 py-4 text-center">Previstos (SLA)</th>
                                        <th className="px-6 py-4 text-center">In Loco (IoT)</th>
                                        <th className="px-6 py-4 text-right">Défice / Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {stationsArray.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">Nenhuma Matriz de Alocação definida nos RH.</td>
                                        </tr>
                                    )}
                                    {stationsArray.map((st, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{st.estacao}</div>
                                                <div className="text-[10px] font-extrabold uppercase text-slate-400 mt-0.5">{st.area}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-slate-600">{st.cadastrados}</td>
                                            <td className="px-6 py-4 text-center font-mono font-extrabold text-slate-800">{st.presentes}</td>
                                            <td className="px-6 py-4 text-right">
                                                {st.defice > 0 && turnoverIniciado ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shadow-sm">
                                                        <ArrowRightLeft size={12} /> Alocar {st.defice} op.
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                        Equilibrado
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, AlertTriangle, ShieldCheck, UserX, Activity, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

import AssiduidadeLogViewer from './AssiduidadeLogViewer';
import { SupervisorAttendanceModal } from '@/components/rh/SupervisorAttendanceModal';
export const dynamic = 'force-dynamic';

export default async function AssiduidadeDashboard() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const hojeStr = new Date().toISOString().split('T')[0];

    // 1. Fetch Operadores (Apenas Ativos) e a sua Área/Estação Mãe
    const { data: operadoresRaw } = await supabase.from('operadores')
        .select(`
            id, tag_rfid_operador, nome_operador, funcao, status,
            area_base_id,
            areas_fabrica!area_base_id ( nome_area ),
            posto_base_id,
            estacoes!posto_base_id ( nome_estacao )
        `)
        .eq('status', 'Ativo');

    // 2. Fetch Quem Picou Hoje (Distinct RFID) - Considera NVA e VA
    const { data: presencasRaw } = await supabase.from('log_ponto_diario')
        .select('operador_rfid')
        .gte('timestamp', `${hojeStr}T00:00:00Z`)
        .lte('timestamp', `${hojeStr}T23:59:59Z`);

    // Lista Plana de RFIDs detetados na fábrica hoje
    const rfidsPresentes = Array.from(new Set((presencasRaw || []).map((p: any) => p.operador_rfid)));

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
        const areaName = ar?.nome_area || 'Área Indefinida';
        if (!areasStats[areaName]) {
            areasStats[areaName] = { cadastrados: 0, presentes: 0, faltosos: [] };
        }

        areasStats[areaName].cadastrados += 1;
        const picou = rfidsPresentes.includes(op.tag_rfid_operador);

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
        const estacaoName = est?.nome_estacao || 'Estação Móvel/Geral';
        const areaName = ar?.nome_area || 'Indefinida';

        const chaveMix = `${areaName}::${estacaoName}`;

        if (!estacaoStats[chaveMix]) {
            estacaoStats[chaveMix] = { nomeArea: areaName, cadastrados: 0, presentes: 0 };
        }

        estacaoStats[chaveMix].cadastrados += 1;
        if (rfidsPresentes.includes(op.tag_rfid_operador)) {
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
                
                <div className="mt-4 md:mt-0">
                    <SupervisorAttendanceModal />
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

            </div>

            {/* LISTA COMPLETA DE REGISTOS E EDIÇÃO */}
            <AssiduidadeLogViewer />
        </div>
    );
}

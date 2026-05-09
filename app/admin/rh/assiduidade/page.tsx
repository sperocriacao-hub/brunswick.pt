import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, AlertTriangle, ShieldCheck, UserX, Activity, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

import AssiduidadeLogViewer from './AssiduidadeLogViewer';
import { SupervisorAttendanceModal } from '@/components/rh/SupervisorAttendanceModal';
import AssiduidadeFilters from '@/components/rh/AssiduidadeFilters';

export const dynamic = 'force-dynamic';

export default async function AssiduidadeDashboard({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
    const sp = await searchParams;
    const filterArea = sp.area || '';
    const filterLinha = sp.linha || '';
    const filterEstacao = sp.estacao || '';

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
            estacoes!posto_base_id ( nome_estacao, linha_id )
        `)
        .eq('status', 'Ativo');

    // 2. Fetch Quem Picou Hoje (Distinct RFID) - Considera NVA e VA
    const { data: presencasRaw } = await supabase.from('log_ponto_diario')
        .select('operador_rfid')
        .gte('timestamp', `${hojeStr}T00:00:00Z`)
        .lte('timestamp', `${hojeStr}T23:59:59Z`);

    // Fetch Listas para Filtros
    const [{ data: areas }, { data: linhas }, { data: estacoes }] = await Promise.all([
        supabase.from('areas_fabrica').select('id, nome_area').order('nome_area'),
        supabase.from('linhas_producao').select('id, letra_linha').order('letra_linha'),
        supabase.from('estacoes').select('id, nome_estacao').order('nome_estacao')
    ]);

    const areasList = (areas || []).map(a => ({ id: a.id, nome: a.nome_area }));
    const linhasList = (linhas || []).map(l => ({ id: l.id, nome: `Linha ${l.letra_linha}` }));
    const estacoesList = (estacoes || []).map(e => ({ id: e.id, nome: e.nome_estacao }));

    // Filtrar Operadores com base nos filtros da UI
    const operadoresFiltrados = (operadoresRaw || []).filter(op => {
        let keep = true;
        if (filterArea && op.area_base_id !== filterArea) keep = false;
        
        const est = op.estacoes as any;
        if (filterLinha && est?.linha_id !== filterLinha) keep = false;
        if (filterEstacao && op.posto_base_id !== filterEstacao) keep = false;
        return keep;
    });

    // Lista Plana de RFIDs detetados na fábrica hoje
    const allRfidsPresentes = Array.from(new Set((presencasRaw || []).map((p: any) => p.operador_rfid)));
    
    // Intercetar apenas com os operadores filtrados
    const validRfids = new Set(operadoresFiltrados.map(o => o.tag_rfid_operador));
    const rfidsPresentes = allRfidsPresentes.filter(rfid => validRfids.has(rfid as string));

    // 3. Processamento Nuclear Nível 1: Macro Fábrica
    const totalCadastrados = operadoresFiltrados.length;
    const totalPresentes = rfidsPresentes.length; // Quantos RFIDs unicos o Supabase leu hoje
    const totalAusentes = Math.max(0, totalCadastrados - totalPresentes);

    // Heurística Anti-Falso-Alarme:
    const turnoverIniciado = totalPresentes > 0 || allRfidsPresentes.length > 0;
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

    const top3Gargalos = stationsArray.filter(s => s.defice > 0).slice(0, 3);

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

            <AssiduidadeFilters 
                areas={areasList} 
                linhas={linhasList} 
                estacoes={estacoesList} 
            />

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

            {/* TOP 3 GARGALOS (MINI-CARDS) */}
            {top3Gargalos.length > 0 && turnoverIniciado && (
                <div className="mb-8">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 mb-3 flex items-center gap-2">
                        <ArrowRightLeft className="text-rose-500" size={16} /> Gargalos Críticos Atuais
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {top3Gargalos.map((st, i) => (
                            <div key={i} className="bg-rose-50 border border-rose-100 rounded-lg p-3 shadow-sm flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                                <div>
                                    <div className="text-xs font-extrabold text-slate-500 uppercase">{st.area}</div>
                                    <div className="font-bold text-slate-800 text-sm">{st.estacao}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-rose-700">-{st.defice}</div>
                                    <div className="text-[10px] font-bold uppercase text-rose-600 bg-rose-200/50 px-1.5 rounded">Operadores</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* LISTA COMPLETA DE REGISTOS E EDIÇÃO */}
            <AssiduidadeLogViewer filterArea={filterArea} filterLinha={filterLinha} filterEstacao={filterEstacao} />
        </div>
    );
}

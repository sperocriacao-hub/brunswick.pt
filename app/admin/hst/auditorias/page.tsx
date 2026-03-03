"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuditoriaTopicos, addAuditoriaTopico, toggleTopicoStatus, getAuditorias, getShiftSafetyKPIs } from "./actions";
import { ShieldCheck, Calendar, Loader2, Plus, Target, Search, ArrowRight, LayoutDashboard, Settings2, BarChart3, AlertTriangle, FileText, History, UserCheck, HardHat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Topico {
    id: string;
    topico: string;
    categoria: string;
    ativo: boolean;
}

interface Auditoria {
    id: string;
    data_auditoria: string;
    score_percentual: number;
    observacoes_gerais: string;
    areas_fabrica?: { nome_area: string };
    operadores?: { nome_operador: string };
}

export default function AuditoriasDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"dashboard" | "configuracao">("dashboard");

    const [topicos, setTopicos] = useState<Topico[]>([]);
    const [auditorias, setAuditorias] = useState<Auditoria[]>([]);

    const [formTopico, setFormTopico] = useState({ topico: '', categoria: '' });
    const [searchTerm, setSearchTerm] = useState("");

    const [shiftKpis, setShiftKpis] = useState({ kpiHst: 0, kpiEpi: 0, count: 0 });

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setLoading(true);
        const [resTopicos, resAudits, resShift] = await Promise.all([
            getAuditoriaTopicos(),
            getAuditorias(),
            getShiftSafetyKPIs()
        ]);

        if (resTopicos.success) setTopicos(resTopicos.data || []);
        if (resAudits.success) setAuditorias(resAudits.data || []);
        if (resShift.success) setShiftKpis({ kpiHst: resShift.kpiHst || 0, kpiEpi: resShift.kpiEpi || 0, count: resShift.count || 0 });

        setLoading(false);
    };

    const handleSalvarTopico = async () => {
        if (!formTopico.topico || !formTopico.categoria) {
            toast.warn("Tópico e Categoria são obrigatórios.");
            return;
        }
        const res = await addAuditoriaTopico(formTopico.topico, formTopico.categoria);
        if (res.success) {
            toast.success("Tópico criado.");
            setFormTopico({ topico: '', categoria: '' });
            carregarDados();
        } else {
            toast.error("Erro: " + res.error);
        }
    };

    const handleToggleAtivo = async (id: string, atual: boolean) => {
        const res = await toggleTopicoStatus(id, !atual);
        if (res.success) {
            carregarDados();
        } else {
            toast.error("Falha a alterar estado.");
        }
    };

    // Global Score Calculation
    const globalScore = auditorias.length > 0
        ? auditorias.reduce((acc, a) => acc + Number(a.score_percentual), 0) / auditorias.length
        : 0;

    const filAudits = auditorias.filter(a =>
        a.areas_fabrica?.nome_area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.operadores?.nome_operador.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in pb-32">
            <ToastContainer position="bottom-right" />

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-4 border-slate-200">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <ShieldCheck className="h-8 w-8 text-emerald-600" />
                        Auditorias HST
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Programa de Inspeção e Conformidade de Segurança (Gemba Walks especializados).
                    </p>
                </div>

                <div className="flex bg-slate-100/80 rounded-lg p-1 border border-slate-200/60 shadow-inner">
                    <button
                        className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-emerald-700 hover:bg-slate-200/50'}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <LayoutDashboard size={18} /> Roadmap & Histórico
                    </button>
                    <button
                        className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all flex items-center gap-2 ${activeTab === 'configuracao' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-emerald-700 hover:bg-slate-200/50'}`}
                        onClick={() => setActiveTab('configuracao')}
                    >
                        <Settings2 size={18} /> Configurar Tópicos
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : (
                <>
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4">

                            {/* Roadmap KPIs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
                                    <CardContent className="p-6 flex flex-col justify-between h-full">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Conformidade Fabril</p>
                                                <h2 className="text-3xl font-black text-slate-800">{globalScore.toFixed(1)}%</h2>
                                            </div>
                                            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                                                <Target size={24} />
                                            </div>
                                        </div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-4 tracking-wider">Média Global de {auditorias.length} Gemba Walks</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                    <CardContent className="p-6 flex flex-col justify-between h-full relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><UserCheck size={80} /></div>
                                        <div className="flex items-start justify-between relative z-10">
                                            <div>
                                                <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1">Segurança Diária</p>
                                                <h2 className={`text-3xl font-black ${shiftKpis.kpiHst >= 80 ? 'text-emerald-600' : 'text-amber-500'}`}>{shiftKpis.kpiHst}%</h2>
                                            </div>
                                        </div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-4 tracking-wider relative z-10">Score de Setup de Turno ({shiftKpis.count} logs)</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                    <CardContent className="p-6 flex flex-col justify-between h-full relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><HardHat size={80} /></div>
                                        <div className="flex items-start justify-between relative z-10">
                                            <div>
                                                <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">Uso de EPIs</p>
                                                <h2 className={`text-3xl font-black ${shiftKpis.kpiEpi >= 80 ? 'text-emerald-600' : 'text-amber-500'}`}>{shiftKpis.kpiEpi}%</h2>
                                            </div>
                                        </div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-4 tracking-wider relative z-10">Inspeção de Turno ({shiftKpis.count} logs)</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-emerald-600 border-none shadow-md shadow-emerald-600/20 text-white cursor-pointer hover:bg-emerald-700 transition-colors" onClick={() => router.push('/admin/hst/auditorias/nova')}>
                                    <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center group">
                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Plus size={24} className="text-white" />
                                        </div>
                                        <h3 className="font-bold text-lg">Nova Auditoria</h3>
                                        <p className="text-emerald-100/80 text-xs mt-1">Ir para o Tablet de Inspeção</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Histórico */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><History size={20} className="text-blue-600" /> Histórico de Inspeções</h3>
                                    <div className="relative w-72">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input placeholder="Pesquisar Local ou Auditor..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 uppercase text-[10px] tracking-widest font-black text-slate-500 border-b border-slate-200">
                                                <th className="p-4">Data</th>
                                                <th className="p-4">Área Fabril</th>
                                                <th className="p-4">Avaliador (HST)</th>
                                                <th className="p-4">Conformidade (Score)</th>
                                                <th className="p-4 text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filAudits.map(a => (
                                                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="p-4">
                                                        <div className="text-sm font-bold text-slate-800">{format(new Date(a.data_auditoria), 'dd/MM/yyyy')}</div>
                                                        <div className="text-xs text-slate-500 font-mono">{format(new Date(a.data_auditoria), 'HH:mm')}</div>
                                                    </td>
                                                    <td className="p-4 font-medium text-slate-700">{a.areas_fabrica?.nome_area}</td>
                                                    <td className="p-4 text-sm text-slate-600">{a.operadores?.nome_operador}</td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-full bg-slate-100 rounded-full h-2 max-w-[100px]">
                                                                <div className={`h-2 rounded-full \${a.score_percentual >= 80 ? 'bg-emerald-500' : a.score_percentual >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${a.score_percentual}%` }}></div>
                                                            </div>
                                                            <span className={`text-xs font-black \${a.score_percentual >= 80 ? 'text-emerald-600' : a.score_percentual >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{a.score_percentual}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <Button variant="ghost" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium text-xs">
                                                            Detalhes <ArrowRight size={14} className="ml-1" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filAudits.length === 0 && (
                                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum registo de auditoria encontrado.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'configuracao' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
                            <div className="md:col-span-1">
                                <Card className="border-slate-200 shadow-sm sticky top-8">
                                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                                        <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                            <Plus size={18} className="text-emerald-600" /> Novo Critério
                                        </CardTitle>
                                        <CardDescription>Cria as questões obrigatórias que os auditores vão validar rotineiramente.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Categoria / Família</label>
                                            <Input
                                                autoComplete="off"
                                                placeholder="Ex: 5S, Combate Incêndios, EPIs"
                                                value={formTopico.categoria}
                                                onChange={e => setFormTopico({ ...formTopico, categoria: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Pergunta / Tópico Exato</label>
                                            <Input
                                                autoComplete="off"
                                                placeholder="Ex: Os extintores encontram-se sinalizados e desobstruidos?"
                                                value={formTopico.topico}
                                                onChange={e => setFormTopico({ ...formTopico, topico: e.target.value })}
                                            />
                                        </div>
                                        <Button onClick={handleSalvarTopico} className="w-full bg-slate-800 hover:bg-slate-900 font-bold">Injetar na Checklist</Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs ml-1">Checklist Master de Auditoria ({topicos.length})</h3>
                                {topicos.map(t => (
                                    <div key={t.id} className={`bg-white p-5 rounded-xl border \${t.ativo ? 'border-emerald-200' : 'border-slate-200 opacity-60'} shadow-sm flex justify-between items-center transition-colors`}>
                                        <div className="flex gap-4 items-center flex-1">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 \${t.ativo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {t.ativo ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{t.categoria}</div>
                                                <h4 className={`font-bold \${t.ativo ? 'text-slate-800' : 'text-slate-500 line-through decoration-slate-300'}`}>{t.topico}</h4>
                                            </div>
                                        </div>
                                        <div className="shrink-0 ml-4">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={t.ativo} onChange={() => handleToggleAtivo(t.id, t.ativo)} />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                                {topicos.length === 0 && (
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500 font-medium">
                                        Checklist vazia. Comece por parametrizar as regras da sua fábrica.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

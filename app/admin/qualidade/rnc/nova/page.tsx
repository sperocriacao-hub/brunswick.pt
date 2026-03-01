"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createRnc, getSelectData, getQualityActions } from '../actions';
import { useRouter } from 'next/navigation';
import { FileWarning, Save, Loader2, Info, Search, FileText, Printer, History } from 'lucide-react';

export default function NovaRncPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'nova' | 'historico'>('nova');

    const [submitting, setSubmitting] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Selects Data
    const [ops, setOps] = useState<any[]>([]);
    const [estacoes, setEstacoes] = useState<any[]>([]);

    // History Data
    const [history8d, setHistory8d] = useState<any[]>([]);
    const [historyA3, setHistoryA3] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [opId, setOpId] = useState('');
    const [estacaoId, setEstacaoId] = useState('');
    const [detetadoPor, setDetetadoPor] = useState('');
    const [tipo, setTipo] = useState('Dimensional');
    const [gravidade, setGravidade] = useState('Media');
    const [descricao, setDescricao] = useState('');
    const [acao, setAcao] = useState('');

    useEffect(() => {
        carregarSelects();
    }, []);

    useEffect(() => {
        if (activeTab === 'historico') {
            carregarHistorico();
        }
    }, [activeTab]);

    async function carregarSelects() {
        const res = await getSelectData();
        if (res.success) {
            setOps(res.ops || []);
            setEstacoes(res.estacoes || []);
        }
    }

    async function carregarHistorico() {
        setLoadingHistory(true);
        const res = await getQualityActions();
        if (res.success) {
            setHistory8d(res.historico8d || []);
            setHistoryA3(res.historicoA3 || []);
        }
        setLoadingHistory(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            ordem_producao_id: opId === 'none' || !opId ? null : opId,
            estacao_id: estacaoId === 'none' || !estacaoId ? null : estacaoId,
            detetado_por_nome: detetadoPor,
            tipo_defeito: tipo,
            gravidade: gravidade,
            descricao_problema: descricao,
            acao_imediata: acao
        };

        const res = await createRnc(payload);
        if (res.success) {
            router.push('/admin/qualidade/rnc');
        } else {
            alert("Falha a abrir RNC: " + res.error);
            setSubmitting(false);
        }
    }

    // Merge and Filter History Actions
    const combinedHistory = [
        ...history8d.map(h => ({
            id: h.id, type: '8D', ref: h.numero_8d, rnc: h.qualidade_rnc?.numero_rnc,
            desc: h.qualidade_rnc?.descricao_problema,
            action: h.d5_acao_corretiva || 'Sem Ação Preenchida',
            date: new Date(h.created_at).toLocaleDateString()
        })),
        ...historyA3.map(h => ({
            id: h.id, type: 'A3', ref: h.titulo, rnc: h.qualidade_rnc?.numero_rnc,
            desc: h.qualidade_rnc?.descricao_problema,
            action: h.contramedidas || 'Sem Contramedida',
            date: new Date(h.created_at).toLocaleDateString()
        }))
    ];

    const filteredHistory = combinedHistory.filter(item =>
        (item.rnc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.desc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.action || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-32">
            <header className="flex items-start justify-between border-b border-slate-200 pb-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FileWarning className="text-rose-600" size={32} /> Abertura de RNC
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Registo Inicial de Não Conformidade e Histórico de Ações</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
                </div>
            </header>

            {/* Custom Tabs Navigation */}
            <div className="flex space-x-2 border-b border-slate-200 print:hidden">
                <button
                    onClick={() => setActiveTab('nova')}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'nova' ? 'border-rose-600 text-rose-700 bg-rose-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                >
                    <FileWarning size={16} /> Nova Ocorrência
                </button>
                <button
                    onClick={() => setActiveTab('historico')}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'historico' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                >
                    <History size={16} /> Histórico de Ações (8D / A3)
                </button>
            </div>

            {/* TAB: NOVA RNC */}
            {activeTab === 'nova' && (
                <Card className="border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">Detalhes da Ocorrência</CardTitle>
                        <CardDescription>O número sequencial (Ex: RNC-2026-X) será gerado automaticamente.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Contexto Produtivo (O.P.)</label>
                                    <Select value={opId} onValueChange={setOpId}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Aplicar a Ordem..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- RNC Geral (Sem OP Específica) --</SelectItem>
                                            {ops.map(op => (
                                                <SelectItem key={op.id} value={op.id}>
                                                    {op.linhas_producao?.letra_linha ? `Linha ${op.linhas_producao.letra_linha}` : 'Sem Linha'} - O.P. {op.id.split('-')[0]} ({op.modelos?.nome_modelo})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Estação de Trabalho</label>
                                    <Select value={estacaoId} onValueChange={setEstacaoId}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Local da Ocorrência..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Não Especificado --</SelectItem>
                                            {estacoes.map(st => (
                                                <SelectItem key={st.id} value={st.id}>
                                                    {st.linhas_producao?.letra_linha ? `Linha ${st.linhas_producao.letra_linha}` : 'Sem Linha'} - {st.areas_fabrica?.nome_area} - {st.nome_estacao}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Detetado Por</label>
                                    <Input required value={detetadoPor} onChange={e => setDetetadoPor(e.target.value)} placeholder="Nome do Inspetor/Operador" className="bg-white" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Classe do Defeito</label>
                                    <Select value={tipo} onValueChange={setTipo}>
                                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Dimensional">Dimensional / Geometria</SelectItem>
                                            <SelectItem value="Estético">Estético / Cosmético (Fibra)</SelectItem>
                                            <SelectItem value="Material">Material Não-Conforme (Stock)</SelectItem>
                                            <SelectItem value="Processo">Falha de Processo / Humana</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Gravidade Inicial</label>
                                    <Select value={gravidade} onValueChange={setGravidade}>
                                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Baixa">Baixa (Retoque cosmético rápido)</SelectItem>
                                            <SelectItem value="Media">Média (Requer retrabalho fora do tempo standard)</SelectItem>
                                            <SelectItem value="Critica">Crítica (Risco Estrutural / Desmantelar)</SelectItem>
                                            <SelectItem value="Bloqueante">Bloqueante (Para a linha imediatamente)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-700 uppercase">Descrição da Desconformidade</label>
                                <textarea
                                    required
                                    value={descricao}
                                    onChange={e => setDescricao(e.target.value)}
                                    className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    placeholder="Descreva os factos em pormenor. O que está errado? Qual a tolerância desrespeitada?"
                                />
                            </div>

                            <div className="space-y-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <label className="text-xs font-bold text-amber-900 uppercase flex items-center gap-2">
                                    <Info size={14} /> Ação de Contenção Imediata (D3)
                                </label>
                                <textarea
                                    value={acao}
                                    onChange={e => setAcao(e.target.value)}
                                    className="flex w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder="De forma a proteger o cliente e não infetar outras fases, o que foi feito logo na hora? (Ex: Isolar lote, refazer peça, travar a máquina...)"
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-6">
                                <Button disabled={submitting} type="submit" className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8">
                                    {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Gerar Número de RNC
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* TAB: HISTORICO */}
            {activeTab === 'historico' && (
                <Card className="border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">Registo de Lições Aprendidas</CardTitle>
                            <CardDescription>Consulte as ações e contramedidas tomadas nas Ocorrências Históricas.</CardDescription>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    className="pl-9"
                                    placeholder="RNC, Problema ou Ação..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" onClick={() => window.print()} className="print:hidden">
                                <Printer className="w-4 h-4 mr-2" /> Imprimir
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingHistory ? (
                            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                                A carregar a base de dados de ações...
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3 border-b">Data</th>
                                            <th className="px-4 py-3 border-b">Documento</th>
                                            <th className="px-4 py-3 border-b">RNC Base</th>
                                            <th className="px-4 py-3 border-b">Problema Relatado</th>
                                            <th className="px-4 py-3 border-b">Ação Corretiva / Contramedida</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                                    Nenhum histórico encontrado.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredHistory.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.date}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.type === '8D' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-rose-600 whitespace-nowrap">{item.rnc || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-slate-800 break-words max-w-[250px]">{item.desc || 'N/A'}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-700 break-words max-w-[300px]">{item.action}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page { size: landscape; margin: 1cm; }
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                    table { border: 1px solid #e2e8f0; width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #e2e8f0; padding: 12px; font-size: 10pt; }
                    th { background-color: #f8fafc !important; }
                    .max-w-\\[1200px\\] { max-width: none !important; margin: 0 !important; padding: 0 !important; }
                    .shadow-sm { box-shadow: none !important; }
                    .border-slate-200 { border-color: #000 !important; }
                }
            `}</style>
        </div>
    );
}

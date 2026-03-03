"use client";

import React, { useState, useEffect } from "react";
import { getTiposCertificacao, getOperadoresComCertificados, addTipoCertificacao, deleteTipoCertificacao, atribuirCertificacao } from "./actions";
import { ShieldAlert, Award, Calendar, Loader2, Plus, Users, Trash2, Search, ArrowRight, Focus, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { differenceInDays, format, isPast } from "date-fns";
import { pt } from "date-fns/locale";

interface TipoCert {
    id: string;
    nome: string;
    descricao: string;
}

interface Operador {
    id: string;
    nome_operador: string;
    nome_area: string;
}

interface Atribuicao {
    id: string;
    operador_id: string;
    tipo_certificacao_id: string;
    data_emissao: string;
    data_validade: string;
}

export default function CertificacoesPage() {
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"matriz" | "gestao">("matriz");

    // Dados
    const [tipos, setTipos] = useState<TipoCert[]>([]);
    const [operadores, setOperadores] = useState<Operador[]>([]);
    const [atribuicoes, setAtribuicoes] = useState<Atribuicao[]>([]);

    // Modals
    const [isAtribuirOpen, setIsAtribuirOpen] = useState(false);
    const [isNovoTipoOpen, setIsNovoTipoOpen] = useState(false);

    // Formulários
    const [selOperador, setSelOperador] = useState<Operador | null>(null);
    const [selTipo, setSelTipo] = useState<TipoCert | null>(null);
    const [formAtribuir, setFormAtribuir] = useState({ emissao: format(new Date(), "yyyy-MM-dd"), validade: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "yyyy-MM-dd") });

    const [formNovoTipo, setFormNovoTipo] = useState({ nome: '', descricao: '' });

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setLoading(true);
        const [resTipos, resOps] = await Promise.all([
            getTiposCertificacao(),
            getOperadoresComCertificados()
        ]);

        if (resTipos.success) setTipos(resTipos.data || []);
        if (resOps.success) {
            setOperadores(resOps.operadores || []);
            setAtribuicoes(resOps.atribuicoes || []);
        } else {
            toast.error("Erro a carregar as grelhas.");
        }
        setLoading(false);
    };

    const handleSaveNovoTipo = async () => {
        if (!formNovoTipo.nome) {
            toast.warn("O Nome é obrigatório.");
            return;
        }
        const res = await addTipoCertificacao(formNovoTipo.nome, formNovoTipo.descricao);
        if (res.success) {
            toast.success("Certificação base criada.");
            setFormNovoTipo({ nome: '', descricao: '' });
            setIsNovoTipoOpen(false);
            carregarDados();
        } else {
            toast.error("Erro ao criar: " + res.error);
        }
    };

    const handleRemoverTipo = async (id: string) => {
        if (confirm("Tem a certeza? Isto apagará este certificado para todos os agentes.")) {
            const res = await deleteTipoCertificacao(id);
            if (res.success) {
                toast.success("Certificação apagada.");
                carregarDados();
            } else {
                toast.error("Erro ao apagar: " + res.error);
            }
        }
    };

    const handleAtribuirModal = (op: Operador, tipo: TipoCert, currentAttr?: Atribuicao) => {
        setSelOperador(op);
        setSelTipo(tipo);
        if (currentAttr) {
            setFormAtribuir({ emissao: currentAttr.data_emissao, validade: currentAttr.data_validade });
        } else {
            setFormAtribuir({ emissao: format(new Date(), "yyyy-MM-dd"), validade: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "yyyy-MM-dd") });
        }
        setIsAtribuirOpen(true);
    };

    const handleSaveAtribuicao = async () => {
        if (!selOperador || !selTipo || !formAtribuir.emissao || !formAtribuir.validade) return;

        const res = await atribuirCertificacao({
            operador_id: selOperador.id,
            tipo_certificacao_id: selTipo.id,
            data_emissao: formAtribuir.emissao,
            data_validade: formAtribuir.validade
        });

        if (res.success) {
            toast.success("Certificação atualizada para o agente.");
            setIsAtribuirOpen(false);
            carregarDados();
        } else {
            toast.error("Falha a atribuir certificado: " + res.error);
        }
    };

    const getEstadoCorInfo = (attr?: Atribuicao) => {
        if (!attr) return { cor: "bg-slate-100 text-slate-300", icone: <Users size={14} />, tooltip: "Sem certificado atribuído" };

        const hoje = new Date();
        const calValidade = new Date(attr.data_validade);

        if (isPast(calValidade)) {
            return { cor: "bg-rose-100/50 text-rose-600 border border-rose-200", icone: <ShieldAlert size={14} />, tooltip: `Caducou a ${format(calValidade, 'dd/MM/yyyy')}` };
        }

        const diff = differenceInDays(calValidade, hoje);
        if (diff <= 30) {
            return { cor: "bg-amber-100/50 text-amber-600 border border-amber-200", icone: <Focus size={14} />, tooltip: `Expira em ${diff} dias!` };
        }

        return { cor: "bg-emerald-50 text-emerald-600 border border-emerald-200", icone: <ShieldCheck size={14} />, tooltip: `Válido até ${format(calValidade, 'dd/MM/yyyy')}` };
    };

    const filOps = operadores.filter(o =>
        o.nome_operador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.nome_area.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in pb-32">
            <ToastContainer position="bottom-right" />

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-4 border-slate-200">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <Award className="h-8 w-8 text-blue-600" />
                        Certificações Operacionais
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Matriz de Competências e Habilitações Legais (HST) da Fábrica.
                    </p>
                </div>

                <div className="flex bg-slate-100/80 rounded-lg p-1 border border-slate-200/60 shadow-inner">
                    <button
                        className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${activeTab === 'matriz' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-blue-700 hover:bg-slate-200/50'}`}
                        onClick={() => setActiveTab('matriz')}
                    >
                        Matriz Fabril
                    </button>
                    <button
                        className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${activeTab === 'gestao' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-blue-700 hover:bg-slate-200/50'}`}
                        onClick={() => setActiveTab('gestao')}
                    >
                        Gerir Tipos de Certificado
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <>
                    {activeTab === 'matriz' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Procurar Operador ou Área..."
                                        className="pl-9 bg-slate-50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 ml-auto">
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-200"></div> Válido</div>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-200"></div> &lt; 30 Dias</div>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-rose-100 border border-rose-200"></div> Caducado</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-xs">
                                                <th className="p-4 font-bold text-slate-600 sticky left-0 bg-slate-50 z-10 w-64 shadow-[1px_0_0_0_#e2e8f0]">Operador / Área</th>
                                                {tipos.map(t => (
                                                    <th key={t.id} className="p-4 font-bold text-slate-600 text-center uppercase tracking-wider min-w-[140px]">
                                                        {t.nome}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filOps.map(op => (
                                                <tr key={op.id} className="hover:bg-blue-50/20 transition-colors group">
                                                    <td className="p-4 sticky left-0 bg-white group-hover:bg-blue-50/20 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                                                        <div className="font-bold text-slate-800 text-sm tracking-tight">{op.nome_operador}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{op.nome_area}</div>
                                                    </td>
                                                    {tipos.map(tipo => {
                                                        const userAttr = atribuicoes.find(a => a.operador_id === op.id && a.tipo_certificacao_id === tipo.id);
                                                        const sInfo = getEstadoCorInfo(userAttr);

                                                        return (
                                                            <td key={tipo.id} className="p-2 text-center h-full">
                                                                <button
                                                                    onClick={() => handleAtribuirModal(op, tipo, userAttr)}
                                                                    title={sInfo.tooltip}
                                                                    className={`w-full py-3 flex justify-center items-center rounded-lg transition-transform hover:scale-[1.05] active:scale-95 \${sInfo.cor}`}
                                                                >
                                                                    {sInfo.icone}
                                                                </button>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                            {filOps.length === 0 && (
                                                <tr>
                                                    <td colSpan={tipos.length + 1} className="p-12 text-center text-slate-500">
                                                        Nenhum operador correspondeu à pesquisa.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'gestao' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
                            <div className="md:col-span-1">
                                <Card className="border-slate-200 shadow-sm sticky top-8">
                                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                                        <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                            <Plus size={18} className="text-blue-600" /> Nova Categoria
                                        </CardTitle>
                                        <CardDescription>Adiciona uma nova certificação legal à base de dados que exija validação e acompanhamento.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Nome da Certificação</label>
                                            <Input
                                                autoComplete="off"
                                                placeholder="Ex: Condução de Empilhadeiras"
                                                value={formNovoTipo.nome}
                                                onChange={e => setFormNovoTipo({ ...formNovoTipo, nome: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Descrição (Opcional)</label>
                                            <Input
                                                autoComplete="off"
                                                placeholder="Ex: Habilitação p/ Manuseamento Logístico."
                                                value={formNovoTipo.descricao}
                                                onChange={e => setFormNovoTipo({ ...formNovoTipo, descricao: e.target.value })}
                                            />
                                        </div>
                                        <Button onClick={handleSaveNovoTipo} className="w-full bg-slate-800 hover:bg-slate-900 font-bold">Criar Certificado</Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs ml-1">Tipos Cadastrados ({tipos.length})</h3>
                                {tipos.map(t => (
                                    <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-colors">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                <Award size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{t.nome}</h4>
                                                <p className="text-sm text-slate-500 mt-0.5">{t.descricao || 'Sem descrição'}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoverTipo(t.id)}
                                            className="text-slate-300 hover:bg-rose-50 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Eliminar Base"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))}
                                {tipos.length === 0 && (
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500 font-medium">
                                        Comece por criar o primeiro Tipo de Certificado na coluna ao lado.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal de Atribuição de Data */}
            <Dialog open={isAtribuirOpen} onOpenChange={setIsAtribuirOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Calendar className="text-blue-600" /> Renovar Certidão
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6 font-medium text-sm text-slate-600 flex items-center justify-between">
                            <span className="font-bold text-slate-800">{selOperador?.nome_operador}</span>
                            <ArrowRight size={14} className="text-slate-300" />
                            <span className="text-blue-700 font-bold">{selTipo?.nome}</span>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Data de Emissão (Realização)</label>
                                <Input type="date" value={formAtribuir.emissao} onChange={e => setFormAtribuir({ ...formAtribuir, emissao: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Concedida Validade Até</label>
                                <Input type="date" value={formAtribuir.validade} onChange={e => setFormAtribuir({ ...formAtribuir, validade: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleSaveAtribuicao} className="w-full font-bold bg-blue-600 hover:bg-blue-700 mt-2">Gravar Entidade Pessoal</Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}

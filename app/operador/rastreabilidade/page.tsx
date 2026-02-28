'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, ClipboardList, CheckCircle2, ChevronLeft, ArrowRight, Package, Box } from 'lucide-react';

// Reusa as actions globais da app operador para carregar estações
import { buscarEstacoes } from '../actions';
import { buscarDetalhesBarcoPorHin, registarPecaRastreabilidade, buscarPecasRegistadasNaOp } from './actions';

export default function RastreabilidadeTabletPage() {
    const router = useRouter();

    // 1. Contexto Fabril
    const [estacoes, setEstacoes] = useState<{ id: string, nome_estacao: string }[]>([]);
    const [selectedEstacaoId, setSelectedEstacaoId] = useState<string>('');
    const [operadorRfid, setOperadorRfid] = useState('');

    // 2. Estado do Barco
    const [barcoHIN, setBarcoHIN] = useState('');
    const [barcoDetalhes, setBarcoDetalhes] = useState<{ id: string, numero: string, modelo: string } | null>(null);
    const [pecasRegistadas, setPecasRegistadas] = useState<any[]>([]);

    // 3. Estado de Input de Peça
    const [nomePeca, setNomePeca] = useState('');
    const [numeroLote, setNumeroLote] = useState('');
    const [fornecedor, setFornecedor] = useState('');

    const barcoInputRef = useRef<HTMLInputElement>(null);
    const loteInputRef = useRef<HTMLInputElement>(null);

    // Bootstrap
    useEffect(() => {
        async function fetchInitial() {
            const res = await buscarEstacoes();
            if (res.success && res.estacoes) {
                setEstacoes(res.estacoes);
                const saved = localStorage.getItem('tablet_last_estacao');
                if (saved) setSelectedEstacaoId(saved);
            }
        }
        fetchInitial();
    }, []);

    const carregarBarco = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcoHIN.trim()) return;

        const res = await buscarDetalhesBarcoPorHin(barcoHIN.trim());
        if (res.success && res.barco) {
            setBarcoDetalhes(res.barco);
            carregarHistoricoPecas(res.barco.id);
            loteInputRef.current?.focus();
        } else {
            alert(res.error || "Barco não encontrado.");
            setBarcoHIN('');
            setBarcoDetalhes(null);
        }
    };

    const carregarHistoricoPecas = async (op_id: string) => {
        const res = await buscarPecasRegistadasNaOp(op_id);
        if (res.success && res.pecas) {
            setPecasRegistadas(res.pecas);
        }
    };

    const submeterPeca = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcoDetalhes || !selectedEstacaoId) {
            alert("Fixe a Estação e o Barco primeiro."); return;
        }
        if (!operadorRfid.trim() || !nomePeca.trim() || !numeroLote.trim()) {
            alert("Operador, Peça e Lote são campos obrigatórios."); return;
        }

        const res = await registarPecaRastreabilidade({
            op_id: barcoDetalhes.id,
            estacao_id: selectedEstacaoId,
            operador_rfid: operadorRfid.trim(),
            nome_peca: nomePeca.trim(),
            numero_serie_lote: numeroLote.trim(),
            fornecedor: fornecedor.trim()
        });

        if (res.success) {
            // Limpar formulário de peça atual, focar no próximo numeroLote se for mesma peça, ou nome.
            setNumeroLote('');
            carregarHistoricoPecas(barcoDetalhes.id);
            loteInputRef.current?.focus();
        } else {
            alert(res.error || "Falha a guardar código de barras.");
        }
    };

    const fecharBarco = () => {
        setBarcoDetalhes(null);
        setBarcoHIN('');
        setPecasRegistadas([]);
        barcoInputRef.current?.focus();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <header className="bg-indigo-900 border-b border-indigo-950 p-4 sticky top-0 z-10 flex gap-4 items-center justify-between shadow-lg text-white">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/operador')} className="mr-2 hover:bg-indigo-800 rounded-full h-12 w-12 text-indigo-300">
                        <ChevronLeft size={28} />
                    </Button>
                    <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-inner">
                        <QrCode className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Scanner Logístico B.O.M.</h1>
                        <p className="text-sm text-indigo-300 font-bold">Traceability & Genealogy Hub</p>
                    </div>
                </div>

                <div className="flex-1 max-w-sm">
                    <SearchableSelect
                        options={estacoes.map(est => ({ value: est.id, label: est.nome_estacao }))}
                        value={selectedEstacaoId}
                        onChange={(vl) => {
                            setSelectedEstacaoId(vl);
                            localStorage.setItem('tablet_last_estacao', vl);
                        }}
                        placeholder="Vincular a Terminal Fisico..."
                        className="h-10 text-sm font-bold border-0 bg-indigo-800 text-white placeholder:text-indigo-400"
                    />
                </div>
            </header>

            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">

                {/* LADO ESQUERDO: CONTROLO E INPUT */}
                <div className="flex-1 flex flex-col gap-6">

                    {/* PASSO 1: IDENTIFICAR O BARCO */}
                    <div className={`bg-white rounded-3xl p-6 md:p-8 shadow-sm border-2 transition-all ${!barcoDetalhes ? 'border-indigo-500 shadow-indigo-100' : 'border-slate-200 opacity-60'}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full tracking-tighter bg-indigo-100 text-indigo-600 font-black flex items-center justify-center text-lg">1</div>
                            <h2 className="text-2xl font-black text-slate-800">Ler Cadastro de Casco</h2>
                            {barcoDetalhes && <CheckCircle2 className="text-emerald-500 ml-auto" size={32} />}
                        </div>

                        {!barcoDetalhes ? (
                            <form onSubmit={carregarBarco} className="flex gap-4">
                                <Input
                                    ref={barcoInputRef}
                                    value={barcoHIN}
                                    onChange={(e) => setBarcoHIN(e.target.value)}
                                    placeholder="Ex: HIN-100-Y23 (Scan Cod. Barras)"
                                    className="h-16 text-2xl font-mono uppercase bg-slate-50 border-2 border-slate-300 rounded-2xl"
                                    autoFocus
                                />
                                <Button type="submit" size="lg" className="h-16 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-lg">
                                    Localizar <ArrowRight className="ml-2" />
                                </Button>
                            </form>
                        ) : (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-1">Unidade Confirmada</p>
                                    <p className="text-2xl font-black text-slate-800">{barcoDetalhes.numero} <span className="text-lg font-medium text-slate-500 ml-2">({barcoDetalhes.modelo})</span></p>
                                </div>
                                <Button variant="outline" onClick={fecharBarco} className="rounded-xl border-slate-300">Alterar Barco</Button>
                            </div>
                        )}
                    </div>

                    {/* PASSO 2: PISTOLA DE MATÉRIAS PRIMAS */}
                    <div className={`bg-white rounded-3xl p-6 md:p-8 shadow-sm border-2 transition-all ${barcoDetalhes ? 'border-blue-500 shadow-blue-100' : 'border-slate-200 opacity-40 pointer-events-none'}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full tracking-tighter bg-blue-100 text-blue-600 font-black flex items-center justify-center text-lg">2</div>
                            <h2 className="text-2xl font-black text-slate-800">Casar Lote à Embarcação</h2>
                        </div>

                        <form onSubmit={submeterPeca} className="flex flex-col gap-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500">Credencial Operador (Crachá)</label>
                                    <Input
                                        value={operadorRfid}
                                        onChange={(e) => setOperadorRfid(e.target.value)}
                                        placeholder="Passe o Funcional..."
                                        className="h-14 bg-slate-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500">Nome Componente/Liquido</label>
                                    <Input
                                        value={nomePeca}
                                        onChange={(e) => setNomePeca(e.target.value)}
                                        placeholder="Ex: Motor Auxiliar Esq."
                                        className="h-14 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 flex items-center gap-2"><QrCode size={16} /> * N.º Série / Número Lote</label>
                                <Input
                                    ref={loteInputRef}
                                    value={numeroLote}
                                    onChange={(e) => setNumeroLote(e.target.value)}
                                    placeholder="Click e Pistola de Barcodes Aqui..."
                                    className="h-20 text-3xl font-mono uppercase bg-blue-50 border-2 border-blue-400 focus-visible:ring-blue-500 rounded-2xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500">Fornecedor (Opcional)</label>
                                <Input
                                    value={fornecedor}
                                    onChange={(e) => setFornecedor(e.target.value)}
                                    placeholder="Ex: Yamaha Motors"
                                    className="h-14"
                                />
                            </div>

                            <Button type="submit" size="lg" className="h-16 mt-2 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-xl tracking-wide w-full shadow-lg shadow-blue-500/30">
                                GRAVAR PEÇA NO SISTEMA
                            </Button>
                        </form>
                    </div>

                </div>

                {/* LADO DIREITO: MEMÓRIA DA EMBARCAÇÃO */}
                <div className="w-full lg:w-96 flex flex-col">
                    <div className="bg-slate-100 border-2 border-slate-200 rounded-3xl p-6 h-full flex flex-col">
                        <h3 className="text-lg font-black text-slate-700 mb-6 flex items-center gap-2">
                            <ClipboardList size={22} className="text-slate-500" /> Visão de Scanner Local
                        </h3>

                        {!barcoDetalhes ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                                <Package size={64} className="text-slate-300 mb-4" strokeWidth={1} />
                                <p className="text-slate-500 font-medium">Aguardando a identificação da Embarcação para listar peças aplicadas.</p>
                            </div>
                        ) : pecasRegistadas.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center pt-10 text-center px-4">
                                <Box size={48} className="text-blue-200 mb-4" strokeWidth={1} />
                                <p className="text-slate-500">Nenhuma matéria prima ou lote foi gravado na genealogia deste barco nesta estação.</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                {pecasRegistadas.map((peca) => (
                                    <div key={peca.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1 animate-in fade-in slide-in-from-right-4">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-slate-800 leading-tight">{peca.nome_peca}</span>
                                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md mb-1">{peca.fornecedor || 'N/A'}</span>
                                        </div>
                                        <span className="font-mono text-xs text-blue-600 bg-blue-50 py-1 px-2 rounded font-bold break-all">
                                            SN: {peca.numero_serie_lote}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}

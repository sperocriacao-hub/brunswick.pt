'use client';

import React, { useState, useEffect } from 'react';
import { MonitorSmartphone, RefreshCw, ClipboardCheck, Play, Square, AlertCircle, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { buscarEstacoes, buscarBarcosNaEstacao, iniciarSessaoTrabalho, terminarSessaoTrabalho } from './actions';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

interface Barco {
    id: string;
    op_numero: string;
    modelo: string;
    hin: string;
}

export default function TabletDashboardPage() {
    const router = useRouter();

    // Core State
    const [estacoes, setEstacoes] = useState<{ id: string, nome_estacao: string }[]>([]);
    const [selectedEstacaoId, setSelectedEstacaoId] = useState<string>('');
    const [barcos, setBarcos] = useState<Barco[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modal State
    const [selectedBarco, setSelectedBarco] = useState<Barco | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Action State (Micro-OEE auth)
    const [rfidInput, setRfidInput] = useState('');
    const [activeSessaoId, setActiveSessaoId] = useState<string | null>(null);

    // 1. Initial Load
    useEffect(() => {
        async function fetchInitial() {
            const res = await buscarEstacoes();
            if (res.success && res.estacoes) {
                setEstacoes(res.estacoes);
                // Try to load last selected station from localStorage for convenience
                const savedEstacao = localStorage.getItem('tablet_last_estacao');
                if (savedEstacao && res.estacoes.find(e => e.id === savedEstacao)) {
                    setSelectedEstacaoId(savedEstacao);
                }
            }
            setIsLoading(false);
        }
        fetchInitial();
    }, []);

    // 2. Load Barcos when Station changes
    useEffect(() => {
        if (!selectedEstacaoId) {
            setBarcos([]);
            return;
        }

        localStorage.setItem('tablet_last_estacao', selectedEstacaoId);
        loadBarcos();

        // Auto-refresh interval (every 30 seconds)
        const interval = setInterval(loadBarcos, 30000);
        return () => clearInterval(interval);
    }, [selectedEstacaoId]);

    const loadBarcos = async () => {
        if (!selectedEstacaoId) return;
        setIsRefreshing(true);
        const res = await buscarBarcosNaEstacao(selectedEstacaoId);
        if (res.success && res.barcos) {
            setBarcos(res.barcos);
        }
        setIsRefreshing(false);
    };

    // 3. UI Actions
    const handleBarcoClick = (barco: Barco) => {
        setSelectedBarco(barco);
        setRfidInput('');
        setIsModalOpen(true);
    };

    const handleStartWork = async () => {
        if (!selectedBarco || !rfidInput.trim()) {
            alert('Por favor, prima o seu crachá (RFID) no leitor.');
            return;
        }

        const res = await iniciarSessaoTrabalho(rfidInput.trim(), selectedBarco.hin, selectedEstacaoId);
        if (res.success) {
            alert(`Sessão Iniciada! Bom trabalho na ${selectedBarco.op_numero}.`);
            setActiveSessaoId(res.registoId || null);
            setRfidInput('');
        } else {
            alert(`Acesso Negado: ${res.error}`);
        }
    };

    const handleStopWork = async () => {
        if (!activeSessaoId) return;

        const res = await terminarSessaoTrabalho(activeSessaoId);
        if (res.success) {
            alert('Sessão Encerrada! O seu tempo foi registado.');
            setActiveSessaoId(null);
            setRfidInput('');
            setIsModalOpen(false); // Close modal on stop
        } else {
            alert(`Erro ao registar fim: ${res.error}`);
        }
    };

    const handleNavigateToQuality = () => {
        if (!selectedBarco) return;
        // In Fase 21 we pass data via query params so the Quality page knows the context
        router.push(`/operador/qualidade?op_id=${selectedBarco.id}&hin=${selectedBarco.hin}&nome=${selectedBarco.op_numero}`);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
            {/* TABLET HEADER */}
            <header className="bg-white border-b border-slate-200 shadow-sm p-4 sticky top-0 z-10 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 hover:bg-slate-100 rounded-full h-12 w-12 hidden md:flex">
                        <ChevronLeft size={28} className="text-slate-600" />
                    </Button>
                    <div className="flex items-center gap-2 md:hidden">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ChevronLeft size={24} className="text-slate-600" />
                        </Button>
                    </div>

                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                        <MonitorSmartphone className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">HMI Tablet Hub</h1>
                        <p className="text-sm text-slate-500 font-medium">Terminal de Gestão Visual</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
                    <div className="flex-1 md:w-64">
                        <SearchableSelect
                            options={estacoes.map(est => ({ value: est.id, label: est.nome_estacao }))}
                            value={selectedEstacaoId}
                            onChange={setSelectedEstacaoId}
                            placeholder="Selecione a sua Estação..."
                            className="h-12 text-lg font-bold border-2 border-slate-300"
                        />
                    </div>
                    {selectedEstacaoId && (
                        <Button variant="outline" size="icon" className="h-12 w-12 border-2 border-slate-300 rounded-xl" onClick={loadBarcos} disabled={isRefreshing}>
                            <RefreshCw className={`text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    )}
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                {!selectedEstacaoId ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400">
                        <Settings size={64} className="mb-4 opacity-20" />
                        <h2 className="text-2xl font-bold text-slate-500">Nenhuma Estação Selecionada</h2>
                        <p className="text-lg mt-2">Toque no menu de topo para afixar este Tablet a uma linha mecânica.</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex justify-center mt-20"><RefreshCw className="animate-spin text-blue-500" size={48} /></div>
                ) : barcos.length === 0 ? (
                    <div className="h-[50vh] flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 text-center max-w-2xl mx-auto">
                        <AlertCircle size={64} className="text-amber-500 mb-6" />
                        <h2 className="text-3xl font-extrabold text-slate-700">Linha Vazia</h2>
                        <p className="text-xl text-slate-500 mt-2">Não existem embarcações ativas pendentes nesta estação de trabalho.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {barcos.map(barco => (
                            <Card
                                key={barco.id}
                                className="group cursor-pointer border-2 hover:border-blue-500 hover:shadow-xl transition-all rounded-2xl overflow-hidden bg-white"
                                onClick={() => handleBarcoClick(barco)}
                            >
                                <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600 w-full" />
                                <CardHeader className="pb-2">
                                    <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-1">CÓDIGO HIN: {barco.hin}</p>
                                    <CardTitle className="text-3xl font-black text-slate-800 tracking-tight">{barco.op_numero}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mt-2">
                                        <p className="text-sm font-semibold text-slate-500 mb-1">MODELO EM CONSTRUÇÃO</p>
                                        <p className="text-lg font-bold text-slate-700 truncate">{barco.modelo}</p>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50 group-hover:bg-blue-50 transition-colors border-t border-slate-100 flex justify-end p-4">
                                    <span className="flex items-center font-bold text-blue-600">Ações <ChevronRight size={18} /></span>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* ACTION MODAL (Drawer for the Barco selected) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md md:max-w-2xl bg-white border-2 border-slate-200 shadow-2xl rounded-3xl p-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black tracking-tight">{selectedBarco?.op_numero}</DialogTitle>
                            <DialogDescription className="text-slate-300 text-lg mt-1">
                                {selectedBarco?.modelo} &mdash; HIN: {selectedBarco?.hin}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 md:p-8 flex flex-col gap-8">
                        {/* Seção 1: Produtividade (Operador Pica o Ponto da Tarefa) */}
                        <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 relative overflow-hidden">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Play size={20} className="text-emerald-500" /> Registar Tempos (Micro-OEE)
                            </h3>

                            {!activeSessaoId ? (
                                <div className="space-y-4">
                                    <Label className="text-sm font-semibold text-slate-600">PASSE O SEU CRACHÁ (RFID)</Label>
                                    <div className="flex gap-3">
                                        <Input
                                            value={rfidInput}
                                            onChange={(e) => setRfidInput(e.target.value)}
                                            placeholder="Ex: TAG-101..."
                                            className="h-14 text-lg font-mono border-2 border-slate-300 focus-visible:ring-indigo-500"
                                            autoFocus
                                        />
                                        <Button
                                            size="lg"
                                            className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wide rounded-xl"
                                            onClick={handleStartWork}
                                        >
                                            INICIAR
                                        </Button>
                                    </div>
                                    <p className="text-xs text-slate-500">O relógio de fabrico começará a contar no seu perfil associado a este casco.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <div className="flex items-center gap-3 text-emerald-700 font-bold text-xl mb-4 animate-pulse">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500"></div> SESSÃO ATIVA (EM CURSO)
                                    </div>
                                    <Button
                                        size="lg"
                                        variant="destructive"
                                        className="h-16 w-full max-w-sm font-black text-xl rounded-xl shadow-lg shadow-red-500/20"
                                        onClick={handleStopWork}
                                    >
                                        <Square className="mr-2" size={24} /> CONCLUIR E PARAR TEMPO
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Seção 2: Qualidade (Tablet PDFs) */}
                        <div className="border border-indigo-100 rounded-2xl p-6 bg-indigo-50/50">
                            <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                <ClipboardCheck size={20} className="text-indigo-600" /> Auditoria e Checklists
                            </h3>
                            <p className="text-sm text-indigo-700 mb-6">Preencha controlos técnicos e gere instantaneamente um Boletim PDF Oficial para este barco.</p>

                            <Button
                                size="lg"
                                className="w-full h-16 bg-white text-indigo-700 hover:bg-indigo-100 border-2 border-indigo-200 font-extrabold text-lg rounded-xl shadow-sm"
                                onClick={handleNavigateToQuality}
                            >
                                <ClipboardCheck className="mr-2" size={24} /> ACEDER AO PORTAL QA
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}

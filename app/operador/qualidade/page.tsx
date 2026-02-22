'use client';

import React, { useState } from 'react';
import { ScanLine, Box, ArrowLeft, ClipboardCheck, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { buscarBarcoPorRFID, buscarFormulariosDisponiveis, submeterChecklist } from './actions';
import { FormTemplate } from '../../admin/qualidade/templates/actions';
import { DynamicFormRenderer } from './components/DynamicFormRenderer';

export default function OperadorQualidadePage() {
    // Fase 1: Identificação
    const [operadorRfid, setOperadorRfid] = useState('');
    const [barcoRfid, setBarcoRfid] = useState('');
    const [identificado, setIdentificado] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(false);
    const [barcoId, setBarcoId] = useState('');
    const [barcoNome, setBarcoNome] = useState('');

    // Fase 2: Seleção de Formulário e Preenchimento
    const [templates, setTemplates] = useState<FormTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    const handleIdentificacao = async () => {
        if (!operadorRfid.trim() || !barcoRfid.trim()) {
            alert("Passe ambos os cartões RFID (Operador e Barco) para prosseguir.");
            return;
        }

        setLoadingAuth(true);
        const res = await buscarBarcoPorRFID(barcoRfid);

        if (res.success && res.ordemProducao) {
            setBarcoId(res.ordemProducao.id);
            setBarcoNome(`[#${res.ordemProducao.numero}] ${res.ordemProducao.modelo}`);
            setIdentificado(true);
            carregarFormularios();
        } else {
            alert(`Erro na leitura do Barco: ${res.error}`);
        }
        setLoadingAuth(false);
    };

    const carregarFormularios = async () => {
        setLoadingTemplates(true);
        const res = await buscarFormulariosDisponiveis();
        if (res.success && res.templates) {
            setTemplates(res.templates);
        }
        setLoadingTemplates(false);
    };

    const handleSubmeter = async (respostas: Record<string, unknown>) => {
        if (!selectedTemplate) return;

        setLoadingAuth(true); // Re-uso do estado visual de loading
        const res = await submeterChecklist({
            formulario_id: selectedTemplate.id,
            ordem_producao_id: barcoId,
            operador_rfid: operadorRfid,
            respostas_json: respostas
        });

        if (res.success) {
            alert("✓ Checklist Submetida com Sucesso!\nGamificação: Ganhou +4 Pontos na sua Avaliação Diária.");
            setSelectedTemplate(null); // Volta à lista
        } else {
            alert(`Falha ao submeter: ${res.error}`);
        }
        setLoadingAuth(false);
    };


    // ==========================================
    // RENDERIZAÇÃO CONDICIONAL POR FASES
    // ==========================================

    if (!identificado) {
        return (
            <div className="min-h-screen bg-slate-950 text-white font-sans p-4 sm:p-8 flex flex-col items-center justify-center dashboard-layout relative z-20 overflow-hidden">
                <main className="w-full max-w-lg glass-panel p-8 md:p-12 animate-fade-in relative z-20 origin-center scale-95 md:scale-100 shadow-[0_0_60px_rgba(0,0,0,0.8)] border-slate-700/50">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-2xl"></div>
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-2xl mb-4 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                            <ClipboardCheck size={48} className="text-blue-400" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Portal de Qualidade</h1>
                        <p className="text-slate-400 text-sm md:text-base">Identifique-se e ao Casco/Molde alvo da auditoria.</p>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="form-group relative">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 mb-2 block flex items-center gap-2">
                                <ScanLine size={14} className="text-blue-400" /> Crachá do Inspetor (RFID)
                            </label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-4 text-lg font-mono tracking-widest text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                placeholder="PICAR CRACHÁ..."
                                value={operadorRfid}
                                onChange={(e) => setOperadorRfid(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="form-group relative">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 mb-2 block flex items-center gap-2">
                                <Box size={14} className="text-indigo-400" /> Tag do Barco (Molde)
                            </label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-4 text-lg font-mono tracking-widest text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                                placeholder="PICAR BARCO..."
                                value={barcoRfid}
                                onChange={(e) => setBarcoRfid(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleIdentificacao}
                            disabled={loadingAuth || !operadorRfid || !barcoRfid}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transform hover:-translate-y-1 active:translate-y-0"
                        >
                            {loadingAuth ? <Loader2 className="animate-spin mx-auto" /> : 'ACEDER ÀS CHECKLISTS'}
                        </button>

                        <div className="text-center mt-4">
                            <Link href="/operador" className="text-xs text-slate-500 hover:text-white transition-colors">Voltar ao M.E.S de Produção</Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // ==========================================
    // FASE 3: PREENCHIMENTO DO FORMULÁRIO (RENDERER)
    // ==========================================
    if (selectedTemplate) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200 p-4 sm:p-8 relative z-20">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => setSelectedTemplate(null)} className="text-blue-400 hover:text-white mb-6 flex items-center gap-2 font-bold transition-colors">
                        <ArrowLeft size={18} /> Voltar aos Formulários
                    </button>

                    <div className="glass-panel p-6 md:p-10 border-blue-500/20">
                        <div className="mb-8 border-b border-white/10 pb-6">
                            <h2 className="text-3xl font-bold text-white mb-2">{selectedTemplate.nome_formulario}</h2>
                            <p className="text-slate-400">{selectedTemplate.descricao || 'Preencha todos os campos obrigatórios com rigor.'}</p>

                            <div className="mt-4 flex gap-3 text-xs font-mono font-bold bg-black/30 p-3 rounded-lg inline-flex">
                                <span className="text-blue-400">OP: {barcoNome}</span>
                                <span className="opacity-50">|</span>
                                <span className="text-emerald-400">INSPETOR: {operadorRfid}</span>
                            </div>
                        </div>

                        {/* MOTOR DE RENDERIZAÇÃO */}
                        <DynamicFormRenderer
                            template={selectedTemplate}
                            onSubmit={handleSubmeter}
                            isSubmitting={loadingAuth}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // FASE 2: LISTAGEM DE FORMULÁRIOS
    // ==========================================
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 sm:p-8 relative z-20">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
                            <ClipboardCheck className="text-blue-500" /> Central de Qualidade
                        </h1>
                        <p className="text-slate-400 mt-1">Selecione o impresso adequado para a Ordem de Produção ativa.</p>
                    </div>
                    <div className="bg-blue-900/30 border border-blue-500/30 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        <Box size={16} className="text-blue-400" /> {barcoNome}
                    </div>
                </div>

                {loadingTemplates ? (
                    <div className="flex justify-center items-center py-20 opacity-50">
                        <Loader2 size={48} className="animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map(tmpl => (
                            <button
                                key={tmpl.id}
                                onClick={() => setSelectedTemplate(tmpl)}
                                className="glass-panel p-6 text-left hover:border-blue-500 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(37,99,235,0.1)] group flex flex-col"
                            >
                                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl inline-flex mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                                    <ClipboardCheck size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{tmpl.nome_formulario}</h3>
                                <p className="text-sm text-slate-400 line-clamp-3 mb-6 flex-1">
                                    {tmpl.descricao || 'Formulário padrão de auditoria fabril. Toque para iniciar o preenchimento.'}
                                </p>
                                <div className="text-xs font-bold text-blue-500 uppercase tracking-wider group-hover:text-blue-400 flex items-center gap-1">
                                    Iniciar Preenchimento <ArrowLeft size={14} className="rotate-180" />
                                </div>
                            </button>
                        ))}

                        {templates.length === 0 && (
                            <div className="col-span-full border border-dashed border-white/10 bg-white/5 rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                                <AlertCircle size={40} className="opacity-50" />
                                Não existem Checklists ativas no sistema de momento.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

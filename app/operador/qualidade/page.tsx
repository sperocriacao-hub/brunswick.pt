'use client';

import React, { useState, Suspense } from 'react';
import { ScanLine, Box, ArrowLeft, ClipboardCheck, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buscarBarcoPorRFID, buscarFormulariosDisponiveis, submeterChecklist } from './actions';
import { FormTemplate } from '../../admin/qualidade/templates/actions';
import { DynamicFormRenderer } from './components/DynamicFormRenderer';

function QualidadeInner() {
    const searchParams = useSearchParams();

    // Ler Parâmetros enviados pelo Tablet Hub (Fase 21)
    const urlOpId = searchParams.get('op_id') || '';
    const urlHin = searchParams.get('hin') || '';
    const urlOpNome = searchParams.get('nome') || '';

    // Fase 1: Identificação
    const [operadorRfid, setOperadorRfid] = useState('');
    const [barcoRfid, setBarcoRfid] = useState(urlHin);
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

    const gerarPdfChecklist = (respostas: Record<string, unknown>, nomeFormulario: string) => {
        try {
            const doc = new jsPDF();

            // Cabeçalho da Empresa
            doc.setFillColor(30, 64, 175); // bg-blue-800
            doc.rect(0, 0, 210, 30, 'F');
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('Brunswick Marine - Quality Assurance', 14, 20);

            // Título do Relatório
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(18);
            doc.text('Certificado de Auditoria Fabril', 14, 45);

            // Metadados
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`Ordem de Produção: ${barcoNome}`, 14, 55);
            doc.text(`Referência (HIN): ${barcoRfid}`, 14, 62);
            doc.text(`Operador / Inspetor: ${operadorRfid}`, 14, 69);
            doc.text(`Formulário: ${nomeFormulario}`, 14, 76);
            doc.text(`Data de Emissão: ${new Date().toLocaleString('pt-PT')}`, 14, 83);

            // Linha Separadora
            doc.setDrawColor(200, 200, 200);
            doc.line(14, 88, 196, 88);

            // Preparar Dados da Tabela
            const tableData = Object.entries(respostas).map(([chave, valor]) => {
                let displayValue = String(valor);
                if (typeof valor === 'boolean') displayValue = valor ? 'Sim / Conforme' : 'Não / Desvio';
                if (Array.isArray(valor)) displayValue = valor.join(', ');
                return [chave.replace(/_/g, ' ').toUpperCase(), displayValue];
            });

            // Gerar Tabela
            autoTable(doc, {
                startY: 95,
                head: [['Critério Auditado', 'Resultado / Resposta']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 5 },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: {
                    0: { cellWidth: 100, fontStyle: 'bold' },
                    1: { cellWidth: 'auto' }
                }
            });

            // Rodapé com Assinatura Digital Simbólica
            const finalY = (doc as any).lastAutoTable.finalY || 150;
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            const signatureText = `Documento Assinado Eletronicamente por RFID: ${operadorRfid}`;
            doc.text(signatureText, 14, finalY + 20);
            doc.text('Sistema Shopfloor Brunswick.pt - Documento Interno e Confidencial', 14, 285);

            // Gravar PDF
            const fileName = `QA_${barcoRfid}_${new Date().getTime()}.pdf`;
            doc.save(fileName);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('A Checklist foi submetida, mas houve um erro ao desenhar o PDF.');
        }
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
            gerarPdfChecklist(respostas, selectedTemplate.nome_formulario);
            alert("✓ Checklist Submetida com Sucesso!\nGamificação: Ganhou +4 Pontos na sua Avaliação Diária.\n\nO Download do PDF Oficial começou automaticamente.");
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
            <div className="min-h-screen bg-slate-100 text-slate-800 font-sans p-4 sm:p-8 flex flex-col items-center justify-center relative z-20 overflow-hidden">
                <main className="w-full max-w-lg bg-white p-8 md:p-12 border-2 border-slate-200 rounded-3xl shadow-xl relative z-20">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-3xl"></div>

                    <div className="flex justify-between items-center mb-8">
                        <Link href="/operador" className="text-slate-500 hover:text-blue-600 flex items-center gap-2 font-bold px-3 py-2 bg-slate-100 rounded-lg hover:bg-blue-50 transition-colors">
                            <ArrowLeft size={18} /> Voltar
                        </Link>
                    </div>

                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-xl mb-4 text-blue-600">
                            <ClipboardCheck size={40} />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-slate-800">Tablet Qualidade</h1>
                        <p className="text-slate-500 font-medium whitespace-pre-line text-sm">
                            {urlOpNome ? `Embarcação Selecionada: ${urlOpNome}\nConfirme passando o seu Crachá.` : 'Confirme o barco e passe o seu Crachá.'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="form-group relative">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1 mb-2 block flex items-center gap-2">
                                <ScanLine size={14} className="text-blue-600" /> Visto do Inspetor (RFID)
                            </label>
                            <input
                                type="text"
                                className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-4 text-lg font-mono tracking-widest text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                placeholder="Pique o Crachá..."
                                value={operadorRfid}
                                onChange={(e) => setOperadorRfid(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="form-group relative">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1 mb-2 block flex items-center gap-2">
                                <Box size={14} className="text-indigo-600" /> Referência HIN do Casco
                            </label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-4 text-lg font-mono tracking-widest text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                                placeholder="PICAR BARCO..."
                                value={barcoRfid}
                                onChange={(e) => setBarcoRfid(e.target.value)}
                                disabled={!!urlHin} // Se veio pelo Tablet, fica bloqueado e confirmado
                            />
                        </div>

                        <button
                            onClick={handleIdentificacao}
                            disabled={loadingAuth || !operadorRfid || !barcoRfid}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 text-lg tracking-wide"
                        >
                            {loadingAuth ? <Loader2 className="animate-spin mx-auto" /> : 'ACEDER ÀS CHECKLISTS'}
                        </button>
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
            <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8 relative z-20">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => setSelectedTemplate(null)} className="text-blue-600 hover:text-blue-800 mb-6 flex items-center gap-2 font-bold transition-colors">
                        <ArrowLeft size={18} /> Voltar aos Formulários
                    </button>

                    <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-xl">
                        <div className="mb-8 border-b border-slate-200 pb-6">
                            <h2 className="text-3xl font-extrabold text-slate-800 mb-2">{selectedTemplate.nome_formulario}</h2>
                            <p className="text-slate-500">{selectedTemplate.descricao || 'Preencha todos os campos obrigatórios com rigor.'}</p>

                            <div className="mt-4 flex gap-3 text-xs font-mono font-bold bg-slate-100 p-3 rounded-xl inline-flex shadow-inner">
                                <span className="text-blue-700">OP: {barcoNome}</span>
                                <span className="opacity-30 text-slate-500">|</span>
                                <span className="text-emerald-600">INSPETOR: {operadorRfid}</span>
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
        <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8 relative z-20">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                            <ClipboardCheck className="text-blue-600" /> Central de Qualidade
                        </h1>
                        <p className="text-slate-500 mt-1">Selecione o impresso adequado para a Ordem de Produção ativa.</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 text-blue-800 shadow-sm">
                        <Box size={16} className="text-blue-600" /> {barcoNome}
                    </div>
                </div>

                {loadingTemplates ? (
                    <div className="flex justify-center items-center py-20 opacity-50">
                        <Loader2 size={48} className="animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map(tmpl => (
                            <button
                                key={tmpl.id}
                                onClick={() => setSelectedTemplate(tmpl)}
                                className="bg-white border-2 border-slate-200 rounded-3xl p-6 text-left hover:border-blue-500 transition-all hover:-translate-y-1 hover:shadow-xl group flex flex-col"
                            >
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl inline-flex mb-4 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                                    <ClipboardCheck size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">{tmpl.nome_formulario}</h3>
                                <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-1">
                                    {tmpl.descricao || 'Formulário padrão de auditoria fabril. Toque para iniciar o preenchimento.'}
                                </p>
                                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider group-hover:text-blue-700 flex items-center gap-1">
                                    Iniciar Preenchimento <ArrowLeft size={14} className="rotate-180" />
                                </div>
                            </button>
                        ))}

                        {templates.length === 0 && (
                            <div className="col-span-full border-2 border-dashed border-slate-300 bg-white rounded-3xl p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                                <AlertCircle size={40} className="text-slate-400" />
                                Não existem Checklists ativas no sistema de momento.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function OperadorQualidadePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>}>
            <QualidadeInner />
        </Suspense>
    );
}

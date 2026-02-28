"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, FileText, Settings, X, Upload, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { atualizarModeloCompleto, EditarModeloInput, fetchModeloParaEdicao } from './actions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Tipagem base

type Tarefa = {
    id: string;
    ordem: string;
    descricao: string;
    estacao_id: string;
    imagem_url: string;
}

type Opcional = {
    id: string;
    nome_opcao: string;
    descricao_opcao: string;
    tarefas: Tarefa[];
}

// Simulamos as estações do Shopfloor, no futuro virão da BD
const ESTACOES = [
    { id: 'est-1', nome: '1. Laminação Casco' },
    { id: 'est-2', nome: '2. Laminação Coberta' },
    { id: 'est-3', nome: '3. Montagem Estrutural' },
    { id: 'est-4', nome: '4. Instalação Elétrica' },
    { id: 'est-5', nome: '5. Acabamento Final' }
];

export default function EditarModeloPage() {
    const router = useRouter();
    const params = useParams();
    const modeloId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [nomeModelo, setNomeModelo] = useState('');
    const [modelYear, setModelYear] = useState('');
    const [status, setStatus] = useState('Em Desenvolvimento');
    const [partes, setPartes] = useState<any[]>([]); // Keep it defined to avoid errors on addParte although it's removed from UI
    const [tarefasGerais, setTarefasGerais] = useState<Tarefa[]>([]);
    const [opcionais, setOpcionais] = useState<Opcional[]>([]);

    useEffect(() => {
        if (!modeloId) return;
        async function load() {
            setIsLoading(true);
            const res = await fetchModeloParaEdicao(modeloId);
            if (res.success && res.data) {
                setNomeModelo(res.data.nome_modelo || '');
                setModelYear(res.data.model_year || '');
                setStatus(res.data.status || 'Em Desenvolvimento');
                setTarefasGerais(res.data.tarefasGerais as unknown as Tarefa[] || []);
                setOpcionais(res.data.opcionais as unknown as Opcional[] || []);
            } else {
                alert("Erro ao carregar dados do Molde.");
            }
            setIsLoading(false);
        }
        load();
    }, [modeloId]);

    // Estado do Modal de Opcional
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentOpcional, setCurrentOpcional] = useState<Opcional | null>(null);

    // Handlers Tarefas Gerais
    const addTarefaGeral = () => {
        setTarefasGerais([...tarefasGerais, { id: crypto.randomUUID(), ordem: '', descricao: '', estacao_id: '', imagem_url: '' }]);
    };
    const updateTarefaGeral = (id: string, field: keyof Tarefa, value: string) => {
        setTarefasGerais(tarefasGerais.map(t => t.id === id ? { ...t, [field]: value } : t));
    };
    const removeTarefaGeral = (id: string) => setTarefasGerais(tarefasGerais.filter(t => t.id !== id));

    // Handlers Opcional (Modal)
    const openNewOpcionalModal = () => {
        setCurrentOpcional({ id: crypto.randomUUID(), nome_opcao: '', descricao_opcao: '', tarefas: [] });
        setIsModalOpen(true);
    };
    const editOpcional = (opcional: Opcional) => {
        setCurrentOpcional({ ...opcional }); // Copy to edit safely
        setIsModalOpen(true);
    };
    const removeOpcional = (id: string) => setOpcionais(opcionais.filter(o => o.id !== id));
    const saveCurrentOpcional = () => {
        if (currentOpcional) {
            const exists = opcionais.find(o => o.id === currentOpcional.id);
            if (exists) {
                setOpcionais(opcionais.map(o => o.id === currentOpcional.id ? currentOpcional : o));
            } else {
                setOpcionais([...opcionais, currentOpcional]);
            }
        }
        setIsModalOpen(false);
        setCurrentOpcional(null);
    };

    const addTarefaToOpcional = () => {
        if (currentOpcional) {
            setCurrentOpcional({
                ...currentOpcional,
                tarefas: [...currentOpcional.tarefas, { id: crypto.randomUUID(), ordem: '', descricao: '', estacao_id: '', imagem_url: '' }]
            });
        }
    };
    const updateTarefaOpcional = (id: string, field: keyof Tarefa, value: string) => {
        if (currentOpcional) {
            setCurrentOpcional({
                ...currentOpcional,
                tarefas: currentOpcional.tarefas.map(t => t.id === id ? { ...t, [field]: value } : t)
            });
        }
    };
    const removeTarefaOpcional = (id: string) => {
        if (currentOpcional) {
            setCurrentOpcional({
                ...currentOpcional,
                tarefas: currentOpcional.tarefas.filter(t => t.id !== id)
            });
        }
    };

    // ==============================================
    // HANDLER DE UPLOAD REAL PARA SUPABASE STORAGE
    // ==============================================
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, tarefaId: string, contextoId: 'geral' | 'opcional') => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        // Colocar visual provisório para animar o user
        if (contextoId === 'geral') {
            updateTarefaGeral(tarefaId, 'imagem_url', 'A carregar... ⏳');
        } else {
            updateTarefaOpcional(tarefaId, 'imagem_url', 'A carregar... ⏳');
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('modelContext', nomeModelo ? nomeModelo.replace(/[^a-zA-Z0-9]/g, '_') : 'novo_modelo');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Falha no upload de anexo');
            }

            // Upload com sucesso: Guarda a URL Pública definitiva + O Nome Original concatenado?  
            // Vamos preservar apenas a URL para o visual da lista:
            if (contextoId === 'geral') {
                updateTarefaGeral(tarefaId, 'imagem_url', data.url);
            } else {
                updateTarefaOpcional(tarefaId, 'imagem_url', data.url);
            }
            alert("Imagem carregada e ancorada à Tarefa com Sucesso na Nuvem!");

        } catch (error) {
            console.error('Upload Error:', error);
            alert((error as Error).message || "Falha a comunicar com servidor. Verifique se o Bucket existe no Supabase.");
            // Reverter estado visual do err
            if (contextoId === 'geral') updateTarefaGeral(tarefaId, 'imagem_url', 'Erro ❌');
            else updateTarefaOpcional(tarefaId, 'imagem_url', 'Erro ❌');
        } finally {
            setIsUploading(false);
        }
    };

    // ==============================================
    // HANDLER GUARDAR MODELO COMPLETO
    // ==============================================
    const handleSaveModelo = async () => {
        if (!nomeModelo || !modelYear) {
            alert('Por favor, preencha o Nome do Modelo e o Ano do Modelo (Model Year).');
            return;
        }

        setIsSaving(true);
        try {
            const input: EditarModeloInput = {
                id: modeloId,
                nome_modelo: nomeModelo,
                model_year: modelYear,
                status: status,
                tarefasGerais: tarefasGerais,
                opcionais: opcionais
            };

            const res = await atualizarModeloCompleto(input);
            if (!res.success) {
                throw new Error(res.error);
            }

            alert('Modelo de Embarcação registado na Base de Dados com todas as dependências M.E.S!');
            router.push('/admin/modelos');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert(`Falha Crítica: ${(error as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // ==============================================
    // GERAR PDF (Checklist por Estação)
    // ==============================================
    const generateChecklistPDF = () => {
        const doc = new jsPDF();
        const titulo = nomeModelo || 'Modelo Desconhecido';

        // Agrupar TODAS as tarefas por estação
        const tarefasPorEstacao: Record<string, { tipo: string, tarefa: Tarefa }[]> = {};

        // Iniciamos com as estações conhecidas para garantir que a ordem é lógica
        ESTACOES.forEach(est => tarefasPorEstacao[est.id] = []);

        // Adiciona Gerais
        tarefasGerais.forEach(t => {
            if (t.estacao_id) {
                if (!tarefasPorEstacao[t.estacao_id]) tarefasPorEstacao[t.estacao_id] = [];
                tarefasPorEstacao[t.estacao_id].push({ tipo: 'Geral', tarefa: t });
            }
        });

        // Adiciona Opcionais
        opcionais.forEach(op => {
            op.tarefas.forEach(t => {
                if (t.estacao_id) {
                    if (!tarefasPorEstacao[t.estacao_id]) tarefasPorEstacao[t.estacao_id] = [];
                    tarefasPorEstacao[t.estacao_id].push({ tipo: `Opcional: ${op.nome_opcao}`, tarefa: t });
                }
            });
        });

        let isFirstPage = true;

        Object.keys(tarefasPorEstacao).forEach((estacaoId) => {
            const tarefasDestaEstacao = tarefasPorEstacao[estacaoId];
            // Ignorar páginas de estações sem tarefas
            if (tarefasDestaEstacao.length === 0) return;

            if (!isFirstPage) {
                doc.addPage();
            }
            isFirstPage = false;

            const nomeDaEstacao = ESTACOES.find(e => e.id === estacaoId)?.nome || estacaoId;

            // Header Premium do Relatório
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, 210, 30, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(`CHECKLIST DE FABRICAÇÃO: ${titulo.toUpperCase()} (${modelYear})`, 105, 18, { align: "center" });

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.text(`Estação: ${nomeDaEstacao}`, 14, 45);

            // Preparar os dados para a tabela
            // O AutoTable precisa de dados em Array de arrays para as linhas
            const tableData = tarefasDestaEstacao.map(item => [
                item.tarefa.ordem,
                item.tipo,
                item.tarefa.descricao,
                "   [   ]   " // Espaço para visto
            ]);

            autoTable(doc, {
                startY: 55,
                head: [['Ordem', 'Tipo', 'Descrição da Tarefa', 'Visto']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] }, // Azul primário do sistema
                styles: { fontSize: 10, cellPadding: 5 },
                columnStyles: {
                    0: { cellWidth: 20, halign: 'center' },
                    1: { cellWidth: 40 },
                    2: { cellWidth: 'auto' },
                    3: { cellWidth: 30, halign: 'center' }
                }
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const finalY = (doc as any).lastAutoTable.finalY + 15;

            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.text("Assinatura do Operador (RFID Responsável): ___________________________", 14, finalY);
            doc.text("Data e Hora Fim: ____/____/______  ____:____", 14, finalY + 10);

        });

        if (isFirstPage) {
            alert("Não existem tarefas configuradas para nenhuma estação. Relatório Vazio.");
            return;
        }

        // Grava o PDF
        doc.save(`Checklist_${titulo}_${modelYear}.pdf`);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20 opacity-50">
                <Loader2 size={48} className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mt-8 animate-fade-in dashboard-layout" style={{ display: 'block' }}>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="brand-title" style={{ marginBottom: 0 }}>Editar Produto</h1>
                    <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "0.25rem" }}>Atualizar catálogo do modelo de embarcação.</p>
                </div>
                <div className="flex gap-4">
                    <button className="btn btn-outline" onClick={generateChecklistPDF}>
                        <FileText size={18} className="mr-2" style={{ marginRight: '8px' }} />
                        Relatório Checklist (PDF)
                    </button>
                    <button className="btn btn-primary animate-pulse-glow" onClick={handleSaveModelo} disabled={isSaving}>
                        {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                        {isSaving ? "A Guardar BD..." : "Salvar Alterações"}
                    </button>
                </div>
            </header>

            {/* SECCTAO 1: DADOS BASE DO MODELO */}
            <section className="glass-panel p-6 mb-8">
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>Dados do Modelo</h2>
                <div className="grid grid-cols-2 gap-6">
                    <div className="form-group">
                        <label className="form-label">Nome do Modelo</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Ex: Brunswick 320 VIP"
                            value={nomeModelo} onChange={(e) => setNomeModelo(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Model Year</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Ex: 2026"
                            value={modelYear} onChange={(e) => setModelYear(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 mt-6">
                    <div className="form-group" style={{ maxWidth: '300px' }}>
                        <label className="form-label">Estado do Catálogo</label>
                        <select
                            className="form-control"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="Em Desenvolvimento">Em Desenvolvimento</option>
                            <option value="Ativo">Ativo (Produção)</option>
                            <option value="Obsoleto">Obsoleto / Inativo</option>
                            <option value="Descontinuado">Descontinuado</option>
                        </select>
                    </div>
                </div>
            </section>



            {/* SECCTAO 3: TAREFAS GERAIS (Roteiro) */}
            <section className="glass-panel p-6 mb-8 animate-delay-2">
                <div className="flex justify-between items-center mb-6">
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>Tarefas de Produção Comuns (Geral)</h2>
                    <button className="btn btn-outline" onClick={addTarefaGeral}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Nova Tarefa
                    </button>
                </div>

                <div className="table-container">
                    <table className="table-premium">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Ordem</th>
                                <th>Descrição da Tarefa</th>
                                <th>Estação Alvo</th>
                                <th style={{ textAlign: 'center' }}>Imagem Instrução</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tarefasGerais.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>As tarefas gerais base darão corpo ao Roteiro por defeito.</td>
                                </tr>
                            )}
                            {tarefasGerais.map(tarefa => (
                                <tr key={tarefa.id}>
                                    <td>
                                        <input type="number" className="form-control" placeholder="Nº" value={tarefa.ordem} onChange={e => updateTarefaGeral(tarefa.id, 'ordem', e.target.value)} />
                                    </td>
                                    <td>
                                        <input type="text" className="form-control" placeholder="Instrução exata para o operador..." value={tarefa.descricao} onChange={e => updateTarefaGeral(tarefa.id, 'descricao', e.target.value)} />
                                    </td>
                                    <td>
                                        <select className="form-control" value={tarefa.estacao_id} onChange={e => updateTarefaGeral(tarefa.id, 'estacao_id', e.target.value)}>
                                            <option value="">-- Estação --</option>
                                            {ESTACOES.map(est => (
                                                <option key={est.id} value={est.id}>{est.nome}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <label className="btn-icon" style={{ cursor: isUploading ? 'wait' : 'pointer', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }} title="Anexar Imagem ou PDF">
                                            <input type="file" style={{ display: 'none' }} accept="image/*,.pdf" disabled={isUploading} onChange={(e) => handleFileUpload(e, tarefa.id, 'geral')} />
                                            <Upload size={18} color={tarefa.imagem_url ? 'var(--secondary)' : 'currentColor'} />
                                            {tarefa.imagem_url && <span style={{ fontSize: '0.65rem', color: tarefa.imagem_url.includes('Erro') ? 'var(--danger)' : 'var(--secondary)', marginTop: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tarefa.imagem_url}>{tarefa.imagem_url.startsWith('http') ? 'Anexado ✅' : tarefa.imagem_url}</span>}
                                        </label>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn-icon danger" onClick={() => removeTarefaGeral(tarefa.id)}><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* SECCTAO 4: OPCIONAIS (EXTRAS) */}
            <section className="glass-panel p-6 mb-8 animate-delay-3">
                <div className="flex justify-between items-center mb-6">
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>Opcionais do Modelo</h2>
                    <button className="btn btn-primary" onClick={openNewOpcionalModal} style={{ background: 'var(--accent)' }}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Novo Opcional
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {opcionais.length === 0 && (
                        <div style={{ gridColumn: 'span 3', textAlign: 'center', opacity: 0.5, padding: '2rem' }}>
                            Sem opcionais específicos configurados. (Ex: Ar Condicionado, Upgrade Estofos)
                        </div>
                    )}
                    {opcionais.map(op => (
                        <div key={op.id} className="glass-panel p-4" style={{ cursor: 'pointer' }} onClick={() => editOpcional(op)}>
                            <div className="flex justify-between items-start mb-2">
                                <h3 style={{ fontSize: '1.1rem' }}>{op.nome_opcao || 'Opcional Sem Nome'}</h3>
                                <Settings size={18} opacity={0.5} />
                            </div>
                            <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1rem' }}>{op.descricao_opcao || 'Sem descrição'}</p>
                            <div className="flex gap-2 mb-4">
                                <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                    {op.tarefas.length} Tarefa(s) atreladas
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>


            {/* // ========================================== */}
            {/* // MODAL OPCIONAL */}
            {/* // ========================================== */}
            {isModalOpen && currentOpcional && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2>{currentOpcional.nome_opcao ? 'Editar Opcional' : 'Novo Opcional'}</h2>
                            <button className="btn-icon" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="form-group">
                                <label className="form-label">Nome da Opção</label>
                                <input type="text" className="form-control" value={currentOpcional.nome_opcao} onChange={e => setCurrentOpcional({ ...currentOpcional, nome_opcao: e.target.value })} placeholder="Ex: GPS Premium" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descrição Pública</label>
                                <input type="text" className="form-control" value={currentOpcional.descricao_opcao} onChange={e => setCurrentOpcional({ ...currentOpcional, descricao_opcao: e.target.value })} />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-4 mt-8">
                            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>Tarefas para construir este Opcional</h3>
                            <button className="btn btn-outline" onClick={addTarefaToOpcional} style={{ padding: '0.4rem 0.8rem' }}>
                                <Plus size={16} style={{ marginRight: '6px' }} /> Inserir Tarefa
                            </button>
                        </div>

                        <div className="table-container mb-8">
                            <table className="table-premium" style={{ tableLayout: 'fixed' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px' }}>Ord</th>
                                        <th>Instrução Exata</th>
                                        <th style={{ width: '150px' }}>Estação</th>
                                        <th style={{ width: '80px', textAlign: 'center' }}>Anexo</th>
                                        <th style={{ width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentOpcional.tarefas.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', opacity: 0.5 }}>Adiciona a primeira tarefa técnica deste opcional.</td></tr>}
                                    {currentOpcional.tarefas.map(tarefa => (
                                        <tr key={tarefa.id}>
                                            <td><input type="number" className="form-control" value={tarefa.ordem} onChange={e => updateTarefaOpcional(tarefa.id, 'ordem', e.target.value)} style={{ padding: '0.5rem' }} /></td>
                                            <td><input type="text" className="form-control" value={tarefa.descricao} placeholder="O que o operador 1 tem de fazer?" onChange={e => updateTarefaOpcional(tarefa.id, 'descricao', e.target.value)} style={{ padding: '0.5rem' }} /></td>
                                            <td>
                                                <select className="form-control" value={tarefa.estacao_id} onChange={e => updateTarefaOpcional(tarefa.id, 'estacao_id', e.target.value)} style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                                                    <option value="">A Carga De...</option>
                                                    {ESTACOES.map(est => <option key={est.id} value={est.id}>{est.nome}</option>)}
                                                </select>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <label className="btn-icon" style={{ cursor: isUploading ? 'wait' : 'pointer', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }} title="Anexar Imagem ou PDF">
                                                    <input type="file" style={{ display: 'none' }} accept="image/*,.pdf" disabled={isUploading} onChange={(e) => handleFileUpload(e, tarefa.id, 'opcional')} />
                                                    <Upload size={16} color={tarefa.imagem_url ? 'var(--secondary)' : 'currentColor'} />
                                                    {tarefa.imagem_url && <span style={{ fontSize: '0.65rem', color: tarefa.imagem_url.includes('Erro') ? 'var(--danger)' : 'var(--secondary)', marginTop: '2px', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tarefa.imagem_url}>{tarefa.imagem_url.startsWith('http') ? 'Anexado ✅' : tarefa.imagem_url}</span>}
                                                </label>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn-icon danger" onClick={() => removeTarefaOpcional(tarefa.id)}><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-4 border-t border-[var(--border)] pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                            <button className="btn btn-outline" onClick={() => { removeOpcional(currentOpcional.id); setIsModalOpen(false); }} style={{ color: 'var(--danger)' }}>Excluir Opcional</button>
                            <button className="btn btn-primary" onClick={saveCurrentOpcional}>Guardar na Lista</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import React, { useState } from 'react';
import { Plus, Trash2, Save, FileText, Settings, X, Upload } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Tipagem base
type Parte = {
    id: string;
    nome_parte: string;
    categoria: 'Big' | 'Medium' | 'Small' | '';
    tag_rfid_molde: string;
}

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

export default function NovoModeloPage() {
    const [nomeModelo, setNomeModelo] = useState('');
    const [modelYear, setModelYear] = useState('');

    const [partes, setPartes] = useState<Parte[]>([]);
    const [tarefasGerais, setTarefasGerais] = useState<Tarefa[]>([]);
    const [opcionais, setOpcionais] = useState<Opcional[]>([]);

    // Estado do Modal de Opcional
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentOpcional, setCurrentOpcional] = useState<Opcional | null>(null);

    // Handlers Composição
    const addParte = () => {
        setPartes([...partes, { id: crypto.randomUUID(), nome_parte: '', categoria: '', tag_rfid_molde: '' }]);
    };
    const updateParte = (id: string, field: keyof Parte, value: string) => {
        setPartes(partes.map(p => p.id === id ? { ...p, [field]: value } : p));
    };
    const removeParte = (id: string) => setPartes(partes.filter(p => p.id !== id));

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

    return (
        <div className="container mt-8 animate-fade-in dashboard-layout" style={{ display: 'block' }}>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="brand-title" style={{ marginBottom: 0 }}>Cadastro de Produto</h1>
                    <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "0.25rem" }}>Crie um novo Modelo, Partes, Roteiros e Opcionais.</p>
                </div>
                <div className="flex gap-4">
                    <button className="btn btn-outline" onClick={generateChecklistPDF}>
                        <FileText size={18} className="mr-2" style={{ marginRight: '8px' }} />
                        Relatório Checklist (PDF)
                    </button>
                    <button className="btn btn-primary">
                        <Save size={18} style={{ marginRight: '8px' }} />
                        Salvar Modelo
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
            </section>

            {/* SECCTAO 2: COMPOSIÇÃO MOLDES */}
            <section className="glass-panel p-6 mb-8 animate-delay-1">
                <div className="flex justify-between items-center mb-6">
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>Composição (Partes e Moldes)</h2>
                    <button className="btn btn-outline" onClick={addParte}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Nova Parte
                    </button>
                </div>

                <div className="table-container">
                    <table className="table-premium">
                        <thead>
                            <tr>
                                <th>Nome da Parte</th>
                                <th>Categoria</th>
                                <th>Tag RFID do Molde</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partes.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>Ainda não existem partes de composição cadastradas.</td>
                                </tr>
                            )}
                            {partes.map(parte => (
                                <tr key={parte.id}>
                                    <td>
                                        <input type="text" className="form-control" placeholder="Ex: Casco Superior" value={parte.nome_parte} onChange={e => updateParte(parte.id, 'nome_parte', e.target.value)} />
                                    </td>
                                    <td>
                                        <select className="form-control" value={parte.categoria} onChange={e => updateParte(parte.id, 'categoria', e.target.value)}>
                                            <option value="">Selecione...</option>
                                            <option value="Big">Grande (Big)</option>
                                            <option value="Medium">Médio (Medium)</option>
                                            <option value="Small">Pequeno (Small)</option>
                                        </select>
                                    </td>
                                    <td>
                                        <input type="text" className="form-control" placeholder="Scan RFID..." value={parte.tag_rfid_molde} onChange={e => updateParte(parte.id, 'tag_rfid_molde', e.target.value)} />
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn-icon danger" onClick={() => removeParte(parte.id)}><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                                        <button className="btn-icon" title="Upload Imagem (Em breve)"><Upload size={18} /></button>
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
                                        <th style={{ width: '180px' }}>Estação</th>
                                        <th style={{ width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentOpcional.tarefas.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', opacity: 0.5 }}>Adiciona a primeira tarefa técnica deste opcional.</td></tr>}
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

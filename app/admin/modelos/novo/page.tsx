"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Settings, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { criarModeloCompleto, CriarModeloInput } from './actions';
import { createClient } from '@/utils/supabase/client';

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

export default function NovoModeloPage() {
    const router = useRouter();
    const supabase = createClient();
    const [isSaving, setIsSaving] = useState(false);

    const [nomeModelo, setNomeModelo] = useState('');
    const [modelYear, setModelYear] = useState('');
    const [linhaId, setLinhaId] = useState('');
    const [categoria, setCategoria] = useState('Cruiser');
    const [imagemUrl, setImagemUrl] = useState('');

    const [linhasProducao, setLinhasProducao] = useState<{ id: string, descricao_linha: string }[]>([]);

    useEffect(() => {
        const fetchLinhas = async () => {
            const { data } = await supabase.from('linhas_producao').select('id, descricao_linha').order('descricao_linha');
            if (data) setLinhasProducao(data);
        };
        fetchLinhas();
    }, [supabase]);
    const [opcionais, setOpcionais] = useState<Opcional[]>([]);

    // Estado do Modal de Opcional
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentOpcional, setCurrentOpcional] = useState<Opcional | null>(null);

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
            setImagemUrl('A carregar... ⏳');
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

            // Só lidamos com imagem de modelo base ou de opcional
            if (contextoId === 'geral') {
                setImagemUrl(data.url);
            } else {
                updateTarefaOpcional(tarefaId, 'imagem_url', data.url);
            }
            alert("Imagem carregada com Sucesso!");

        } catch (error) {
            console.error('Upload Error:', error);
            alert((error as Error).message || "Falha a comunicar com servidor. Verifique se o Bucket existe no Supabase.");
            if (contextoId === 'geral') setImagemUrl('');
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
            const input: CriarModeloInput = {
                nome_modelo: nomeModelo,
                model_year: modelYear,
                linha_id: linhaId,
                imagem_url: imagemUrl,
                categoria: categoria,
                opcionais: opcionais
            };

            const res = await criarModeloCompleto(input);
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

    return (
        <div className="container mt-8 animate-fade-in dashboard-layout" style={{ display: 'block' }}>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="brand-title" style={{ marginBottom: 0 }}>Cadastro de Produto</h1>
                    <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "0.25rem" }}>Crie um novo Modelo, Partes, Roteiros e Opcionais.</p>
                </div>
                <div className="flex gap-4">
                    <button className="btn btn-primary animate-pulse-glow" onClick={handleSaveModelo} disabled={isSaving}>
                        {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                        {isSaving ? "A Guardar BD..." : "Salvar Modelo"}
                    </button>
                </div>
            </header>

            {/* SECCTAO 1: DADOS BASE DO MODELO */}
            <section className="glass-panel p-6 mb-8">
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>Dados do Modelo</h2>
                <div className="grid grid-cols-2 gap-6">
                    <div className="form-group flex flex-col gap-4">
                        <div>
                            <label className="form-label">Nome do Modelo</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Ex: Brunswick 320 VIP"
                                value={nomeModelo} onChange={(e) => setNomeModelo(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="form-label">Model Year</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Ex: 2026"
                                value={modelYear} onChange={(e) => setModelYear(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group flex flex-col gap-4">
                        <div>
                            <label className="form-label">Linha de Produção Mestre</label>
                            <select className="form-control" value={linhaId} onChange={(e) => setLinhaId(e.target.value)}>
                                <option value="">-- Selecione a Linha --</option>
                                {linhasProducao.map(l => (
                                    <option key={l.id} value={l.id}>{l.descricao_linha}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Categoria / Tipo de Navegação</label>
                            <select className="form-control" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                                <option value="Cruiser">Day Cruiser</option>
                                <option value="Bowrider">Bowrider</option>
                                <option value="Pilothouse">Pilothouse</option>
                                <option value="Center Console">Center Console</option>
                                <option value="Yacht">Yacht Deluxe</option>
                            </select>
                        </div>
                    </div>

                    {/* FOTO DO BARCO */}
                    <div className="col-span-2 form-group border border-white/10 p-4 rounded-xl flex items-center justify-between mt-2">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg bg-slate-900 flex items-center justify-center overflow-hidden border border-white/10">
                                {imagemUrl ? (
                                    <img src={imagemUrl} alt="Barco" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon size={24} className="text-white/20" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Imagem do Barco</h3>
                                <p className="text-xs text-white/50">Carregue a foto oficial de catálogo deste modelo.</p>
                            </div>
                        </div>
                        <label className="btn btn-outline cursor-pointer" style={{ margin: 0 }}>
                            <input type="file" className="hidden" accept="image/*" disabled={isUploading} onChange={(e) => handleFileUpload(e, 'modelo-base', 'geral')} />
                            {isUploading && imagemUrl === 'A carregar... ⏳' ? <Loader2 size={16} className="animate-spin mr-2" /> : <Upload size={16} className="mr-2" />}
                            Upload Foto
                        </label>
                    </div>
                </div>
            </section >





            {/* SECCTAO 4: OPCIONAIS (EXTRAS) */}
            < section className="glass-panel p-6 mb-8 animate-delay-3" >
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
            </section >


            {/* // ========================================== */}
            {/* // MODAL OPCIONAL */}
            {/* // ========================================== */}
            {
                isModalOpen && currentOpcional && (
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
                )
            }
        </div >
    );
}

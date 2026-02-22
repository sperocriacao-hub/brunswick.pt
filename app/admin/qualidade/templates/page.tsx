'use client';

import React, { useState, useEffect } from 'react';
import { fetchFormTemplates, saveFormTemplate, deleteFormTemplate, FormTemplate } from './actions';
import { Pencil, Trash2, Plus, FileText, CheckCircle2, XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { DynamicFormBuilder } from './components/DynamicFormBuilder';

export default function QualidadeTemplatesPage() {
    const [templates, setTemplates] = useState<FormTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<FormTemplate | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const res = await fetchFormTemplates();
        if (res.success && res.templates) setTemplates(res.templates);
        setLoading(false);
    };

    const handleCreate = () => {
        setCurrentTemplate({
            id: 'new',
            nome_formulario: 'Novo Formulário de Inspeção',
            descricao: '',
            ativo: true,
            schema_json: { fields: [] }
        });
        setIsEditing(true);
    };

    const handleEdit = (tmpl: FormTemplate) => {
        setCurrentTemplate({ ...tmpl });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja eliminar este formulário definitivamente? (Será proibido se já houverem respostas submetidas)')) return;
        setLoading(true);
        const res = await deleteFormTemplate(id);
        if (res.success) {
            alert('Formulário apagado.');
            loadData();
        } else {
            alert('Erro: ' + res.error);
            setLoading(false);
        }
    };

    const handleSave = async (updatedTemplate: FormTemplate) => {
        if (!updatedTemplate.nome_formulario.trim()) {
            alert("O nome da checklist é obrigatório.");
            return;
        }

        setIsSaving(true);
        const res = await saveFormTemplate(updatedTemplate);
        if (res.success) {
            alert("Formulário Guardado com sucesso!");
            setIsEditing(false);
            setCurrentTemplate(null);
            loadData();
        } else {
            alert('Erro: ' + res.error);
        }
        setIsSaving(false);
    };

    if (isEditing && currentTemplate) {
        return (
            <div className="container mx-auto p-4 sm:p-8 max-w-7xl animate-fade-in relative z-20">
                <button onClick={() => setIsEditing(false)} className="text-blue-500 hover:text-blue-400 font-medium mb-6 inline-flex items-center gap-2">
                    <ArrowLeft size={16} /> Voltar à Lista
                </button>
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="brand-title flex items-center gap-3" style={{ fontSize: '2rem', margin: 0 }}>
                            <FileText size={32} color="var(--primary)" /> Construtor de Checklists
                        </h1>
                        <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Arraste, largue e tipifique os campos do seu novo impresso digital de Qualidade.</p>
                    </div>
                </div>

                <div className="glass-panel p-6">
                    {/* Injector do Builder (Sub-Componente) */}
                    <DynamicFormBuilder
                        initialTemplate={currentTemplate}
                        onSave={handleSave}
                        isSaving={isSaving}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-6xl animate-fade-in relative z-20 dashboard-layout">
            <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
                <div>
                    <h1 className="brand-title flex items-center gap-3" style={{ fontSize: '2rem', margin: 0 }}>
                        <FileText size={32} color="var(--primary)" /> Gestor de Qualidade
                    </h1>
                    <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Templates oficiais da fábrica para avaliações e Auditorias Pós-Linha.</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/admin" className="btn btn-outline py-2.5 flex items-center gap-2">
                        Voltar
                    </Link>
                    <button onClick={handleCreate} className="btn btn-primary py-2.5 flex items-center gap-2">
                        <Plus size={18} /> Novo Impresso Web
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-12 text-slate-500 flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    A carregar formulários...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(tmpl => (
                        <div key={tmpl.id} className="glass-panel p-6 flex flex-col justify-between hover:border-blue-500/30 transition-all group">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${tmpl.ativo ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                                        <FileText size={24} />
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border border-white/10 bg-black/30">
                                        {tmpl.ativo ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> ONLINE</span> : <span className="text-slate-500 flex items-center gap-1"><XCircle size={12} /> RASCUNHO</span>}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold mb-2 break-words text-white">{tmpl.nome_formulario}</h3>
                                <p className="text-sm opacity-60 line-clamp-2 h-10 mb-4">{tmpl.descricao || 'Sem descrição particular.'}</p>

                                <div className="flex items-center gap-2 text-xs opacity-70 mb-6 bg-black/20 p-2 rounded">
                                    <span className="bg-slate-700/50 px-2 py-0.5 rounded font-mono font-bold text-blue-300">
                                        {tmpl.schema_json?.fields?.length || 0}
                                    </span>
                                    Questões Configuradas
                                </div>
                            </div>
                            <div className="flex gap-2 border-t border-white/10 pt-4 mt-auto">
                                <button onClick={() => handleEdit(tmpl)} className="flex-1 btn btn-outline py-2 flex justify-center items-center gap-2 opacity-80 hover:opacity-100 border-white/5 hover:border-blue-500/50">
                                    <Pencil size={14} /> Editar
                                </button>
                                <button onClick={() => handleDelete(tmpl.id)} className="btn py-2 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-lg transition-colors" title="Apagar definitivamente">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {templates.length === 0 && (
                        <div className="col-span-full text-center p-12 text-slate-500 border border-dashed border-white/10 rounded-2xl bg-black/10">
                            Nenhum formulário oficial encontrado. Pode criar o primeiro clicando ali em cima.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

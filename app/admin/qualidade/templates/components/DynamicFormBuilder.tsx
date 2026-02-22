'use client';

import React, { useState } from 'react';
import { FormTemplate, FormField, FormFieldType } from '../actions';
import { Plus, GripVertical, Trash2, Settings2, Save, Type, Hash, CheckSquare, ListVideo, AlignCenter, Loader2 } from 'lucide-react';

interface Props {
    initialTemplate: FormTemplate;
    onSave: (template: FormTemplate) => void;
    isSaving: boolean;
}

export function DynamicFormBuilder({ initialTemplate, onSave, isSaving }: Props) {
    const [template, setTemplate] = useState<FormTemplate>(initialTemplate);
    const [fields, setFields] = useState<FormField[]>(initialTemplate.schema_json?.fields || []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setTemplate(prev => ({ ...prev, [name]: finalValue }));
    };

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const addField = (tipo: FormFieldType) => {
        const newField: FormField = {
            id: generateId(),
            label: `Nova Pergunta (${tipo})`,
            tipo: tipo,
            obrigatorio: false,
            opcoes: tipo === 'radio' || tipo === 'selecao' ? ['Opção 1'] : undefined
        };
        setFields([...fields, newField]);
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const removeField = (id: string) => {
        if (!confirm('Remover esta pergunta?')) return;
        setFields(fields.filter(f => f.id !== id));
    };

    const moveField = (index: number, direction: 'UP' | 'DOWN') => {
        if (direction === 'UP' && index === 0) return;
        if (direction === 'DOWN' && index === fields.length - 1) return;

        const newFields = [...fields];
        const swapIndex = direction === 'UP' ? index - 1 : index + 1;
        const temp = newFields[index];
        newFields[index] = newFields[swapIndex];
        newFields[swapIndex] = temp;
        setFields(newFields);
    };

    const handleSave = () => {
        onSave({
            ...template,
            schema_json: { fields: fields }
        });
    };

    const iconMap: Record<FormFieldType, React.ReactNode> = {
        'texto': <Type size={16} />,
        'numero': <Hash size={16} />,
        'checkbox': <CheckSquare size={16} />,
        'radio': <ListVideo size={16} />,
        'selecao': <AlignCenter size={16} />
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in relative z-20">
            {/* INFORMAÇÕES BASE */}
            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 shadow-inner">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings2 size={20} className="text-blue-400" /> Definições do Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold opacity-70 mb-2 uppercase text-[#a9b1d6]">Nome da Checklist Oficial</label>
                        <input
                            type="text"
                            name="nome_formulario"
                            className="form-control text-lg font-bold"
                            value={template.nome_formulario}
                            onChange={handleChange}
                            placeholder="Ex: Auditoria Final de Montagem"
                        />
                    </div>
                    <div className="flex items-center gap-2 mt-auto pb-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-white/5 p-3 rounded-lg border border-white/10 hover:bg-white/10 transition-colors w-full">
                            <input
                                type="checkbox"
                                name="ativo"
                                checked={template.ativo}
                                onChange={handleChange}
                                className="w-5 h-5 accent-emerald-500"
                            />
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">Disponível no Chão de Fábrica</span>
                                <span className="text-xs opacity-50">Operadores poderão ver e preencher.</span>
                            </div>
                        </label>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold opacity-70 mb-2 uppercase text-[#a9b1d6]">Descrição/Instruções Gerais</label>
                        <textarea
                            name="descricao"
                            className="form-control"
                            rows={2}
                            value={template.descricao || ''}
                            onChange={handleChange}
                            placeholder="Descreva o propósito deste formulário..."
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">

                {/* TOOLBAR ADD FIELDS */}
                <div className="md:w-64 shrink-0 flex flex-col gap-3">
                    <h3 className="text-sm font-bold opacity-70 uppercase tracking-widest text-[#a9b1d6] mb-2 px-2">Adicionar Bloco</h3>

                    <button onClick={() => addField('texto')} className="btn btn-outline justify-start text-left bg-black/40 border-white/10 hover:border-blue-500/50 hover:bg-blue-900/20 py-3 rounded-xl transition-all group">
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-blue-500/20 text-blue-400 rounded-lg group-hover:scale-110 transition-transform"><Type size={18} /></span>
                            <div className="flex flex-col"><span className="font-bold">Resposta Curta</span><span className="text-[10px] opacity-50">Texto Livre</span></div>
                        </div>
                    </button>
                    <button onClick={() => addField('numero')} className="btn btn-outline justify-start text-left bg-black/40 border-white/10 hover:border-emerald-500/50 hover:bg-emerald-900/20 py-3 rounded-xl transition-all group">
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg group-hover:scale-110 transition-transform"><Hash size={18} /></span>
                            <div className="flex flex-col"><span className="font-bold">Valor Numérico</span><span className="text-[10px] opacity-50">Quantidades, Graus</span></div>
                        </div>
                    </button>
                    <button onClick={() => addField('checkbox')} className="btn btn-outline justify-start text-left bg-black/40 border-white/10 hover:border-amber-500/50 hover:bg-amber-900/20 py-3 rounded-xl transition-all group">
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg group-hover:scale-110 transition-transform"><CheckSquare size={18} /></span>
                            <div className="flex flex-col"><span className="font-bold">Verificação (Sim/Não)</span><span className="text-[10px] opacity-50">Auditoria Checkbox</span></div>
                        </div>
                    </button>
                    <button onClick={() => addField('selecao')} className="btn btn-outline justify-start text-left bg-black/40 border-white/10 hover:border-purple-500/50 hover:bg-purple-900/20 py-3 rounded-xl transition-all group">
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-purple-500/20 text-purple-400 rounded-lg group-hover:scale-110 transition-transform"><AlignCenter size={18} /></span>
                            <div className="flex flex-col"><span className="font-bold">Lista Múltipla</span><span className="text-[10px] opacity-50">Dropdown Single</span></div>
                        </div>
                    </button>
                </div>

                {/* FIELDS LIST (BUILDER CANVAS) */}
                <div className="flex-1 flex flex-col gap-4 bg-black/10 rounded-2xl p-4 border border-dashed border-white/10 min-h-[400px]">
                    {fields.length === 0 ? (
                        <div className="m-auto text-center opacity-40 flex flex-col items-center gap-4">
                            <Plus size={48} className="animate-pulse" />
                            <p>O seu formulário está vazio.<br />Adicione blocos a partir do menu lateral esquerdo.</p>
                        </div>
                    ) : (
                        fields.map((field, index) => (
                            <div key={field.id} className="relative group bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-start shadow-sm transition-all focus-within:border-blue-500/50 hover:bg-white/10">

                                <div className="flex flex-col gap-1 items-center shrink-0 pt-2 opacity-30 hover:opacity-100 cursor-ns-resize mr-1">
                                    <button onClick={() => moveField(index, 'UP')} disabled={index === 0} className="hover:text-blue-400 disabled:opacity-30 p-1">▲</button>
                                    <GripVertical size={20} />
                                    <button onClick={() => moveField(index, 'DOWN')} disabled={index === fields.length - 1} className="hover:text-blue-400 disabled:opacity-30 p-1">▼</button>
                                </div>

                                <div className="flex-1 flex flex-col gap-3 w-full">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={field.label}
                                                onChange={e => updateField(field.id, { label: e.target.value })}
                                                className="w-full bg-transparent border-b border-dashed border-white/30 text-lg font-bold px-1 py-1 focus:outline-none focus:border-blue-500 text-white placeholder-white/30"
                                                placeholder="Escreva a Pergunta / Label do Campo..."
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                            <span className="text-xs font-mono font-bold uppercase flex items-center gap-1 text-slate-400 opacity-70">
                                                {iconMap[field.tipo]} {field.tipo}
                                            </span>
                                        </div>
                                    </div>

                                    {/* EXTRAS BASEADOS NO TIPO */}
                                    {(field.tipo === 'radio' || field.tipo === 'selecao') && (
                                        <div className="bg-black/20 p-3 rounded-lg border border-dashed border-white/10 mt-2">
                                            <label className="text-xs uppercase font-bold opacity-70 mb-2 block">Opções (Separadas por vírgula)</label>
                                            <input
                                                type="text"
                                                className="form-control text-sm font-mono"
                                                value={field.opcoes?.join(', ') || ''}
                                                onChange={e => updateField(field.id, { opcoes: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                                                placeholder="Ex: Passou, Reprovou, Aguarda Revisão"
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                                            <input
                                                type="checkbox"
                                                checked={field.obrigatorio}
                                                onChange={e => updateField(field.id, { obrigatorio: e.target.checked })}
                                                className="w-4 h-4 accent-amber-500"
                                            />
                                            <span className={`${field.obrigatorio ? 'text-amber-400 font-bold' : 'opacity-60'}`}>Campo Obrigatório (*)</span>
                                        </label>

                                        <button onClick={() => removeField(field.id)} className="text-xs flex items-center gap-1 text-red-400/70 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition-colors">
                                            <Trash2 size={14} /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-white/10 pb-10 sticky bottom-0 z-50 p-4 rounded-xl backdrop-blur-md" style={{ background: 'rgba(15, 23, 42, 0.8)' }}>
                <button onClick={handleSave} disabled={isSaving} className="btn btn-primary shadow-[0_0_20px_rgba(37,99,235,0.4)] px-8 py-3 text-lg font-bold flex items-center gap-2">
                    {isSaving ? <><Loader2 size={20} className="animate-spin" /> A empacotar Json...</> : <><Save size={20} /> Guardar Construtor</>}
                </button>
            </div>
        </div>
    );
}

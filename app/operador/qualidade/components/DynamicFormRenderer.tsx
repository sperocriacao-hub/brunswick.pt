'use client';

import React, { useState } from 'react';
import { FormTemplate, FormField } from '../../../admin/qualidade/templates/actions';
import { Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
    template: FormTemplate;
    onSubmit: (respostas: Record<string, unknown>) => void;
    isSubmitting: boolean;
}

export function DynamicFormRenderer({ template, onSubmit, isSubmitting }: Props) {
    const fields: FormField[] = template.schema_json?.fields || [];
    const [respostas, setRespostas] = useState<Record<string, unknown>>({});
    const [erros, setErros] = useState<Record<string, string>>({});

    const handleChange = (fieldId: string, valor: unknown) => {
        setRespostas(prev => ({ ...prev, [fieldId]: valor }));
        // Limpar erro ao digitalizar
        if (erros[fieldId]) {
            setErros(prev => {
                const newErros = { ...prev };
                delete newErros[fieldId];
                return newErros;
            });
        }
    };

    const validateAndSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const novosErros: Record<string, string> = {};

        // Validar Obrigatórios
        fields.forEach(f => {
            const isEmpty =
                respostas[f.id] === undefined ||
                respostas[f.id] === null ||
                String(respostas[f.id]).trim() === '';

            if (f.obrigatorio && isEmpty) {
                // Apenas checkboxes podem passar falsy num required (que será false) mas como é required, tem de ser true (aceitar)
                if (f.tipo === 'checkbox' && !respostas[f.id]) {
                    novosErros[f.id] = 'Este passo de verificação é obrigatório.';
                } else if (f.tipo !== 'checkbox') {
                    novosErros[f.id] = 'Campo obrigatório.';
                }
            }
        });

        if (Object.keys(novosErros).length > 0) {
            setErros(novosErros);
            // Auto scroll to first error
            const firstErrorId = Object.keys(novosErros)[0];
            document.getElementById(`field-${firstErrorId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        onSubmit(respostas);
    };

    const renderField = (field: FormField) => {
        const errorMsg = erros[field.id];
        // Cast do valor raw to string safely for HTML inputs
        const valueAsString = respostas[field.id] !== undefined && respostas[field.id] !== null ? String(respostas[field.id]) : '';

        switch (field.tipo) {
            case 'texto':
                return (
                    <input
                        type="text"
                        className={`w-full bg-black/40 border ${errorMsg ? 'border-red-500/50' : 'border-slate-700/50'} rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500`}
                        placeholder="Resposta / Observação"
                        value={valueAsString}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                    />
                );
            case 'numero':
                return (
                    <input
                        type="number"
                        className={`w-full md:w-1/3 bg-black/40 border ${errorMsg ? 'border-red-500/50' : 'border-slate-700/50'} rounded-xl px-4 py-3 font-mono text-xl focus:outline-none focus:border-blue-500`}
                        placeholder="0.00"
                        value={valueAsString}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                    />
                );
            case 'checkbox':
                return (
                    <label className={`flex items-center gap-4 cursor-pointer p-4 rounded-xl border ${errorMsg ? 'border-red-500/50 bg-red-500/5' : 'border-slate-700/50 bg-black/20 hover:bg-black/40'} transition-all`}>
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-md bg-black/40 border border-white/20 shrink-0">
                            <input
                                type="checkbox"
                                className="opacity-0 absolute inset-0 cursor-pointer"
                                checked={!!respostas[field.id]}
                                onChange={(e) => handleChange(field.id, e.target.checked)}
                            />
                            {!!respostas[field.id] && <CheckCircle2 size={24} className="text-emerald-400 absolute" />}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-lg transition-colors ${respostas[field.id] ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                                Confirmo a validação / Passo verificado
                            </span>
                        </div>
                    </label>
                );
            case 'radio':
                return (
                    <div className="flex flex-col gap-3">
                        {field.opcoes?.map((opt, i) => (
                            <label key={i} className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${respostas[field.id] === opt ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700/50 bg-black/20 hover:bg-black/40'}`}>
                                <input
                                    type="radio"
                                    name={field.id}
                                    value={opt}
                                    className="w-5 h-5 accent-blue-500"
                                    checked={respostas[field.id] === opt}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                />
                                <span className={respostas[field.id] === opt ? 'font-bold text-blue-100' : 'text-slate-300'}>{opt}</span>
                            </label>
                        ))}
                    </div>
                );
            case 'selecao':
                return (
                    <select
                        className={`w-full bg-black/40 border ${errorMsg ? 'border-red-500/50' : 'border-slate-700/50'} rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 appearance-none`}
                        value={valueAsString}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                    >
                        <option value="">-- Selecione uma opção --</option>
                        {field.opcoes?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            default:
                return <span className="text-red-400">Tipo Indisponível</span>;
        }
    };

    if (fields.length === 0) {
        return (
            <div className="text-center p-10 opacity-50">
                Este formulário não tem perguntas configuradas pelo administrador.
            </div>
        );
    }

    return (
        <form onSubmit={validateAndSubmit} className="flex flex-col gap-8">
            {Object.keys(erros).length > 0 && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3 font-bold animate-pulse">
                    <AlertCircle />Existem campos obrigatórios por preencher.
                </div>
            )}

            <div className="flex flex-col gap-6">
                {fields.map((field, index) => (
                    <div
                        id={`field-${field.id}`}
                        key={field.id}
                        className={`bg-white/5 border border-white/10 rounded-2xl p-6 transition-all focus-within:border-blue-500/30 hover:border-white/20`}
                        style={{ borderLeft: field.obrigatorio ? '4px solid rgb(245, 158, 11)' : undefined }}
                    >
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-white flex items-start gap-2">
                                <span className="text-blue-400 opacity-50">{index + 1}.</span>
                                {field.label}
                                {field.obrigatorio && <span className="text-amber-500 font-black text-xl" title="Obrigatório">*</span>}
                            </h3>
                        </div>

                        <div className="mt-2">
                            {renderField(field)}

                            {erros[field.id] && (
                                <p className="text-red-400 text-sm mt-2 flex items-center gap-1 font-bold">
                                    <AlertCircle size={14} /> {erros[field.id]}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="sticky bottom-4 z-50">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold py-5 rounded-2xl shadow-[0_10px_40px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_50px_rgba(37,99,235,0.6)] transition-all transform hover:-translate-y-1 flex justify-center items-center gap-2 group border border-blue-400/30"
                >
                    {isSubmitting ? (
                        <><Loader2 className="animate-spin" /> A guardar respostas...</>
                    ) : (
                        <><Save className="group-hover:scale-110 transition-transform" /> GRAVAR E CONCLUIR AUDITORIA</>
                    )}
                </button>
            </div>
        </form>
    );
}

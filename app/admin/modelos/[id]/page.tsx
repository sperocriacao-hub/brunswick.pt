'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Save, Loader2, ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';

export default function EditarModeloPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const modeloId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [nomeModelo, setNomeModelo] = useState('');
    const [modelYear, setModelYear] = useState('');
    const [status, setStatus] = useState('Ativo');

    const fetchModelo = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('modelos')
                .select('nome_modelo, model_year, status')
                .eq('id', modeloId)
                .single();

            if (error) throw error;
            if (data) {
                setNomeModelo(data.nome_modelo || '');
                setModelYear(data.model_year || '');
                setStatus(data.status || 'Ativo');
            }
        } catch (err) {
            console.error(err);
            alert("Erro ao carregar os dados do modelo.");
        } finally {
            setIsLoading(false);
        }
    }, [modeloId, supabase]);

    useEffect(() => {
        if (modeloId) fetchModelo();
    }, [modeloId, fetchModelo]);

    const handleSave = async () => {
        if (!nomeModelo || !modelYear) {
            alert('Por favor, preencha o Nome do Modelo e o Ano do Modelo.');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('modelos')
                .update({
                    nome_modelo: nomeModelo,
                    model_year: modelYear,
                    status: status
                })
                .eq('id', modeloId);

            if (error) throw error;
            alert('Modelo atualizado com sucesso!');
            router.push('/admin/modelos');
            router.refresh();
        } catch (err) {
            console.error(err);
            alert("Falha ao salvar as alterações.");
        } finally {
            setIsSaving(false);
        }
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
            <header className="flex gap-4 items-center mb-8">
                <Link href="/admin/modelos" className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%' }}>
                    <ArrowLeft size={20} />
                </Link>
                <div style={{ flex: 1 }}>
                    <h1 className="brand-title" style={{ marginBottom: 0 }}>Editar Produto</h1>
                    <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "0.25rem" }}>Atualizar catálogo do modelo de embarcação.</p>
                </div>
                <div>
                    <button className="btn btn-primary animate-pulse-glow" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                        {isSaving ? "A Guardar..." : "Salvar Alterações"}
                    </button>
                </div>
            </header>

            <section className="glass-panel p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <Package size={24} className="text-blue-400" />
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>Dados Básicos</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="form-group">
                        <label className="form-label">Nome do Modelo</label>
                        <input
                            type="text"
                            className="form-control"
                            value={nomeModelo}
                            onChange={(e) => setNomeModelo(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Model Year</label>
                        <input
                            type="text"
                            className="form-control"
                            value={modelYear}
                            onChange={(e) => setModelYear(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
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

            <section className="glass-panel p-6 mb-8 mt-4" style={{ opacity: 0.7 }}>
                <h3 className="text-warning mb-2" style={{ fontWeight: 600, color: 'var(--warning)' }}>⚠️ Edição Avançada (Engenharia)</h3>
                <p style={{ fontSize: '0.85rem' }}>A modificação de B.O.M. (Lista de Materiais), Roteiros de Produção e Opcionais requer privilégios de Engenheiro Chefe na Base de Dados. A Interface só permite editar a Metadata Base nesta versão.</p>
            </section>
        </div>
    );
}

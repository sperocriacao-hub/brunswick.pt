'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Plus, Package, Edit } from 'lucide-react';
import Link from 'next/link';

type ModeloInfo = {
    id: string;
    nome_modelo: string;
    model_year: string;
    created_at: string;
};

export default function ModelosListPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [modelos, setModelos] = useState<ModeloInfo[]>([]);

    const fetchModelos = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('modelos')
                .select('id, nome_modelo, model_year, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setModelos(data || []);
        } catch (error: unknown) {
            console.error(error);
            alert("Erro ao carregar modelos.");
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchModelos();
    }, [fetchModelos]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Ativo': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
            case 'Em Desenvolvimento': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
            case 'Descontinuado': return 'bg-stone-500/20 text-stone-500 border-stone-500/30';
            default: return 'bg-slate-500/20 text-slate-500 border-slate-500/30';
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '100%', padding: '1rem', overflowX: 'hidden' }}>
            <header style={{
                position: 'sticky', top: 0, zIndex: 50, display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                background: 'rgba(15, 23, 42, 0.95)', padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                margin: '-1rem -1rem 2rem -1rem', width: 'calc(100% + 2rem)', overflowX: 'auto', whiteSpace: 'nowrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                        Modelos de Embarcações
                    </h1>
                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 12px' }}></div>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: '0.85rem', margin: 0 }}>
                        Catálogo e Engenharia de Produto
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link href="/admin/modelos/novo" className="btn btn-primary" style={{ borderRadius: '999px', padding: '0.4rem 1rem', fontSize: '0.85rem', boxShadow: '0 0 15px var(--primary)' }}>
                        <Plus size={14} style={{ marginRight: '6px' }} />
                        Novo Modelo (B.O.M.)
                    </Link>
                </div>
            </header>

            {isLoading ? (
                <div className="flex justify-center items-center py-20 opacity-50">
                    <Loader2 size={48} className="animate-spin" />
                </div>
            ) : modelos.length === 0 ? (
                <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <Package size={48} className="opacity-30 mb-4" />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Nenhum Modelo Encontrado</h3>
                    <p style={{ opacity: 0.6, maxWidth: '400px', margin: '0 auto' }}>Ainda não existem embarcações cadastradas. Comece por registar o primeiro modelo e a respetiva lista de peças.</p>
                    <Link href="/admin/modelos/novo" className="btn btn-primary mt-4">
                        <Plus size={16} className="mr-2" />
                        Criar Primeiro Modelo
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {modelos.map((modelo) => (
                        <div key={modelo.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all 0.3s', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                                    <Package size={24} />
                                </div>
                                <span className={`px-2 py-1 rounded text-xs border ${getStatusColor('Ativo')}`} style={{ fontWeight: 600 }}>
                                    Ativo
                                </span>
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 4px 0', color: '#fff' }}>{modelo.nome_modelo}</h3>
                                <p style={{ fontSize: '0.85rem', opacity: 0.6, margin: 0 }}>Model Year: {modelo.model_year}</p>
                            </div>

                            <div style={{ flex: 1 }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                    Adicionado a {new Date(modelo.created_at).toLocaleDateString('pt-PT')}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {/* These are placeholder actions. Future-proofing for edit capabilities */}
                                    <button className="p-2 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors" title="Editar Modelo">
                                        <Edit size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

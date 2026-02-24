'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Save, RefreshCw, Mail, MessageSquare, Settings as SettingsIcon, ShieldAlert, Bell, Database } from 'lucide-react';
import Link from 'next/link';
import { FeriadosManager } from './FeriadosManager';
import { DatabaseManager } from './DatabaseManager';

type ConfigItem = {
    id: string;
    chave: string;
    valor: string | null;
    descricao: string | null;
    grupo: string;
    is_secret: boolean;
};

export default function ConfiguracoesPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [configs, setConfigs] = useState<ConfigItem[]>([]);
    const [activeTab, setActiveTab] = useState<'Geral' | 'Email' | 'SMS' | 'Fabrica' | 'Dados'>('Geral');

    // Estado form (chaves alteradas localmente antes do save)
    const [formData, setFormData] = useState<Record<string, string>>({});

    const fetchConfigs = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('configuracoes_sistema')
                .select('*')
                .order('grupo', { ascending: true })
                .order('chave', { ascending: true });

            if (error) throw error;

            if (data) {
                setConfigs(data);
                // Pré-preencher form state com valores da BD
                const initialForm: Record<string, string> = {};
                data.forEach(item => {
                    initialForm[item.chave] = item.valor || '';
                });
                setFormData(initialForm);
            }
        } catch (error: unknown) {
            console.error(error);
            alert("Erro ao carregar configurações.");
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    const handleInput = (chave: string, valor: string) => {
        setFormData(prev => ({ ...prev, [chave]: valor }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Em vez de mass upsert complexo, como são poucas rows base: fazemos 1 chamada por key modificada ou um batch RPC. Como não há array upsert direto por chaves no client easily sem id (e id as vezes falta se for new on conflict):

            // Build payload for upsert based on Unique Key 'chave'
            const payload = configs.map(c => ({
                id: c.id,
                chave: c.chave,
                valor: formData[c.chave] ?? c.valor,
                descricao: c.descricao,
                grupo: c.grupo,
                is_secret: c.is_secret
            }));

            const { error } = await supabase
                .from('configuracoes_sistema')
                .upsert(payload, { onConflict: 'chave' });

            if (error) throw error;

            alert("Configurações gravadas com sucesso!");
            fetchConfigs();
        } catch (error: unknown) {
            console.error(error);
            alert("Erro a guardar configurações: " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setIsSaving(false);
        }
    };

    const getGroupIcon = (tabName: string) => {
        if (tabName === 'Geral') return <SettingsIcon size={18} />;
        if (tabName === 'Email') return <Mail size={18} />;
        if (tabName === 'SMS') return <MessageSquare size={18} />;
        if (tabName === 'Fabrica') return <SettingsIcon size={18} />;
        if (tabName === 'Dados') return <Database size={18} />;
        return <SettingsIcon size={18} />;
    };

    // Filter configs by active tab
    const visibleConfigs = configs.filter(c => c.grupo === activeTab);

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
                        Configurações Globais
                    </h1>
                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 12px' }}></div>
                    <Link href="/admin/configuracoes/notificacoes" className="text-amber-400 hover:text-amber-300 font-bold text-sm flex items-center gap-2 bg-amber-900/30 px-3 py-1 rounded-full border border-amber-500/30 transition-all">
                        <Bell size={14} /> Automações de Alertas
                    </Link>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline" style={{ borderRadius: '999px', padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={fetchConfigs} disabled={isLoading || isSaving}>
                        <RefreshCw size={14} style={{ marginRight: '6px' }} className={isLoading ? "animate-spin" : ""} />
                        Recarregar
                    </button>
                    <button className="btn btn-primary" style={{ borderRadius: '999px', padding: '0.4rem 1rem', fontSize: '0.85rem', boxShadow: '0 0 15px var(--primary)' }} onClick={handleSave} disabled={isLoading || isSaving}>
                        {isSaving ? <Loader2 size={14} className="animate-spin" style={{ marginRight: '6px' }} /> : <Save size={14} style={{ marginRight: '6px' }} />}
                        Gravar Alterações
                    </button>
                </div>
            </header>

            {/* TAB BAR */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap' }}>
                {['Geral', 'Email', 'SMS', 'Fabrica', 'Dados'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem', borderRadius: '8px',
                            background: activeTab === tab ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                            color: activeTab === tab ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
                            border: activeTab === tab ? '1px solid var(--primary)' : '1px solid transparent',
                            fontWeight: activeTab === tab ? 600 : 400,
                            transition: 'all 0.2s', cursor: 'pointer'
                        }}
                    >
                        {getGroupIcon(tab)}
                        {tab}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20 opacity-50">
                    <Loader2 size={48} className="animate-spin" />
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px' }}>

                    {activeTab !== 'Fabrica' && activeTab !== 'Dados' && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                    {getGroupIcon(activeTab)}
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Parâmetros de {activeTab}</h2>
                                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6 }}>Definições aplicadas a todos os envios e utilizadores do sistema.</p>
                                </div>
                            </div>

                            {visibleConfigs.length === 0 ? (
                                <div className="p-8 text-center opacity-50 border border-dashed rounded-lg" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                                    Nenhuma restrição ou configuração definida neste grupo.
                                    Corra o ficheiro semente SQL (Migração 0005) na base de dados para provisionar chaves obrigatórias.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    {visibleConfigs.map(config => (
                                        <div key={config.id} className="form-group">
                                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {config.chave.toUpperCase().replace(/_/g, ' ')}
                                                    <span title="Proteção de Encriptação Ativa (Apenas Visível a Admins)"><ShieldAlert size={14} color="#ef4444" /></span>
                                                </span>
                                            </label>
                                            <p style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.75rem', marginTop: '-0.25rem' }}>
                                                {config.descricao}
                                            </p>
                                            <input
                                                type={config.is_secret ? "password" : "text"}
                                                className="form-control"
                                                placeholder={`Escreva o valor para ${config.chave}...`}
                                                value={formData[config.chave] ?? ''}
                                                onChange={(e) => handleInput(config.chave, e.target.value)}
                                                style={{
                                                    fontFamily: config.is_secret ? 'monospace' : 'inherit',
                                                    padding: '0.75rem 1rem', width: '100%', maxWidth: '600px'
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'Fabrica' && <FeriadosManager />}
                    {activeTab === 'Dados' && <DatabaseManager />}
                </div>
            )}
        </div>
    );
}

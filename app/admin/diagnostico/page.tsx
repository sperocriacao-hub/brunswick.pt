import React from 'react';
import { Activity, Database, Server, KeyRound, CheckCircle, XCircle, HardDrive } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { DeviceStatusTable } from './components/DeviceStatusTable';
import { Esp32Simulator } from './components/Esp32Simulator';
import { DeviceLogs } from './components/DeviceLogs';
import { ApiDocs } from './components/ApiDocs';

// Página forçada a ser renderizada dinamicamente para poder ler as ENV Variáveis reais daquele milissegundo no servidor
export const dynamic = 'force-dynamic';

export default async function DiagnosticoPage() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 1. Verificar Variáveis de Ambiente
    const envSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const envSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 2. Testar Ligação à Base de Dados Supabase (Tirando pingo de uma query ultra rápida)
    let dbStatus = 'pendente';
    let dbLatencyMs = 0;
    let errorLog = '';

    try {
        const t0 = performance.now();
        // Teste 1: Query simples à tabela de configurações globais
        const { error } = await supabase.from('sys_config_geral').select('id').limit(1);
        const t1 = performance.now();

        if (error) {
            dbStatus = 'erro';
            errorLog = error.message;
        } else {
            dbStatus = 'ok';
            dbLatencyMs = Math.round(t1 - t0);
        }
    } catch (err: unknown) {
        dbStatus = 'erro_terminal';
        errorLog = (err as Error).message || 'Falha de rede severa Vercel->Supabase';
    }

    return (
        <div className="dashboard-layout" style={{ display: 'block', minHeight: '100vh', padding: '2rem' }}>

            <div className="flex flex-col items-center mb-8 text-center animate-fade-in">
                <Activity size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                <h1 className="brand-title" style={{ fontSize: '2rem', margin: 0 }}>Diagnóstico do Sistema & IoT</h1>
                <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Painel Técnico de Hardware / Vercel / Supabase.</p>
            </div>

            {/* SECÇÃO 1: MÓDULO ESP32 IoT & GÊMEO DIGITAL (Fase 13) */}
            <div className="mb-12 animate-fade-in animate-delay-1">
                <h2 className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4" style={{ fontSize: '1.4rem', color: 'var(--text)' }}>
                    <HardDrive size={24} color="var(--primary)" /> Central de IoT & Equipamentos
                </h2>

                <div className="grid grid-cols-[2fr_1fr] gap-6 mb-6">
                    <DeviceStatusTable />
                    <Esp32Simulator />
                </div>

                <div className="grid grid-cols-[1fr_1fr] gap-6">
                    <ApiDocs envUrl={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} envAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''} />
                    <DeviceLogs />
                </div>
            </div>

            {/* SECÇÃO 2: INFRAESTRUTURA CLOUD (Legado) */}
            <div className="animate-fade-in animate-delay-2">
                <h2 className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4 mt-12" style={{ fontSize: '1.4rem', color: 'var(--text)' }}>
                    <Server size={24} color="var(--accent)" /> Infraestrutura Cloud
                </h2>
                <div className="grid grid-cols-2 gap-8 max-w-6xl mx-auto">

                    {/* Painel de Variáveis de Ambiente (Vercel) */}
                    <section className="glass-panel p-6">
                        <h2 className="flex items-center gap-2 mb-6" style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>
                            <Server size={20} /> Variáveis de Ambiente Vercel
                        </h2>

                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center p-3" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                <div className="flex items-center gap-3">
                                    <KeyRound size={18} opacity={0.6} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>NEXT_PUBLIC_SUPABASE_URL</span>
                                </div>
                                {envSupabaseUrl ? <CheckCircle color="#86efac" size={20} /> : <XCircle color="#fca5a5" size={20} />}
                            </div>

                            <div className="flex justify-between items-center p-3" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                <div className="flex items-center gap-3">
                                    <KeyRound size={18} opacity={0.6} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                                </div>
                                {envSupabaseKey ? <CheckCircle color="#86efac" size={20} /> : <XCircle color="#fca5a5" size={20} />}
                            </div>

                            {(!envSupabaseUrl || !envSupabaseKey) && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', fontSize: '0.85rem', color: '#fca5a5' }}>
                                    <strong>Atenção Crítica:</strong> Faltam criar estas variáveis nas configurações do projeto na plataforma Vercel (Project &gt; Settings &gt; Environment Variables). SEM estas chaves o Vercel não sabe conectar-se à base de dados.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Painel de DB / API Supabase */}
                    <section className="glass-panel p-6">
                        <h2 className="flex items-center gap-2 mb-6" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
                            <Database size={20} /> Healthcheck da Base de Dados
                        </h2>

                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center p-3" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Estado da Ligação Supabase PostgREST</span>
                                {dbStatus === 'ok' ? (
                                    <span style={{ color: '#86efac', fontWeight: 600, fontSize: '0.85rem' }}>ONLINE</span>
                                ) : (
                                    <span style={{ color: '#fca5a5', fontWeight: 600, fontSize: '0.85rem' }}>OFFLINE (Erro)</span>
                                )}
                            </div>

                            <div className="flex justify-between items-center p-3" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Latência Ping</span>
                                <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>{dbStatus === 'ok' ? `${dbLatencyMs}ms` : '--'}</span>
                            </div>

                            {dbStatus !== 'ok' && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace', color: '#fca5a5', overflowWrap: 'break-word' }}>
                                    <strong>Log de Erro Supabase:</strong><br />
                                    {errorLog}
                                </div>
                            )}

                            {dbStatus === 'ok' && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', fontSize: '0.85rem', color: '#86efac' }}>
                                    A Comunicação com o Supabase está a ser efetuada com sucesso através de Server Components.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            <div className="text-center mt-12 animate-fade-in animate-delay-3">
                <a href="/login" className="btn btn-outline" style={{ display: 'inline-block' }}>Sair da Central Técnica</a>
            </div>

        </div>
    );
}

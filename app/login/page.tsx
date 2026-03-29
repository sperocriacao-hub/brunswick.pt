"use client";

import { Suspense } from 'react';
import { Lock, Factory } from 'lucide-react';
import { login, signup } from './actions';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
    const searchParams = useSearchParams();
    const errorMessage = searchParams.get('error');
    const successMessage = searchParams.get('message');

    return (
        <div className="dashboard-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background-base)', minHeight: '100vh', padding: '1rem' }}>

            <div className="glass-panel p-8 animate-fade-in" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10 }}>

                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
                            <Factory size={32} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Brunswick</h1>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', padding: '0.8rem', borderRadius: '50%', marginBottom: '1rem', boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)' }}>
                        <Lock size={20} color="white" />
                    </div>
                    <h2 className="brand-title" style={{ fontSize: '1.4rem', margin: 0, paddingLeft: 0 }}>Autenticação M.E.S</h2>
                    <p style={{ opacity: 0.7, fontSize: '0.875rem', marginTop: '0.25rem' }}>Acesso Restrito ao Shopfloor</p>
                </div>

                <form className="flex flex-col gap-5">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Email de Acesso</label>
                        <input
                            className="form-control"
                            name="email"
                            type="email"
                            placeholder="seu.nome@brunswick.com"
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Palavra-passe</label>
                        <input
                            className="form-control"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {(errorMessage || successMessage) && (
                        <div className="animate-fade-in" style={{
                            color: errorMessage ? '#fca5a5' : '#86efac',
                            background: errorMessage ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            border: `1px solid ${errorMessage ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                            padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center'
                        }}>
                            {errorMessage || successMessage}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 mt-4">
                        <button formAction={login} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                            Aceder ao Painel (Login)
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--background-base)' }}>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}

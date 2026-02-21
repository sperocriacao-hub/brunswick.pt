"use client";

import { Lock } from 'lucide-react';
import { login, signup } from './actions';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const errorMessage = searchParams.get('error');
    const successMessage = searchParams.get('message');

    return (
        <div className="dashboard-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background-base)', minHeight: '100vh', padding: '1rem' }}>

            <div className="glass-panel p-8 animate-fade-in" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10 }}>

                <div className="flex flex-col items-center mb-8 text-center">
                    <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', padding: '1rem', borderRadius: '50%', marginBottom: '1.2rem', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}>
                        <Lock size={28} color="white" />
                    </div>
                    <h1 className="brand-title" style={{ fontSize: '1.8rem', margin: 0, paddingLeft: 0 }}>Autenticação</h1>
                    <p style={{ opacity: 0.7, fontSize: '0.875rem', marginTop: '0.5rem' }}>Brunswick.pt - Shopfloor MES</p>
                </div>

                <form className="flex flex-col gap-5">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Email de Acesso</label>
                        <input
                            className="form-control"
                            name="email"
                            type="email"
                            defaultValue="master@brunswick.pt"
                            placeholder="admin@brunswick.com"
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Palavra-passe</label>
                        <input
                            className="form-control"
                            name="password"
                            type="password"
                            defaultValue="Admin123"
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
                        <button formAction={signup} className="btn btn-outline" style={{ width: '100%', padding: '0.7rem', fontSize: '0.85rem', opacity: 0.8 }}>
                            (1º Passo) Criar Conta Master
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}

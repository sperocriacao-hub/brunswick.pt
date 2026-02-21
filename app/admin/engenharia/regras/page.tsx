'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

export default function RegrasSequenciamentoPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Placeholder check
        setTimeout(() => setIsLoading(false), 500);
    }, []);

    return (
        <div className="animate-fade-in" style={{ maxWidth: '100%', padding: '1rem', overflowX: 'hidden' }}>
            <header style={{
                position: 'sticky', top: 0, zIndex: 50, display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'center', gap: '1rem',
                background: 'rgba(15, 23, 42, 0.95)', padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                margin: '-1rem -1rem 2rem -1rem', width: 'calc(100% + 2rem)', overflowX: 'auto', whiteSpace: 'nowrap'
            }}>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)', flexShrink: 0 }}>
                    Regras de Sequenciamento
                </h1>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: '0.85rem', margin: 0, marginLeft: 'auto' }}>
                    Gestão de Offsets e Durações
                </p>
            </header>

            {isLoading ? (
                <div className="flex justify-center items-center py-20 opacity-50">
                    <Loader2 size={48} className="animate-spin" />
                </div>
            ) : (
                <div className="glass-panel p-6 opacity-50 text-center">
                    Em construção: Matriz de Configuração de Tempos (Dias de Base).
                </div>
            )}
        </div>
    );
}

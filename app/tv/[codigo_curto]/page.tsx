import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { MonitorPlay, AlertTriangle } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function ShortCodeInterceptorPage({ params }: { params: Promise<{ codigo_curto: string }> }) {
    const defaultParams = await params;
    const code = defaultParams.codigo_curto?.toUpperCase() || '';

    // 1. Fetch the TV UUID associated with this 5-digit PIN
    const { data: tv, error } = await supabase
        .from('configuracoes_tv')
        .select('id, nome_tv')
        .eq('codigo_curto', code)
        .single();

    if (error || !tv) {
        // Render Error Screen if PIN is invalid
        return (
            <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center p-12 text-slate-500 selection:bg-rose-500/30">
                <AlertTriangle size={120} className="mb-8 text-rose-500/50 animate-pulse" />
                <h1 className="text-6xl font-black mb-4 uppercase text-slate-200 tracking-tighter">CÓDIGO INVÁLIDO</h1>
                <p className="text-3xl font-mono text-slate-400 max-w-2xl text-center">
                    O PIN de Emparelhamento <strong className="text-rose-400">"{code}"</strong> não existe.
                    <br /><br />
                    Por favor, verifique o Gestor de Monitores no Backoffice M.E.S. e insira o código correto.
                </p>
            </div>
        );
    }

    // 2. Immediate Server-Side Redirect to the actual NASA TV Dashboard
    redirect(`/tv/live/${tv.id}`);
}

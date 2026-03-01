import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { differenceInDays } from 'date-fns';
import { ShieldCheck, Target } from 'lucide-react';

// Force Server Side Dynamic Render
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Refresh KPIs automatically via standard Next.js revalidation cache every minute

export default async function HSTBanner() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Query para obter o último Acidente com Baixa (Grave/Fatalidade)
    const { data: ultimoAcidente, error } = await supabase
        .from('hst_ocorrencias')
        .select('data_hora_ocorrencia')
        .eq('tipo_ocorrencia', 'Acidente com Baixa')
        .order('data_hora_ocorrencia', { ascending: false })
        .limit(1)
        .single();

    let daysWithoutAccident = 0;

    // Se não há acidentes com baixa registados, assumimos a data de abertura da fábrica (ex: Janeiro de 2024)
    // Se houver, calculamos a diferença face à data do servidor
    if (!error && ultimoAcidente) {
        daysWithoutAccident = differenceInDays(new Date(), new Date(ultimoAcidente.data_hora_ocorrencia));
    } else {
        // Fallback for empty database to motivate employees (since the shopfloor app is fresh)
        daysWithoutAccident = differenceInDays(new Date(), new Date('2024-01-01T00:00:00.000Z'));
    }

    return (
        <div className="absolute bottom-0 w-full h-12 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6 z-50">
            <div className="flex items-center gap-4">
                <div className="flex bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-md px-3 py-1 items-center gap-2">
                    <ShieldCheck size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Segurança no Trabalho HST</span>
                </div>

                {daysWithoutAccident > 30 ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold tracking-widest uppercase">
                        <span>ESTAMOS HÁ</span>
                        <span className="text-2xl animate-pulse px-1">{daysWithoutAccident}</span>
                        <span>DIAS SEM ACIDENTES DE TRABALHO</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-amber-500 font-bold tracking-widest uppercase">
                        <span>ESTAMOS HÁ</span>
                        <span className="text-xl px-1">{daysWithoutAccident}</span>
                        <span>DIAS SEM ACIDENTES</span>
                        <span className="text-[10px] ml-2 text-amber-500/50">ATENÇÃO REDOBRADA</span>
                    </div>
                )}
            </div>

            <div className="text-slate-500 text-xs font-mono font-bold uppercase flex gap-4">
                <span className="flex items-center gap-1.5"><Target size={14} /> Meta: 365 Dias</span>
                <span>« ZERO ACIDENTES »</span>
            </div>
        </div>
    );
}

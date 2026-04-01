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

    // --- CNN TICKER INTEGRATION ---
    // Fetch Occurrences for CNN Ticker (Últimas 24 horas - filtered in JS to bypass timezone quirks)
    const { data: ocorrenciasRecentes } = await supabase
        .from('hst_ocorrencias')
        .select(`
            *,
            areas_fabrica(nome_area),
            estacoes(nome_estacao)
        `)
        .order('data_hora_ocorrencia', { ascending: false })
        .limit(10);

    const limit24H = Date.now() - (24 * 60 * 60 * 1000);
    const ocorrenciasHoje = ocorrenciasRecentes?.filter(o => {
        if (!o.data_hora_ocorrencia) return false;
        return new Date(o.data_hora_ocorrencia).getTime() >= limit24H;
    }) || [];

    return (
        <div className="absolute bottom-0 w-full h-12 bg-slate-900 border-t border-slate-800 flex items-center justify-between z-50 overflow-hidden">
            {/* Esquerda: Base Fixa */}
            <div className="flex items-center gap-4 px-6 shrink-0 bg-slate-900 z-20 h-full">
                <div className="flex bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-md px-3 py-1 items-center gap-2">
                    <ShieldCheck size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Segurança no Trabalho HST</span>
                </div>

                {daysWithoutAccident > 30 ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold tracking-widest uppercase">
                        <span>ESTAMOS HÁ</span>
                        <span className="text-2xl animate-pulse px-1">{daysWithoutAccident}</span>
                        <span>DIAS SEM ACIDENTES</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-amber-500 font-bold tracking-widest uppercase">
                        <span>ESTAMOS HÁ</span>
                        <span className="text-xl px-1">{daysWithoutAccident}</span>
                        <span>DIAS SEM ACIDENTES</span>
                        {ocorrenciasHoje.length === 0 && (
                            <span className="text-[10px] ml-2 text-amber-500/50">ATENÇÃO REDOBRADA</span>
                        )}
                    </div>
                )}
            </div>

            {/* Centro: Ticker Dinâmico (Expande ao máximo) */}
            <div className={`flex-1 h-full flex items-center overflow-hidden border-l ${ocorrenciasHoje.length > 0 ? 'border-amber-500/30' : 'border-emerald-500/30'} pl-4 bg-slate-900/50 relative`}>
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes ticker {
                        0% { transform: translateX(100vw); }
                        100% { transform: translateX(-100%); }
                    }
                    .animate-ticker-fast {
                        animation: ticker 25s linear infinite;
                        display: inline-flex;
                        will-change: transform;
                    }
                `}} />
                <div className="animate-ticker-fast whitespace-nowrap">
                    {ocorrenciasHoje.length > 0 ? (
                        ocorrenciasHoje.map((occ: any, i: number) => (
                            <div key={i} className="inline-flex items-center font-black uppercase tracking-widest text-lg mr-24">
                                <span className="font-mono text-red-500 bg-red-950 px-2 py-0.5 rounded border border-red-800 mr-3 shadow-md">
                                    {new Date(occ.data_hora_ocorrencia).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                <span className="text-red-100 bg-red-600/60 px-2 py-0.5 rounded mr-3 shadow-sm border border-red-600/50">
                                    {occ.tipo_ocorrencia}
                                </span>
                                {(occ.estacoes?.nome_estacao || occ.areas_fabrica?.nome_area) && (
                                    <span className="text-red-300 mr-3">[{occ.estacoes?.nome_estacao || occ.areas_fabrica?.nome_area}]</span>
                                )}
                                {occ.descricao_evento && (
                                    <span className="text-amber-300 font-bold italic opacity-90">
                                        "{occ.descricao_evento}"
                                    </span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="inline-flex items-center font-black uppercase tracking-widest text-lg mr-24 text-emerald-400 drop-shadow-md">
                            <ShieldCheck size={20} className="mr-3 text-emerald-500" />
                            [ MENSAGEM HST ] ESTAMOS SEM ACIDENTES NESTE MOMENTO! OBRIGADO POR MANTER A FÁBRICA SEGURA!
                        </div>
                    )}
                </div>
                    {/* Shadow Fade Effect */}
                    <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-slate-900 to-transparent pointer-events-none z-10"></div>
                </div>

            {/* Direita: Meta (Permanece encostada à direita se não houver ocorrências, empurrada se houver Ticker vazio) */}
            <div className={`text-slate-500 text-xs font-mono font-bold uppercase flex gap-4 shrink-0 bg-slate-900 z-20 h-full items-center px-6 ${ocorrenciasHoje.length === 0 ? 'ml-auto' : 'border-l border-slate-800'}`}>
                <span className="flex items-center gap-1.5"><Target size={14} /> Meta: 365 Dias</span>
                <span>« ZERO ACIDENTES »</span>
            </div>
        </div>
    );
}

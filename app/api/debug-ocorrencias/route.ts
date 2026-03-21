import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
    const ptFormatter = new Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts = ptFormatter.formatToParts(new Date());
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    
    const todayStartStr = `${year}-${month}-${day}T00:00:00.000Z`;
    const todayEndStr = `${year}-${month}-${day}T23:59:59.999Z`;

    const { data: ocorrenciasHoje, error } = await supabase
        .from('hst_ocorrencias')
        .select('*')
        .gte('data_hora_ocorrencia', todayStartStr)
        .lte('data_hora_ocorrencia', todayEndStr);

    const { data: allOcc } = await supabase.from('hst_ocorrencias').select('*').order('data_hora_ocorrencia', { ascending: false }).limit(5);

    return NextResponse.json({
        timeBounds: { todayStartStr, todayEndStr },
        error,
        ocorrenciasHoje,
        allOcc
    });
}

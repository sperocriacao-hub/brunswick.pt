import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: topTalentosData, error: talentErr } = await supabase
            .from('operadores')
            .select('id, nome_operador, matriz_talento_media, status')
            .eq('status', 'Ativo')
            .not('matriz_talento_media', 'is', null)
            .order('matriz_talento_media', { ascending: false })
            .limit(3);

        const { data: rawEvals } = await supabase
            .from('avaliacoes_diarias')
            .select('*')
            .limit(5);

        return NextResponse.json({ 
            top_talentos: topTalentosData, 
            error: talentErr,
            raw_evals: rawEvals
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

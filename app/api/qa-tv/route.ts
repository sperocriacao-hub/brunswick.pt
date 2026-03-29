import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    const parseDateParts = (dateStr: string) => {
        if (!dateStr) return null;
        try {
            const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
            const p = cleanStr.includes('/') ? cleanStr.split('/') : cleanStr.split('-');
            if (p.length < 3) return null;
            
            let y, m, d;
            if (p[0].length === 4) { y = p[0]; m = p[1]; d = p[2]; } // ISO YYYY/MM/DD
            else { d = p[0]; m = p[1]; y = p[2]; } // EURO DD/MM/YYYY
            
            const pY = parseInt(y.substring(0,4)), pM = parseInt(m, 10), pD = parseInt(d, 10);
            if (isNaN(pY) || isNaN(pM) || isNaN(pD)) return null;
            return { year: pY, month: pM, day: pD, original: dateStr };
        } catch { return null; }
    };

    const { data: opData } = await supabase.from('operadores').select('nome_operador, data_nascimento, data_admissao, status');
    
    if (!opData) return NextResponse.json({ error: "No data" });

    const ativos = opData.filter((o: any) => o.status === 'Ativo' || !o.status);
    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();

    const result = ativos.map(o => ({
        nome: o.nome_operador,
        nascRaw: o.data_nascimento,
        nascParsed: parseDateParts(o.data_nascimento),
        admRaw: o.data_admissao,
        admParsed: parseDateParts(o.data_admissao)
    }));

    const anivs = result.filter(o => o.nascParsed?.month === mesAtual);
    const adms = result.filter(o => o.admParsed?.month === mesAtual && (anoAtual - (o.admParsed?.year || 0) >= 3));

    return NextResponse.json({ 
        mesAtual, 
        anoAtual, 
        totalAtivos: ativos.length, 
        totalAniversarios: anivs.length, 
        totalAdmissoes: adms.length,
        anivs,
        adms,
        all: result.slice(0, 20) // Show first 20 for debugging
    });
}

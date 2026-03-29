import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const s = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    const { data } = await s.from('operadores').select('nome_operador, data_nascimento, data_admissao, status').limit(20);
    return NextResponse.json(data);
}

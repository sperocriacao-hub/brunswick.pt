import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data: areas } = await supabase.from('areas_fabrica').select('id, nome_area');
        return NextResponse.json({ areas });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

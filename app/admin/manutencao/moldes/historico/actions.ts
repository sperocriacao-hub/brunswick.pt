'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function buscarHistoricoIntervencoes() {
    try {
        const { data, error } = await supabase
            .from('moldes_intervencoes')
            .select(`
                id,
                status,
                relatorio,
                data_abertura,
                data_fecho,
                volumetry_ciclos_no_fecho,
                moldes (
                    nome_parte,
                    rfid,
                    categoria
                )
            `)
            .order('data_abertura', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (err: any) {
        console.error('buscarHistoricoIntervencoes Error:', err);
        return { success: false, error: err.message };
    }
}

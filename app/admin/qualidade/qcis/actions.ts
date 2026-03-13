'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function fetchQcisData(filters: { 
    startDate?: string, 
    endDate?: string, 
    linha?: string, 
    modelo?: string, 
    gate?: string, 
    categoria?: string 
} = {}) {
    try {
        let query = supabase.from('qcis_audits').select('*');

        if (filters.startDate) query = query.gte('fail_date', filters.startDate);
        if (filters.endDate) query = query.lte('fail_date', filters.endDate);
        if (filters.linha) query = query.eq('linha_linha', filters.linha);
        if (filters.modelo) query = query.eq('model_ref', filters.modelo);
        if (filters.gate) query = query.eq('lista_gate', filters.gate);
        if (filters.categoria) query = query.eq('lista_categoria', filters.categoria);

        // Limiting to 50000 recent records for memory safety on the edge if no dates are passed.
        query = query.order('fail_date', { ascending: false }).limit(50000);

        const { data, error } = await query;
        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (err: any) {
        console.error("Erro a carregar dados QCIS:", err);
        return { success: false, error: err.message || "Erro desconhecido" };
    }
}

'use server';

import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function fetchQcisData(filters: { 
    startDate?: string, 
    endDate?: string, 
    linha?: string, 
    modelo?: string, 
    gate?: string, 
    categoria?: string,
    _cacheBuster?: string 
} = {}) {
    noStore(); // Desativa ativamente a cache agressiva do Next.js para pedidos Server-Side do Supabase
    try {
        // PostgREST limits queries to 1000 rows by default. Factory data easily exceeds this in 3 days.
        // We must implement automatic range pagination to extract the entire month.
        let allData: any[] = [];
        let from = 0;
        const step = 1000;
        let fetchMore = true;

        while (fetchMore) {
            let paginatedQuery = supabase.from('qcis_audits').select('*');

            // Set default 7-day window to prevent massive DB dumps freezing the UI if no dates are selected
            let effectiveStartDate = filters.startDate;
            if (!filters.startDate && !filters.endDate) {
                const d = new Date();
                d.setDate(d.getDate() - 8); // 8 days to comfortably fit the 6-day rolling window requirement
                effectiveStartDate = d.toISOString().split('T')[0];
            }

            if (effectiveStartDate) paginatedQuery = paginatedQuery.gte('fail_date', effectiveStartDate);
            if (filters.endDate) paginatedQuery = paginatedQuery.lte('fail_date', filters.endDate);
            if (filters.linha) paginatedQuery = paginatedQuery.eq('linha_linha', filters.linha);
            if (filters.modelo) paginatedQuery = paginatedQuery.eq('model_ref', filters.modelo);
            if (filters.gate) paginatedQuery = paginatedQuery.eq('lista_gate', filters.gate);
            if (filters.categoria) paginatedQuery = paginatedQuery.eq('lista_categoria', filters.categoria);

            const { data, error } = await paginatedQuery
                .order('fail_date', { ascending: false })
                .range(from, from + step - 1);

            if (error) throw error;

            if (data && data.length > 0) {
                allData = [...allData, ...data];
                from += step;
                if (data.length < step) {
                    fetchMore = false; // Last page reached
                }
            } else {
                fetchMore = false;
            }

            // Safety break against infinite loops > 100k records (100 pages)
            if (allData.length >= 100000) {
                fetchMore = false;
            }
        }

        return { success: true, data: allData };
    } catch (err: any) {
        console.error("Erro a carregar dados QCIS:", err);
        return { success: false, error: err.message || "Erro desconhecido" };
    }
}

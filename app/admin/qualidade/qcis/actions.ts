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
    noStore(); // Desativa ativamente a cache agressiva do Next.js
    try {
        let allData: any[] = [];
        let from = 0;
        const step = 1000;
        let fetchMore = true;

        while (fetchMore) {
            let paginatedQuery = supabase.from('qcis_audits').select('*');

            // Default fallback just in case the UI fails to send one
            let effectiveStartDate = filters.startDate;
            let effectiveEndDate = filters.endDate;
            if (!filters.startDate && !filters.endDate) {
                const now = new Date();
                effectiveStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                effectiveEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            }

            if (effectiveStartDate) paginatedQuery = paginatedQuery.gte('fail_date', effectiveStartDate);
            if (effectiveEndDate) paginatedQuery = paginatedQuery.lte('fail_date', effectiveEndDate);
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
                    fetchMore = false; 
                }
            } else {
                fetchMore = false;
            }

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

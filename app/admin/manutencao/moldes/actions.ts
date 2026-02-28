'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getMoldesTPM() {
    try {
        const { data, error } = await supabase
            .from('moldes')
            .select('*')
            .order('nome_parte', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (err: any) {
        console.error('getMoldesTPM Error:', err);
        return { success: false, error: err.message };
    }
}

export async function registarManutencaoMolde(moldeId: string) {
    try {
        const { error } = await supabase
            .from('moldes')
            .update({
                ciclos_estimados: 0,
                status: 'Ativo',
                ultima_manutencao_at: new Date().toISOString()
            })
            .eq('id', moldeId);

        if (error) throw error;

        revalidatePath('/admin/manutencao/moldes');
        return { success: true };
    } catch (err: any) {
        console.error('registarManutencaoMolde Error:', err);
        return { success: false, error: err.message };
    }
}

export async function criarIntervencaoManual(moldeId: string, prioridade: string, observacao: string) {
    try {
        // 1. Force the Molde status to Maintenance
        const { error: moldeErr } = await supabase
            .from('moldes')
            .update({ status: 'Em Manutenção' })
            .eq('id', moldeId);

        if (moldeErr) throw moldeErr;

        // 2. Create the Intervention Order
        const { data: invData, error: invErr } = await supabase
            .from('moldes_intervencoes')
            .insert({
                molde_id: moldeId,
                status: 'Aberta',
                prioridade: prioridade === 'CRITICA' ? 'Critica' : prioridade === 'MEDIA' ? 'Media' : 'Baixa',
                descricao: `[Abertura Manual] ${observacao}`,
                reportado_por: 'Operador M.E.S.'
            })
            .select('id')
            .single();

        if (invErr) throw invErr;

        revalidatePath('/admin/manutencao/moldes');
        return { success: true, intervencaoId: invData.id };
    } catch (err: any) {
        console.error('criarIntervencaoManual Error:', err);
        return { success: false, error: err.message };
    }
}

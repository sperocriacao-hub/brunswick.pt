'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// A. Detalhes Base do Molde
// ==========================================
export async function getMoldeDetails(moldeId: string) {
    const { data: molde, error } = await supabase
        .from('moldes')
        .select('*')
        .eq('id', moldeId)
        .single();

    if (error) throw new Error(error.message);
    return molde;
}

// ==========================================
// B. Intervenção TPM Lógica Central
// ==========================================

export async function getActiveOrNewIntervention(moldeId: string) {
    // 1. Verificar se existe alguma intervenção Aberta/Em Progresso para este molde
    const { data: intervencaoAtiva, error: lookupError } = await supabase
        .from('moldes_intervencoes')
        .select('*')
        .eq('molde_id', moldeId)
        .in('status', ['Aberta', 'Em Progresso'])
        .order('data_abertura', { ascending: false })
        .limit(1)
        .single();

    if (lookupError && lookupError.code !== 'PGRST116') {
        throw new Error(lookupError.message);
    }

    if (intervencaoAtiva) {
        return intervencaoAtiva;
    }

    // 2. Se não existe, vamos INAUGURAR automaticamente uma OS de Manutenção (TPM Cycle Over)
    const { data: novaIntervencao, error: createError } = await supabase
        .from('moldes_intervencoes')
        .insert({
            molde_id: moldeId,
            reportado_por: 'Sistema TPM Auto',
            prioridade: 'Media',
            descricao: 'Manutenção Preventiva / Corretiva levantada automaticamente por Limite de Usos ou pedido de chão de fábrica.',
            status: 'Aberta'
        })
        .select()
        .single();

    if (createError) throw new Error(createError.message);

    return novaIntervencao;
}

// ==========================================
// C. SVG Geometry
// ==========================================
export async function getMoldeGeometry(moldeId: string) {
    const { data, error } = await supabase
        .from('moldes_geometria')
        .select('*')
        .eq('molde_id', moldeId)
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data || null; // Return null se este Molde ainda não tiver Blueprint SVG associado
}

// ==========================================
// D. NASA Level - Pin Mapping Methods
// ==========================================
export async function getPinsForIntervention(intervencaoId: string) {
    const { data, error } = await supabase
        .from('moldes_defeitos_pins')
        .select('*')
        .eq('intervencao_id', intervencaoId);

    if (error) throw new Error(error.message);
    return data || [];
}

export async function createPin(intervencaoId: string, x: number, y: number, tipoDefeito: string) {
    const { data, error } = await supabase
        .from('moldes_defeitos_pins')
        .insert({
            intervencao_id: intervencaoId,
            coord_x: x,
            coord_y: y,
            tipo_defeito: tipoDefeito,
            status: 'Aberto'
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

export async function validatePin(pinId: string) {
    const { error } = await supabase
        .from('moldes_defeitos_pins')
        .update({ status: 'Validado' })
        .eq('id', pinId);

    if (error) throw new Error(error.message);
}

export async function closeIntervention(intervencaoId: string, moldeId: string) {
    // 1. Mudar o status da OS para Encerrada
    const { error: osError } = await supabase
        .from('moldes_intervencoes')
        .update({
            status: 'Encerrada',
            data_conclusao: new Date().toISOString()
        })
        .eq('id', intervencaoId);

    if (osError) throw new Error(osError.message);

    // 2. Resetar os Ciclos do Molde (Voltando a Zero) para recomeçar o contador TPM
    const { error: moldeError } = await supabase
        .from('moldes')
        .update({ ciclos_estimados: 0 })
        .eq('id', moldeId);

    if (moldeError) throw new Error(moldeError.message);
}

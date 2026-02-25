'use server';

import { createClient } from '@supabase/supabase-js';
import { dispatchNotification } from '../admin/configuracoes/notificacoes/actions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Usamos Service Role Key (se disponível) porque este é um endpoint M2M (Machine to Machine) 
// que atua "em nome" do ESP32 para contornar RLS de utilizadores logados, 
// embora tenhamos política para "anon" no Supabase para o Insert de RFID.
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function buscarEstacoes() {
    try {
        const { data, error } = await supabase
            .from('estacoes')
            .select(`
                id, 
                nome_estacao,
                areas_fabrica (nome_area)
            `)
            .order('nome_estacao', { ascending: true });

        if (error) throw error;

        const formatadas = data.map((e: any) => {
            const areaName = e.areas_fabrica ? e.areas_fabrica.nome_area : 'Fábrica';
            return {
                id: e.id,
                nome_estacao: `${areaName} - ${e.nome_estacao}`
            };
        });

        return { success: true, estacoes: formatadas };
    } catch (err: unknown) {
        console.error("Erro a buscar estações:", err);
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

// (Removed duplicate/legacy Session and Boat listing queries from Operator dashboard.
// These actions are now routed entirely via the Hardware Emulator hitting `/api/mes/iot` REST endpoint.)

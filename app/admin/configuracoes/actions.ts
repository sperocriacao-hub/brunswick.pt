"use server";

import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the Service Role Key to bypass RLS for data seeding
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    }
);

export async function importDataBulk(tableName: string, dataArray: any[]) {
    if (!tableName || !dataArray || dataArray.length === 0) {
        return { success: false, error: "Tabela vazia ou sem dados válidos para importação." };
    }

    try {
        // Upsert standard function with onConflict ID (assuming all main tables have an 'id' column)
        const { data, error } = await supabaseAdmin
            .from(tableName)
            .upsert(dataArray, { 
                onConflict: 'id', 
                ignoreDuplicates: false 
            })
            .select();

        if (error) {
            console.error(`PostgREST Import Data Error (${tableName}):`, error);
            // Formatar a mensagem RLS ou Violacao de Integridade Relacional de forma limpa
            let readableError = error.message;
            if (error.code === '23503') readableError = `Esta tabela precisa de relacionamentos prévios.\nFalta o Chassi base na tabela principal antes de inserir aqui. (${error.details})`;
            if (error.code === '23505') readableError = `Um ou mais registos já existem e não podem ser duplicados (${error.details})`;
            if (error.code === '42P01') readableError = `A tabela alvo "${tableName}" é inválida ou não existe.`;
            
            return {
                success: false,
                error: `Erro ao Inserir/Atualizar na Tabela "${tableName}": ${readableError}`
            };
        }

        return {
            success: true,
            recordsAffected: dataArray.length,
            message: `Foram processados e inseridos ${dataArray.length} registos com sucesso.`
        };

    } catch (e: any) {
        console.error("Backend Server Error in importDataBulk:", e);
        return { success: false, error: `Falha interna no Servidor M.E.S: ${e.message}` };
    }
}

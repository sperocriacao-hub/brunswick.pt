"use server";

import { createClient } from '@supabase/supabase-js';

export async function importDataBulkStringified(tableName: string, jsonString: string) {
    if (!tableName || !jsonString) {
        return { success: false, error: "Parâmetros de importação em branco." };
    }

    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!url || !key) {
            return { success: false, error: "Servidor mal configurado. Faltam as chaves mestras no ambiente real." };
        }

        const supabaseAdmin = createClient(url, key, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        });

        const dataArray = JSON.parse(jsonString);

        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return { success: false, error: "O Excel fornecido está completamente vazio." };
        }

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
            if (error.code === '23503') readableError = `Esta tabela precisa de relacionamentos prévios.\nPor favor insira as dependências base antes de inserir aqui. (${error.details})`;
            if (error.code === '23505') readableError = `Um ou mais registos já existem e não podem ser duplicados (${error.details})`;
            if (error.code === '42P01') readableError = `A tabela alvo "${tableName}" é inválida ou não existe.`;
            if (error.code === '22P02') readableError = `Existem dados nas células do Excel que não são suportados. (Ex: Letras onde deviam estar Números ou formatação errada). (${error.details})`;
            
            return {
                success: false,
                error: `Erro de Importação ("${tableName}"): ${readableError}`
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

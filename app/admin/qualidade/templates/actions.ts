'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export type FormFieldType = 'texto' | 'numero' | 'checkbox' | 'radio' | 'selecao';

export interface FormField {
    id: string; // Gerado no cliente para arrastar/ordenar
    label: string;
    tipo: FormFieldType;
    obrigatorio: boolean;
    opcoes?: string[]; // Apenas para 'radio' ou 'selecao'
}

export interface FormTemplate {
    id: string;
    nome_formulario: string;
    descricao: string | null;
    schema_json: {
        fields: FormField[];
    };
    ativo: boolean;
    created_at?: string;
}

export async function fetchFormTemplates() {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase
            .from('sys_formularios_template')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, templates: data as FormTemplate[] };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro ao obter templates' };
    }
}

export async function saveFormTemplate(template: Omit<FormTemplate, 'created_at'>) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // Se tem ID, atualiza
        if (template.id && template.id !== 'new') {
            const { error } = await supabase
                .from('sys_formularios_template')
                .update({
                    nome_formulario: template.nome_formulario,
                    descricao: template.descricao,
                    schema_json: template.schema_json,
                    ativo: template.ativo,
                    updated_at: new Date().toISOString()
                })
                .eq('id', template.id);
            if (error) throw error;
        } else {
            // Insere novo (omitindo o ID para deixar o DB gerar uuid)
            const { error } = await supabase
                .from('sys_formularios_template')
                .insert([{
                    nome_formulario: template.nome_formulario,
                    descricao: template.descricao,
                    schema_json: template.schema_json,
                    ativo: template.ativo
                }]);
            if (error) throw error;
        }

        return { success: true };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro ao guardar template' };
    }
}

export async function deleteFormTemplate(id: string) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // O DB tem ON DELETE RESTRICT para respostas se existirem
        const { error } = await supabase
            .from('sys_formularios_template')
            .delete()
            .eq('id', id);

        if (error) {
            // Explicitar a restrição de FK
            if (error.code === '23503') {
                throw new Error("Não é possível apagar: O formulário já possui respostas submetidas no chão de fábrica.");
            }
            throw error;
        }
        return { success: true };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro ao apagar template' };
    }
}

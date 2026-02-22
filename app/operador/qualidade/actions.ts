'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { FormTemplate } from '../../admin/qualidade/templates/actions';

export async function buscarFormulariosDisponiveis() {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase
            .from('sys_formularios_template')
            .select('id, nome_formulario, descricao, schema_json')
            .eq('ativo', true)
            .order('nome_formulario', { ascending: true });

        if (error) throw error;
        return { success: true, templates: data as FormTemplate[] };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro ao obter formulários da fábrica.' };
    }
}

export async function buscarBarcoPorRFID(rfid: string) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // Barco (Ordem de Produção Ativa)
        const { data, error } = await supabase
            .from('ordens_producao')
            .select('id, op_numero, status, id_modelo')
            .eq('tag_rfid_barco', rfid)
            .in('status', ['AGENDAR', 'EMSTR'])
            .single();

        if (error || !data) return { success: false, error: 'Barco não encontrado ou já Despachado.' };

        // Procurar o nome do Modelo
        const { data: modData } = await supabase
            .from('modelos_barcos')
            .select('nome_modelo')
            .eq('id', data.id_modelo)
            .single();

        return {
            success: true,
            ordemProducao: {
                id: data.id,
                numero: data.op_numero,
                modelo: modData?.nome_modelo || 'Modelo Desconhecido'
            }
        };

    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro na leitura RFID.' };
    }
}

export async function submeterChecklist(payload: {
    formulario_id: string;
    ordem_producao_id: string;
    operador_rfid: string;
    respostas_json: Record<string, unknown>;
}) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { error } = await supabase
            .from('sys_formularios_respostas')
            .insert([{
                formulario_id: payload.formulario_id,
                ordem_producao_id: payload.ordem_producao_id,
                operador_rfid: payload.operador_rfid,
                respostas_json: payload.respostas_json
            }]);

        if (error) throw error;

        // Bónus: Registar Avaliação Automática Positiva (Gamificação por cada Formulário)
        if (payload.operador_rfid) {
            await supabase.from('avaliacoes_rh').insert([{
                operador_rfid: payload.operador_rfid,
                nota_iluo: 4, // Excelente (Cumprimento de Checklists)
                categoria_competencia: 'Qualidade/Rigor',
                observacoes: 'Preencheu proactivamente um Formulário de Inspeção.',
                avaliador_id: 'SISTEMA_AUTOMATICO'
            }]);
        }

        return { success: true };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro ao guardar as suas respostas.' };
    }
}

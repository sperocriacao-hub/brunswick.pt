'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';


type InTarefa = { ordem: string; descricao: string; estacao_id: string; imagem_url: string };
type InOpcional = { nome_opcao: string; descricao_opcao: string; tarefas: InTarefa[] };

export interface CriarModeloInput {
    nome_modelo: string;
    model_year: string;
    linha_id: string;
    categoria: string;
    imagem_url: string;

    opcionais: InOpcional[];
}

export async function criarModeloCompleto(input: CriarModeloInput): Promise<{ success: boolean; error?: string; modeloId?: string }> {
    try {
        const cookieStore = cookies() as any;
        const supabase = createClient(cookieStore);

        // 1. Inserir o Modelo
        const { data: modeloCriado, error: errModelo } = await supabase
            .from('modelos')
            .insert({
                nome_modelo: input.nome_modelo,
                model_year: input.model_year,
                linha_id: input.linha_id || null,
                categoria: input.categoria || null,
                imagem_url: input.imagem_url || null,
                status: 'Em Desenvolvimento',
                versao: '1.0'
            })
            .select('id')
            .single();

        if (errModelo) throw errModelo;
        const modeloId = modeloCriado.id;

        // Roteiros (Tarefas Básicas) were removed from here because they are now managed in the "Engenharia > Roteiros (B.O.M)" module.

        // 4 & 5. Inserir Opcionais e suas Tarefas
        if (input.opcionais.length > 0) {
            for (const op of input.opcionais) {
                // Inserir Opcional pai
                const { data: opCriado, error: errOp } = await supabase
                    .from('opcionais')
                    .insert({
                        modelo_id: modeloId,
                        nome_opcao: op.nome_opcao,
                        descricao_opcao: op.descricao_opcao
                    })
                    .select('id')
                    .single();

                if (errOp) throw errOp;

                // Inserir Tarefas filhas
                if (op.tarefas.length > 0) {
                    const tarefasPayload = op.tarefas.map(t => ({
                        opcao_id: opCriado.id,
                        ordem_tarefa: parseInt(t.ordem) || 1,
                        descricao_tarefa: t.descricao,
                        estacao_destino_id: t.estacao_id || null,
                        imagem_instrucao_url: t.imagem_url || null
                    }));
                    const { error: errTOp } = await supabase.from('tarefas_opcionais').insert(tarefasPayload);
                    if (errTOp) throw errTOp;
                }
            }
        }

        return { success: true, modeloId };

    } catch (err: unknown) {
        let msg = "Erro desconhecido ao guardar o novo Modelo de Embarcação.";
        if (err instanceof Error) msg = err.message;
        else if (typeof err === 'object' && err !== null) msg = JSON.stringify(err);
        return { success: false, error: msg };
    }
}

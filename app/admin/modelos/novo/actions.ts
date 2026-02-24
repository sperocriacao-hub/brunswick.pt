'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

type InParte = { nome_parte: string; categoria: string; tag_rfid_molde: string };
type InTarefa = { ordem: string; descricao: string; estacao_id: string; imagem_url: string };
type InOpcional = { nome_opcao: string; descricao_opcao: string; tarefas: InTarefa[] };

export interface CriarModeloInput {
    nome_modelo: string;
    model_year: string;
    partes: InParte[];
    tarefasGerais: InTarefa[];
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
                status: 'Em Desenvolvimento',
                versao: '1.0'
            })
            .select('id')
            .single();

        if (errModelo) throw errModelo;
        const modeloId = modeloCriado.id;

        // 2. Inserir Partes / Moldes Associados (B.O.M.)
        if (input.partes.length > 0) {
            const partesPayload = input.partes.map(p => ({
                modelo_id: modeloId,
                nome_parte: p.nome_parte,
                categoria: p.categoria || 'Medium',
                tag_rfid_molde: p.tag_rfid_molde || null
            }));
            const { error: errPartes } = await supabase.from('composicao_modelo').insert(partesPayload);
            if (errPartes) throw errPartes;
        }

        // 3. Inserir Roteiros de Produção Gerais (Tarefas Básicas)
        if (input.tarefasGerais.length > 0) {
            const roteirosPayload = input.tarefasGerais.map(t => ({
                modelo_id: modeloId,
                sequencia: parseInt(t.ordem) || 1,
                descricao_tarefa: t.descricao,
                estacao_id: t.estacao_id || null,
                imagem_instrucao_url: t.imagem_url || null,
                tempo_ciclo: 0,
                offset_dias: 0,
                duracao_dias: 1
            }));
            const { error: errRoteiro } = await supabase.from('roteiros_producao').insert(roteirosPayload);
            if (errRoteiro) throw errRoteiro;
        }

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

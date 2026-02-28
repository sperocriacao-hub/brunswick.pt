'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

type InTarefa = { id?: string; ordem: string; descricao: string; estacao_id: string; imagem_url: string };
type InOpcional = { id?: string; nome_opcao: string; descricao_opcao: string; tarefas: InTarefa[] };

export interface EditarModeloInput {
    id: string;
    nome_modelo: string;
    model_year: string;
    status: string;
    tarefasGerais: InTarefa[];
    opcionais: InOpcional[];
}

export async function fetchModeloParaEdicao(modeloId: string) {
    try {
        const cookieStore = cookies() as any;
        const supabase = createClient(cookieStore);

        // 1. Fetch Model Data
        const { data: modelo, error: errModelo } = await supabase
            .from('modelos')
            .select('*')
            .eq('id', modeloId)
            .single();

        if (errModelo) throw errModelo;

        // 2. Fetch General Tasks (Roteiros Producao)
        const { data: roteiros, error: errRoteiros } = await supabase
            .from('roteiros_producao')
            .select('*')
            .eq('modelo_id', modeloId)
            .order('sequencia', { ascending: true });

        if (errRoteiros) throw errRoteiros;

        const tarefasGerais: InTarefa[] = (roteiros || []).map(r => ({
            id: r.id,
            ordem: r.sequencia.toString(),
            descricao: r.descricao_tarefa,
            estacao_id: r.estacao_id || '',
            imagem_url: r.imagem_instrucao_url || ''
        }));

        // 3. Fetch Opcionais
        const { data: opcionaisDb, error: errOpcionais } = await supabase
            .from('opcionais')
            .select('*')
            .eq('modelo_id', modeloId);

        if (errOpcionais) throw errOpcionais;

        const opcionais: InOpcional[] = [];

        for (const op of (opcionaisDb || [])) {
            // Fetch Tarefas Opcionais
            const { data: tarefasOpDb } = await supabase
                .from('tarefas_opcionais')
                .select('*')
                .eq('opcao_id', op.id)
                .order('ordem_tarefa', { ascending: true });

            const tarefasIn: InTarefa[] = (tarefasOpDb || []).map(t => ({
                id: t.id,
                ordem: t.ordem_tarefa.toString(),
                descricao: t.descricao_tarefa,
                estacao_id: t.estacao_destino_id || '',
                imagem_url: t.imagem_instrucao_url || ''
            }));

            opcionais.push({
                id: op.id,
                nome_opcao: op.nome_opcao,
                descricao_opcao: op.descricao_opcao || '',
                tarefas: tarefasIn
            });
        }

        return {
            success: true,
            data: {
                nome_modelo: modelo.nome_modelo,
                model_year: modelo.model_year,
                status: modelo.status,
                tarefasGerais,
                opcionais
            }
        };

    } catch (err: any) {
        console.error("fetchModeloParaEdicao error:", err);
        return { success: false, error: err.message };
    }
}

export async function atualizarModeloCompleto(input: EditarModeloInput): Promise<{ success: boolean; error?: string }> {
    try {
        const cookieStore = cookies() as any;
        const supabase = createClient(cookieStore);

        // 1. Update Base Model
        const { error: errModelo } = await supabase
            .from('modelos')
            .update({
                nome_modelo: input.nome_modelo,
                model_year: input.model_year,
                status: input.status
            })
            .eq('id', input.id);

        if (errModelo) throw errModelo;

        // --- THE "EASY" WAY FOR NESTED EDITS IS TO PURGE AND RECREATE ---
        // Warning: This destroys old Task IDs. If there are relational integrity 
        // constraints (like Logs pointing to specific Task IDs), a Diffing algorithm is needed.
        // Assuming Roteiros are templates, purging is usually safe.

        // 2. Purge & Recreate Tarefas Gerais
        await supabase.from('roteiros_producao').delete().eq('modelo_id', input.id);

        if (input.tarefasGerais.length > 0) {
            const roteirosPayload = input.tarefasGerais.map(t => ({
                modelo_id: input.id,
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

        // 3. Opcionais Hierarchy Refresh
        // We delete all Opcionais for this model. Cascade delete should handle `tarefas_opcionais`.
        await supabase.from('opcionais').delete().eq('modelo_id', input.id);

        if (input.opcionais.length > 0) {
            for (const op of input.opcionais) {
                const { data: opCriado, error: errOp } = await supabase
                    .from('opcionais')
                    .insert({
                        modelo_id: input.id,
                        nome_opcao: op.nome_opcao,
                        descricao_opcao: op.descricao_opcao
                    })
                    .select('id')
                    .single();

                if (errOp) throw errOp;

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

        return { success: true };

    } catch (err: any) {
        console.error("atualizarModeloCompleto error:", err);
        return { success: false, error: err.message };
    }
}

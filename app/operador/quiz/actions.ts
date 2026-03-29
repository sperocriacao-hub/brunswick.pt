"use server";

import { createClient } from '@/utils/supabase/server';
import { PerguntaQuiz } from '@/app/admin/rh/quiz-cultura/actions';

export type IdentidadeAnonima = {
    lider_nome: string | null;
    supervisor_nome: string | null;
    gestor_nome: string | null;
    area_nome: string | null;
};

export async function iniciarSessaoQuiosque(numero_ou_rfid: string): Promise<{ success: boolean; data?: IdentidadeAnonima; error?: string }> {
    const supabase = await createClient();

    // 1. Encontrar o Operador pelo Numero (Simulação de Crachá ou Input Touch)
    const { data: opData, error } = await supabase
        .from('operadores')
        .select(`
            lider_nome,
            supervisor_nome,
            gestor_nome,
            areas_fabrica (nome_area),
            status
        `)
        .eq('numero_operador', numero_ou_rfid)
        .single();

    if (error || !opData) {
        return { success: false, error: "Credencial inválida ou Operador não encontrado." };
    }

    if (opData.status !== 'Ativo') {
        return { success: false, error: "Colaborador encontra-se Inativo." };
    }

    return {
        success: true,
        data: {
            lider_nome: opData.lider_nome,
            supervisor_nome: opData.supervisor_nome,
            gestor_nome: opData.gestor_nome,
            area_nome: (opData.areas_fabrica as any)?.nome_area || 'Geral'
        }
    };
}

export async function carregarPerguntasAtivasParaQuiosque() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('quiz_cultura_perguntas')
        .select('*')
        .eq('status', 'Ativa')
        .order('criado_em', { ascending: true });

    if (error) {
        console.error("Erro ao carregar Quiz:", error);
        return { success: false, data: [] };
    }
    
    return { success: true, data: data as PerguntaQuiz[] };
}

export type RespostaAnonimaDTO = {
    pergunta_id: string;
    nota: number;
    lider_avaliado_nome: string | null;
    escala_alvo: string | null;
};

export async function submeterQuizAnonimo(respostas: RespostaAnonimaDTO[]) {
    const supabase = await createClient();
    
    // Inserção em Bulk - Não passamos Quem fez, apenas a data e as notas!
    const payloads = respostas.map(r => ({
        pergunta_id: r.pergunta_id,
        nota: r.nota,
        lider_avaliado_nome: r.lider_avaliado_nome,
        escala_alvo: r.escala_alvo
    }));

    const { error } = await supabase
        .from('quiz_cultura_respostas')
        .insert(payloads);

    if (error) {
        console.error("Erro a Gravar inquérito:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

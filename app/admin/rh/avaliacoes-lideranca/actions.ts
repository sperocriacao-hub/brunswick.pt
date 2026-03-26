'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function carregarEquipaLideranca() {
    try {
        const cookieStore = cookies();
        const supabase = await createClient(cookieStore);

        // Quem está logado?
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Não Autorizado");

        // Obter função de quem está logado
        let minLevel = 0; // 0 = nobody, 1 = Supervisor (sees Lider), 2 = Gestor (sees Supervisor, Lider), 3 = Admin (sees all)
        
        if (user.email === 'master@brunswick.pt') {
             minLevel = 3;
        } else {
             const { data: myData } = await supabase.from('operadores').select('funcao').eq('email_acesso', user.email).single();
             if (myData?.funcao === 'Gestor') minLevel = 2;
             else if (myData?.funcao === 'Supervisor') minLevel = 1;
        }

        if (minLevel === 0) return { success: false, error: "Nível hierárquico insuficiente para avaliar liderança." };

        let permissoesAcesso: string[] = [];
        if (minLevel >= 1) permissoesAcesso.push('Coordenador de Grupo', 'Líder de equipa', 'Lider de equipa');
        if (minLevel >= 2) permissoesAcesso.push('Supervisor');
        if (minLevel >= 3) permissoesAcesso.push('Gestor'); // Se for Master

        const { data, error } = await supabase
            .from('operadores')
            .select('id, numero_operador, nome_operador, funcao, status, area_base_id, areas_fabrica(nome_area)')
            .eq('status', 'Ativo')
            .in('funcao', permissoesAcesso)
            .order('nome_operador');

        if (error) throw error;
        return { success: true, operadores: data, myLevel: minLevel };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

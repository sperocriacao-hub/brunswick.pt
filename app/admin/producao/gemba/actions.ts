'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function getGembaHubData() {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user?.email) throw new Error("Não Autorizado");

        // 1. Achar as fronteiras de Segurança
        let isGlobal = false;
        let meuNome = "";
        let filterString = "";
        
        if (userData.user.email === 'master@brunswick.pt') {
            isGlobal = true;
        } else {
            const { data: myData } = await supabase.from('operadores').select('nome_operador, nivel_permissao').eq('email_acesso', userData.user.email).single();
            if (myData) {
                if (myData.nivel_permissao === 'Admin' || myData.nivel_permissao === 'Recursos Humanos') {
                    isGlobal = true;
                } else {
                    meuNome = myData.nome_operador;
                    filterString = `lider_nome.eq."${meuNome}",supervisor_nome.eq."${meuNome}",gestor_nome.eq."${meuNome}"`;
                }
            } else {
                throw new Error("Credenciais Inválidas na Matriz de Talentos");
            }
        }

        // 2. Descobrir as Estações sob a jurisdição do Líder (Postos Base dos Operadores dele)
        let queryOps = supabase.from('operadores').select('id, nome_operador, posto_base_id, area_base_id, tag_rfid_operador').eq('status', 'Ativo');
        if (!isGlobal && filterString) queryOps = queryOps.or(filterString);
        
        const { data: teamOps } = await queryOps;
        const myOps = teamOps || [];
        const myStations = Array.from(new Set(myOps.map(op => op.posto_base_id).filter(Boolean)));
        const myRfids = Array.from(new Set(myOps.map(op => op.tag_rfid_operador).filter(Boolean)));

        // Se o lider nao tiver estacoes/equipa e nao for global, devolvemos tudo vazio
        if (!isGlobal && myStations.length === 0 && myOps.length === 0) {
            return { success: true, data: { andonsCausador: [], andonsVitima: [], ausentes: [], userName: meuNome }};
        }

        // 3. ANDONS (Em Tempo Real - Não resolvidos)
        let andonsQuery = supabase
            .from('alertas_andon')
            .select('*, estacoes!estacao_id(nome_estacao), causadoras:estacoes!estacao_causadora(nome_estacao)')
            .eq('resolvido', false);

        if (!isGlobal) {
             if (myStations.length > 0) {
                 const inClause = `(${myStations.map(s => `"${s}"`).join(',')})`;
                 andonsQuery = andonsQuery.or(`estacao_causadora.in.${inClause},estacao_id.in.${inClause}`);
             } else {
                 andonsQuery = andonsQuery.eq('id', 'block-security');
             }
        }

        const { data: rawAndons } = await andonsQuery;

        const andonsCausador: any[] = [];
        const andonsVitima: any[] = [];

        if (rawAndons) {
            rawAndons.forEach(a => {
                const isCausador = isGlobal || myStations.includes(a.estacao_causadora);
                const isVitima = isGlobal || myStations.includes(a.estacao_id);

                if (isCausador) andonsCausador.push(a);
                else if (isVitima) andonsVitima.push(a);
            });
        }

        // 4. Headcount Absentismo Hoje
        const today = new Date().toISOString().split('T')[0];
        const { data: presencasRaw } = await supabase.from('log_ponto_diario')
            .select('operador_rfid')
            .gte('timestamp', `${today}T00:00:00Z`)
            .lte('timestamp', `${today}T23:59:59Z`);

        const allRfidsPresentes = new Set((presencasRaw || []).map((p: any) => p.operador_rfid));
        
        const ausentes: any[] = [];
        // Se houver pelo menos 1 picagem global na fabrica, assumimos que o turno começou
        const turnoIniciado = allRfidsPresentes.size > 0;

        if (turnoIniciado) {
            myOps.forEach(op => {
                if (op.tag_rfid_operador && !allRfidsPresentes.has(op.tag_rfid_operador)) {
                    ausentes.push(op);
                }
            });
        }

        return { 
            success: true, 
            data: {
                andonsCausador,
                andonsVitima,
                ausentes,
                myStationsCount: myStations.length,
                myOpsCount: myOps.length,
                isGlobal,
                userName: meuNome,
                turnoIniciado
            }
        };

    } catch (err: any) {
         return { success: false, error: err?.message };
    }
}

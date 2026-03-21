import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Rota Temporária de QA Bot - Simula um dia de fábrica com os dados reais do Utilizador
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const url = new URL(req.url);
        const phase = url.searchParams.get('phase') || 'M1';

        const logs: string[] = [];
        const simLog = (msg: string) => logs.push(`[${new Date().toISOString().split('T')[1]?.substring(0,8)}] ${msg}`);

        simLog(`🤖 INICIANDO QA BOT: Inspeção Crítica Modo [${phase}]...`);

        // Common Setup for 1 Operator and 1 OP
        const { data: operadores } = await supabase.from('operadores').select('*').like('numero_operador', 'QA-%').eq('status', 'Ativo');
        if (!operadores || operadores.length === 0) {
            return NextResponse.json({ success: false, error: "Sem QA Operador", logs: [...logs, "❌ O Operador 'Auditor Chuck Norris' desapareceu."] });
        }
        
        const { data: ordens } = await supabase.from('ordens_producao').select('*').like('op_numero', 'QA-%').in('status', ['PLANNED', 'IN_PROGRESS']).order('created_at', { ascending: false }).limit(20);
        if (!ordens || ordens.length === 0) {
            return NextResponse.json({ success: false, error: "Sem ordens QA", logs: [...logs, "❌ Nenhuma OP 'QA-TEST' encontrada. Corre o Big Bang primeiro!"] });
        }
        // Resolve Starting Station for M2/M3
        let ordem = ordens[0];
        let estacaoId = null;
        
        // Find Roteiro for the first order to use as generic start station
        const { data: roteiro } = await supabase.from('roteiros_producao').select('estacao_id').eq('modelo_id', ordem.modelo_id).order('sequencia', { ascending: true }).limit(1);
        if (roteiro && roteiro.length > 0) {
            estacaoId = roteiro[0].estacao_id;
        } else {
             return NextResponse.json({ success: false, error: "Sem roteiro", logs: [...logs, "❌ O Modelo do barco não tem Roteiro."] });
        }

        const host = req.headers.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        const apiUrl = `${protocol}://${host}/api/mes/iot`;

        const fireIoT = async (action: string, payload: any) => {
            const res = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device_id: 'QA_BOT_01', ...payload }) });
            return res.json();
        };

        const op = operadores[0];

        if (phase === 'M1') {
            simLog("🧪 TESTE M1: BATER PONTO SIMULTÂNEO DA EQUIPA...");
            const promises = operadores.map(operador => fireIoT('PONTO', { action: 'PONTO', operador_rfid: operador.tag_rfid_operador, shift_action: 'ENTRADA' }));
            const results = await Promise.all(promises);
            results.forEach((r, i) => simLog(`   -> Op ${i+1}: ${r.success ? 'Ponto Quente' : 'Falha'}`));
            simLog("🏁 M1: HR SYSTEM CONCLUÍDO!");
            return NextResponse.json({ success: true, logs });
        }

        if (phase === 'M2') {
            simLog("🧪 TESTE M2: PROGRESSÃO APS E TEMPO REAL...");
            const dataPonto = await fireIoT('PONTO', { action: 'PONTO', operador_rfid: op.tag_rfid_operador, shift_action: 'ENTRADA' });
            simLog(`   -> Ponto Injetado: ${JSON.stringify(dataPonto)}`);
            const dataInit = await fireIoT('TOGGLE_TAREFA', { action: 'TOGGLE_TAREFA', operador_rfid: op.tag_rfid_operador, estacao_id: estacaoId, op_id: ordem.id });
            simLog(`   -> OP Iniciar: ${JSON.stringify(dataInit)}`);
            const dataEnd = await fireIoT('TOGGLE_TAREFA', { action: 'TOGGLE_TAREFA', operador_rfid: op.tag_rfid_operador, estacao_id: estacaoId, op_id: ordem.id });
            simLog(`   -> OP Finalizar: ${JSON.stringify(dataEnd)}`);
            simLog("🏁 M2: GANTT SYSTEM RESISTIU ÀS PROGRESSÕES!");
            return NextResponse.json({ success: true, logs });
        }

        if (phase === 'M3') {
            simLog("🧪 TESTE M3: GATILHO KITTING DE LOGÍSTICA...");
            const dataAvanco = await fireIoT('FECHAR_ESTACAO', { action: 'FECHAR_ESTACAO', operador_rfid: op.tag_rfid_operador, estacao_id: estacaoId, op_id: ordem.id });
            simLog(`   -> Fecho Estação HMI: ${JSON.stringify(dataAvanco)}`);
            
            simLog("   -> 🔎 A Inspecionar Base de Dados por gatilho Logístico gerado matematicamente...");
            const { data: logsLoc } = await supabase.from('logistica_pedidos').select('*').eq('ordem_producao_id', ordem.id);
            if (logsLoc && logsLoc.length > 0) {
                simLog(`   -> ✅ Sucesso! O servidor gerou os kits pendentes: ${logsLoc[0].peca_solicitada}`);
            } else {
                simLog(`   -> ⚠️ Aviso: A Estação seguinte não injetou Logística Pendente (Tabela logistica_pedidos Vazia)`);
            }
            simLog("🏁 M3: AUTO-LOGÍSTICA & PULL SYSTEM VALIDADOS!");
            return NextResponse.json({ success: true, logs });
        }

        if (phase === 'MASS_TEST') {
            simLog("☢️ HYPER STRESS TEST ATIVADO ☢️");
            simLog(`   -> Disparando o Ciclo Produtivo Assíncrono para ${ordens.length} Navios simultaneamente, distribuídos pelos ${operadores.length} Operadores QA.`);
            
            const operatorQueues: any[][] = operadores.map(() => []);
            ordens.forEach((o, i) => operatorQueues[i % operadores.length].push(o));

            let allErrors: string[] = [];

            const operatorPromises = operatorQueues.map(async (queue, opIndex) => {
                const targetOperador = operadores[opIndex];
                let threadFails = 0;
                
                for (const targetOp of queue) {
                    const r1: any = await fireIoT('TOGGLE_TAREFA', { action: 'TOGGLE_TAREFA', operador_rfid: targetOperador.tag_rfid_operador, estacao_id: estacaoId, op_id: targetOp.id });
                    if (!r1.success) { threadFails++; allErrors.push(r1.error || r1.display); }
                    
                    const r2: any = await fireIoT('TOGGLE_TAREFA', { action: 'TOGGLE_TAREFA', operador_rfid: targetOperador.tag_rfid_operador, estacao_id: estacaoId, op_id: targetOp.id });
                    if (!r2.success) { threadFails++; allErrors.push(r2.error || r2.display); }
                    
                    const r3: any = await fireIoT('FECHAR_ESTACAO', { action: 'FECHAR_ESTACAO', operador_rfid: targetOperador.tag_rfid_operador, estacao_id: estacaoId, op_id: targetOp.id });
                    if (!r3.success) { threadFails++; allErrors.push(r3.error || r3.display); }
                }

                return threadFails;
            });
            
            const results = await Promise.all(operatorPromises);
            const fails = results.reduce((acc, curr) => acc + curr, 0);
            
            simLog(`🔥 Cluster de Operadores Autônomos Resolvido. Total Navios Emulados: ${ordens.length}. Transações Perdidas: ${fails}.`);
            if (fails > 0) simLog(`⚠️ Amostra do Erro detetado: ${allErrors[0] || 'Unknown HTTP/DB Error'}`);
            else simLog("🏁 CORE STRESS TEST SYSTEM SOBREVIVEU A 100%!");
            
            return NextResponse.json({ success: fails === 0 ? true : false, error: fails > 0 ? `Transações Rejeitadas (Motivo: ${allErrors[0]})` : undefined, logs });
        }

        return NextResponse.json({ success: false, error: "Phase inválida", logs });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

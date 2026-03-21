import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Rota Temporária de QA Bot - Simula um dia de fábrica com os dados reais do Utilizador
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const logs: string[] = [];
        const simLog = (msg: string) => logs.push(`[${new Date().toISOString().split('T')[1]?.substring(0,8)}] ${msg}`);

        simLog("🤖 INICIANDO QA BOT: Inspeção da Fábrica...");

        // 1. Encontrar um Operador Ativo
        const { data: operadores } = await supabase.from('operadores').select('*').eq('status', 'Ativo').limit(3);
        if (!operadores || operadores.length === 0) {
            return NextResponse.json({ success: false, logs: [...logs, "❌ FALHA: Nenhum Operador 'Ativo' encontrado no sistema."] });
        }
        const op = operadores[0];
        simLog(`✅ Operador Escalonado: ${op.nome_operador} (RFID: ${op.tag_rfid_operador})`);

        // 2. Encontrar uma O.P em Planeamento ou Produção
        const { data: ordens } = await supabase.from('ordens_producao').select('*').in('status', ['PLANNED', 'IN_PROGRESS']).limit(1);
        if (!ordens || ordens.length === 0) {
            return NextResponse.json({ success: false, logs: [...logs, "❌ FALHA: Nenhuma OP 'PLANNED' ou 'IN_PROGRESS' encontrada. Crie uma Ordem de Produção no Admin primeiro."] });
        }
        const ordem = ordens[0];
        simLog(`✅ OP Agendada Detetada: ${ordem.op_numero} (Status: ${ordem.status})`);

        // 3. Descobrir a primeira estação do roteiro desta OP
        const { data: roteiro } = await supabase.from('roteiros_producao').select('estacao_id, sequencia').eq('modelo_id', ordem.modelo_id).order('sequencia', { ascending: true }).limit(1);
        if (!roteiro || roteiro.length === 0) {
            return NextResponse.json({ success: false, logs: [...logs, `❌ FALHA: O modelo do barco não tem um Roteiro de Produção definido.`] });
        }
        const estacaoId = roteiro[0].estacao_id;
        const { data: estacaoData } = await supabase.from('estacoes').select('nome_estacao').eq('id', estacaoId).single();
        simLog(`✅ Estação de Início: ${estacaoData?.nome_estacao || estacaoId}`);

        simLog("⚙️ INICIANDO SIMULAÇÃO DE IOT/HARDWARE ESP32...");

        const host = req.headers.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        const apiUrl = `${protocol}://${host}/api/mes/iot`;

        const fireIoT = async (action: string, payload: any) => {
            simLog(`📡 Enviando REST [${action}]...`);
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_id: 'QA_BOT_01', ...payload })
            });
            const data = await res.json();
            simLog(`   -> Resposta: ${JSON.stringify(data)}`);
            return data;
        };

        // PASSO A: Bater o Ponto Diário (Entrada)
        await fireIoT('PONTO', { action: 'PONTO', operador_rfid: op.tag_rfid_operador, shift_action: 'ENTRADA' });

        // PASSO B: Iniciar Tarefa no Barco (Clock IN OEE)
        await fireIoT('TOGGLE_TAREFA', { action: 'TOGGLE_TAREFA', operador_rfid: op.tag_rfid_operador, estacao_id: estacaoId, op_id: ordem.id });

        // PASSO C: Simular que passaram 2 segundos e ele Finalizou a Tarefa! (Clock OUT OEE)
        await fireIoT('TOGGLE_TAREFA', { action: 'TOGGLE_TAREFA', operador_rfid: op.tag_rfid_operador, estacao_id: estacaoId, op_id: ordem.id });

        // PASSO D: Fechar a Estação (Botão UP) para avançar o Barco
        await fireIoT('FECHAR_ESTACAO', { action: 'FECHAR_ESTACAO', operador_rfid: op.tag_rfid_operador, estacao_id: estacaoId, op_id: ordem.id });

        simLog("🏁 SIMULAÇÃO DE TURNO DE 1 BARCO CONCLUÍDA COM SUCESSO!");

        return NextResponse.json({ success: true, logs });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

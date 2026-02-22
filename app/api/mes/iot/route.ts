import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Rota de Ingestão de Telemetria e Comandos do Chão de Fábrica (Hub NASA / ESP32)
// Forçamos dinâmico para evitar caching do Next.js App Router
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { device_id, action, operador_rfid, estacao_id, op_id } = body;

        // Validar credenciais mínimas Anon ESP32 enviadas por Headers ou via Payload
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ success: false, error: 'Server Missconfiguration (API Keys)' }, { status: 500 });
        }

        // Usar privilégios de Service Role para operações logísticas críticas
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        if (!action || !operador_rfid) {
            return NextResponse.json({ success: false, error: 'Payload incompleto. Requer "action" e "operador_rfid"' }, { status: 400 });
        }

        // Verificar Operador Mestre
        const { data: operador, error: errOp } = await supabase
            .from('operadores')
            .select('id, nome_operador, status')
            .eq('tag_rfid_operador', operador_rfid)
            .single();

        if (errOp || !operador) {
            return NextResponse.json({ success: false, error: 'Colaborador RFID Desconhecido ou Inválido', display: 'RFID DESCONHECIDO' }, { status: 404 });
        }
        if (operador.status !== 'Ativo') {
            return NextResponse.json({ success: false, error: 'Colaborador Inativo', display: 'ACESSO NEGADO' }, { status: 403 });
        }

        const nomeOperador = operador.nome_operador.split(' ')[0] || 'Op';

        // 1. AÇÃO: ASSIDUIDADE (PONTO RH DIÁRIO)
        if (action === 'PONTO') {
            // Verificar último registo do dia deste operador
            const hojeIso = new Date().toISOString().split('T')[0];
            const { data: ultimoReg } = await supabase
                .from('log_ponto_diario')
                .select('tipo_registo, timestamp')
                .eq('operador_rfid', operador_rfid)
                .gte('timestamp', `${hojeIso}T00:00:00Z`)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            let novoTipo = 'ENTRADA';
            if (ultimoReg && ultimoReg.tipo_registo === 'ENTRADA') {
                novoTipo = 'SAIDA';
            }

            const { error: errPonto } = await supabase.from('log_ponto_diario').insert({
                operador_rfid,
                estacao_id: estacao_id || null,
                tipo_registo: novoTipo
            });

            if (errPonto) throw errPonto;

            return NextResponse.json({
                success: true,
                display: `${novoTipo === 'ENTRADA' ? 'BOM TRABALHO' : 'FIM DE TURNO'}`,
                display_2: nomeOperador
            });
        }

        // 2. AÇÃO: MICRO-OEE (INICIAR/CONCLUIR TAREFA NUM BARCO) & AUTO-FECHAR PAUSAS
        if (action === 'TOGGLE_TAREFA') {
            if (!op_id || !estacao_id) {
                return NextResponse.json({ success: false, error: 'Falta op_id ou estacao_id para iniciar tarefa', display: 'ERRO DADOS' }, { status: 400 });
            }

            // Descobrir OP Number para Display LCD
            const { data: opInfo } = await supabase.from('ordens_producao').select('op_numero').eq('id', op_id).single();
            const opDisp = opInfo ? opInfo.op_numero : '';

            // [FASE 20]: AUTO-ENCERRAR PAUSA ABERTA (O Operador voltou ao posto de outra estação ou WC e picou num barco novo!)
            await supabase.from('log_pausas_operador')
                .update({ timestamp_fim: new Date().toISOString() })
                .eq('operador_rfid', operador_rfid)
                .is('timestamp_fim', null);

            // Verificar se o Colaborador já tem uma Tarefa Aberta NESTE Barco e NESTA Estação
            const { data: wipTask } = await supabase
                .from('registos_rfid_realtime')
                .select('id')
                .eq('op_id', op_id)
                .eq('estacao_id', estacao_id)
                .eq('operador_rfid', operador_rfid)
                .is('timestamp_fim', null)
                .single();

            if (wipTask) {
                // Existe => Vamos Fechar a Tarefa (Clock-OUT)
                await supabase.from('registos_rfid_realtime').update({ timestamp_fim: new Date().toISOString() }).eq('id', wipTask.id);
                return NextResponse.json({ success: true, display: 'TAREFA FIM', display_2: opDisp });
            } else {
                // Não existe => Vamos Abrir Tarefa (Clock-IN)
                await supabase.from('registos_rfid_realtime').insert({
                    op_id,
                    estacao_id,
                    operador_rfid,
                    barco_rfid: op_id // Na arquitetura pull o op_id substitui provisao barcorfid
                });
                return NextResponse.json({ success: true, display: 'TAREFA ABERTA', display_2: opDisp });
            }
        }

        // 2.5 AÇÃO [FASE 20]: REGISTAR PAUSA NVA (WC, MEDICO, ETC)
        if (action === 'REGISTAR_PAUSA') {
            const { motivo_pausa } = body;
            const validMotivo = motivo_pausa?.toUpperCase() || 'WC';

            // 1. Fechar imediatamente qualquer "Barco" ou Tarefa em que ele estivesse agarrado para nao contabilizar na OEE!
            await supabase.from('registos_rfid_realtime')
                .update({ timestamp_fim: new Date().toISOString() })
                .eq('operador_rfid', operador_rfid)
                .is('timestamp_fim', null);

            // 2. Encerrar qualquer pausa anterior perdida dele, só por precação do sistema
            await supabase.from('log_pausas_operador')
                .update({ timestamp_fim: new Date().toISOString() })
                .eq('operador_rfid', operador_rfid)
                .is('timestamp_fim', null);

            // 3. Abrir a Nova Pausa Oficial
            const { error: errPausa } = await supabase.from('log_pausas_operador').insert({
                operador_rfid,
                estacao_id: estacao_id || null, // Se vier de um device estático, guarda o ultimo Known Location
                motivo: validMotivo
            });

            if (errPausa) {
                return NextResponse.json({ success: false, error: errPausa.message, display: 'ERRO GRAVACAO' });
            }
            return NextResponse.json({ success: true, display: 'PAUSA INICIADA', display_2: validMotivo });
        }

        // 3. AÇÃO: MACRO-OEE (FECHAR A ESTAÇÃO APÓS BOTÃO FÍSICO UP+SELECT)
        if (action === 'FECHAR_ESTACAO') {
            if (!op_id || !estacao_id) {
                return NextResponse.json({ success: false, display: 'ERRO DADOS' }, { status: 400 });
            }

            const { error: errFecho } = await supabase.from('log_estacao_conclusao').insert({
                op_id, estacao_id, operador_rfid
            });

            // Se for Unique Constraint (já fechado) ou outro erro
            if (errFecho) {
                return NextResponse.json({ success: false, error: errFecho.message, display: 'JA FECHADO' });
            }

            return NextResponse.json({ success: true, display: 'ESTACAO FECHADA', display_2: 'BARCO AVANCOU' });
        }

        // 4. AÇÃO: LINHA PUXADA (PULL-SYSTEM / OBTER A PRÓXIMA OP FÍSICA)
        if (action === 'GET_NEXT_OP') {
            if (!estacao_id) return NextResponse.json({ success: false, display: 'ERRO DADOS' }, { status: 400 });

            // 1. Procurar OPs Ativas cronológicas (Filas Kanban)
            const { data: pendentes, error: errPend } = await supabase
                .from('ordens_producao')
                .select('id, op_numero, modelos!inner(nome_modelo)')
                .in('status', ['IN_PROGRESS', 'Em Produção'])
                .order('data_prevista_inicio', { ascending: true, nullsFirst: false }); // Fila Lógica

            if (errPend || !pendentes || pendentes.length === 0) {
                return NextResponse.json({ success: true, op_id: null, display: 'FILA VAZIA', display_2: 'AGUARDAR' });
            }

            // 2. Extrair a Primeira da Fila que NÃO TENHA sido fechada (Macro-OEE) nesta estação
            const opIds = pendentes.map((p: any) => p.id);
            const { data: concluidas } = await supabase
                .from('log_estacao_conclusao')
                .select('op_id')
                .eq('estacao_id', estacao_id)
                .in('op_id', opIds);

            const concluidasIds = new Set((concluidas || []).map((c: any) => c.op_id));
            const proximaOP = pendentes.find((p: any) => !concluidasIds.has(p.id));

            if (!proximaOP) {
                return NextResponse.json({ success: true, op_id: null, display: 'FILA VAZIA', display_2: 'AGUARDAR' });
            }

            const modelNomeStr = (proximaOP.modelos as any)?.nome_modelo || 'BARCO';
            return NextResponse.json({
                success: true,
                op_id: proximaOP.id,
                display: `OP ${proximaOP.op_numero}`,
                display_2: modelNomeStr.substring(0, 16).toUpperCase()
            });
        }

        return NextResponse.json({ success: false, error: 'Ação Desconhecida', display: 'ERRO API' }, { status: 400 });

    } catch (e: unknown) {
        console.error("API MES Hub Error:", e);
        return NextResponse.json({ success: false, error: 'Internal Server Error', display: 'FALHA REDE' }, { status: 500 });
    }
}

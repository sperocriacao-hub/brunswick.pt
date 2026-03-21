import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const logs: string[] = [];
        const addToLogs = (msg: string) => logs.push(msg);
        addToLogs("⚙️ Inicializando Motor de Injeção de Massa de Dados...");

        // 1. Criar Estações Base (se não existirem)
        const estacoesRef = [
            { nome_estacao: 'Laminação Casco', num_estacao: 1 },
            { nome_estacao: 'Polimento', num_estacao: 2 },
            { nome_estacao: 'Montagem Elétrica', num_estacao: 3 },
            { nome_estacao: 'Toca Testes', num_estacao: 4 }
        ];

        let estacoes: any[] = [];
        const { data: extEstacoes } = await supabase.from('estacoes').select('id, nome_estacao');
        if (!extEstacoes || extEstacoes.length < 2) {
            addToLogs("🏭 A injetar estações genéricas de montagem...");
            const { data: insEstacoes } = await supabase.from('estacoes').insert(estacoesRef).select('id');
            estacoes = insEstacoes || [];
        } else {
            estacoes = extEstacoes;
            addToLogs("✅ Estações da Fábrica já existem. Reaproveitadas.");
        }

        // 2. Criar Modelos Base
        let modelosIds = [];
        const { data: extModelos } = await supabase.from('modelos').select('id, nome_modelo').limit(2);
        if (!extModelos || extModelos.length === 0) {
            addToLogs("🚤 A introduzir catálogo de Modelos Fantasia...");
            const { data: insModelos } = await supabase.from('modelos').insert([
                { nome_modelo: 'QA-Cruiser 3000', comprimento: 30, boca: 9, peso: 2000, tipo: 'Desportivo' },
                { nome_modelo: 'QA-Fisher Explorer', comprimento: 22, boca: 8, peso: 1500, tipo: 'Pesca' }
            ]).select('id');
            modelosIds = (insModelos || []).map(m => m.id);
        } else {
            modelosIds = extModelos.map(m => m.id);
            addToLogs("✅ Catálogo de modelos já populado. Reaproveitado.");
        }

        // 3. O Passo Fatal: Gerar Roteiros_Producao OBRIGATÓRIOS
        for (const modId of modelosIds) {
            const { data: rotExt } = await supabase.from('roteiros_producao').select('id').eq('modelo_id', modId);
            if (!rotExt || rotExt.length === 0) {
                const roteirosFactory = estacoes.slice(0, 3).map((est, idx) => ({
                    modelo_id: modId,
                    estacao_id: est.id,
                    sequencia: idx + 1,
                    descricao_tarefa: `Tarefa Padrão Fase ${idx + 1} QA`,
                    tempo_ciclo: (idx + 1) * 30 // 30min, 60min, 90min
                }));
                const res = await supabase.from('roteiros_producao').insert(roteirosFactory);
                if(res.error) addToLogs(`❌ Erro ao Mapear Roteiro: ${res.error.message}`);
            }
        }
        addToLogs("✅ Roteiros Mapeados e Injetados (Ligação Modelo <-> Estações Efetuada).");

        // 4. Injetar Trabalhadores
        const { data: extOp } = await supabase.from('operadores').select('id').eq('tag_rfid_operador', 'QA-RFID-CHUCK');
        if (!extOp || extOp.length === 0) {
            addToLogs("👷 A Requisitar Operários Artificiais aos Recursos Humanos...");
            const opRes = await supabase.from('operadores').insert([
                { 
                    numero_operador: 'QA-001', 
                    nome_operador: 'Auditor Chuck Norris', 
                    tag_rfid_operador: 'QA-RFID-CHUCK',
                    funcao: 'Operador Polivalente',
                    status: 'Ativo',
                    nivel_permissao: 'Operador'
                }
            ]);
            if (opRes.error) addToLogs(`❌ Erro BD (Operadores): ${opRes.error.message}`);
        }
        
        // 5. Injectar OP no Gantt/Backlog (Forçar criação a cada click)
        addToLogs("📦 A Adicionar Ordens de Produção 'QA-TEST-X' ao Backlog...");
        const orRes = await supabase.from('ordens_producao').insert([
            { op_numero: `QA-TEST-${Math.floor(Math.random() * 99999)}`, modelo_id: modelosIds[0], status: 'PLANNED', data_prevista_inicio: new Date().toISOString() },
            { op_numero: `QA-TEST-${Math.floor(Math.random() * 99999)}`, modelo_id: modelosIds[0], status: 'PLANNED', data_prevista_inicio: null }
        ]);
        if (orRes.error) addToLogs(`❌ Erro BD (Ordens de Produção): ${orRes.error.message}`);
        
        addToLogs("🎉 Injeção concluída. Verifica acima se existem ❌ Erros de Base de Dados.");

        return NextResponse.json({ success: true, logs });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

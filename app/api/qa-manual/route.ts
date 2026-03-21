import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ success: false, error: 'Server Missconfiguration' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const logs: string[] = [];

        logs.push("Iniciando Injeção do Golden Data (Manual de Uso)...");

        // 1. Criar Molde
        const { data: molde, error: errMolde } = await supabase.from('moldes').insert({
            nome: 'Molde Golden X-Pro',
            estado: 'Disponível',
            localizacao: 'Armazém A',
            ciclos_utilizacao: 0,
            limite_ciclos: 50,
            data_ultima_manutencao: new Date().toISOString()
        }).select().single();
        
        if (errMolde) logs.push(`❌ Erro Molde: ${errMolde.message}`);
        else logs.push(`✅ Molde Criado: ${molde.nome}`);

        // 2. Criar Peças (BOM)
        const pecasData = [
            { nome_peca: 'Fibras Vidro Premium', tipo: 'Standard', codigo_referencia: 'FBR-001', custo_estimado: 500, stock_atual: 100 },
            { nome_peca: 'Gelcoat Branco Neve', tipo: 'Standard', codigo_referencia: 'GEL-002', custo_estimado: 200, stock_atual: 50 },
            { nome_peca: 'Motor 300hp Mercury V8', tipo: 'Opcional', codigo_referencia: 'MOT-300V8', custo_estimado: 8000, stock_atual: 10 }
        ];
        
        const { data: pecas, error: errPecas } = await supabase.from('pecas').insert(pecasData).select();
        if (errPecas) logs.push(`❌ Erro Peças: ${errPecas.message}`);
        else logs.push(`✅ Peças Criadas: ${pecas.length}`);

        // 3. Criar Modelo (Barco)
        const { data: modelo, error: errModelo } = await supabase.from('modelos').insert({
            nome_modelo: 'Brunswick X-Pro (Manual Edition)',
            descricao: 'Barco desportivo de alta performance com materiais de luxo.',
            comprimento: 7.5,
            boca: 2.5,
            peso: 1500,
            capacidade_passageiros: 8,
            data_lancamento: '2026-03-21'
        }).select().single();

        if (errModelo) {
            logs.push(`❌ Erro Modelo: ${errModelo.message}`);
        } else {
            logs.push(`✅ Modelo Criado: ${modelo.nome_modelo}`);

            if (pecas) {
                // Ligar Peças ao Modelo (BOM)
                const pecasModeloData = pecas.map(p => ({
                    modelo_id: modelo.id,
                    peca_id: p.id,
                    quantidade_necessaria: p.tipo === 'Standard' ? 10 : 1,
                    obrigatorio: p.tipo === 'Standard'
                }));
                await supabase.from('modelo_pecas').insert(pecasModeloData);
                logs.push("✅ B.O.M (Lista de Materiais) interligada ao Barco");
            }
            
            // Ligar Molde ao Modelo
            if (molde) {
                await supabase.from('modelo_moldes').insert({
                    modelo_id: modelo.id,
                    molde_id: molde.id
                });
                logs.push("✅ Molde associado ao Modelo");
            }

            // 4. Mapear Estações Existentes para construir o Roteiro
            const { data: estacoes } = await supabase.from('estacoes').select('*').order('nome_estacao', { ascending: true });
            
            if (estacoes && estacoes.length >= 3) {
                const roteiros = [
                    { modelo_id: modelo.id, estacao_id: estacoes[0].id, sequencia: 1, tempo_estimado_minutos: 120, instrucoes_especificas: 'Aplicar Gelcoat Branco Neve uniformemente.' },
                    { modelo_id: modelo.id, estacao_id: estacoes[1].id, sequencia: 2, tempo_estimado_minutos: 240, instrucoes_especificas: 'Laminação Estrutural com Fibras Premium.' },
                    { modelo_id: modelo.id, estacao_id: estacoes[2].id, sequencia: 3, tempo_estimado_minutos: 360, instrucoes_especificas: 'Montagem Final do Motor Mercury V8 300hp.' }
                ];
                
                const { error: errRot } = await supabase.from('roteiros_producao').insert(roteiros);
                if (errRot) logs.push(`❌ Erro Roteiro: ${errRot.message}`);
                else logs.push("✅ Roteiro de 3 Estações Mapeado.");
            }
        }

        // 5. Configurar Regra de Qualidade/Sequência Genérica
        const { error: errRegra } = await supabase.from('regras_sequencia').insert({
            nome_regra: 'Pintura Anti-bolhas B.X-Pro',
            descricao: 'A temperatura do molde Deck 300 deve estar acima de 20ºC antes de laminar o X-Pro',
            condicao: 'Condição Atmosférica e Molde',
            acao: 'Alertar / Bloquear Tarefa'
        });
        if (!errRegra) logs.push("✅ Regra de Sequência / Validação criada.");

        logs.push("🎯 Golden Data Injection Concluída com Sucesso!");
        return NextResponse.json({ success: true, logs });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

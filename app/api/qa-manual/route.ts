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
            nome_parte: 'Molde Golden X-Pro',
            status: 'Ativo',
            estado_molde: 'Disponível',
            categoria: 'BIG_PART',
            ciclos_estimados: 0,
            limite_ciclos: 50
        }).select().single();
        
        if (errMolde) logs.push(`❌ Erro Molde: ${errMolde.message}`);
        else logs.push(`✅ Molde Criado: ${molde.nome_parte}`);

        // 3. Criar Modelo (Barco)
        const { data: modelo, error: errModelo } = await supabase.from('modelos').insert({
            nome_modelo: 'Brunswick X-Pro (Manual Edition)',
            model_year: 2026,
        }).select().single();

        if (errModelo) {
            logs.push(`❌ Erro Modelo: ${errModelo.message}`);
        } else {
            logs.push(`✅ Modelo Criado: ${modelo.nome_modelo}`);

            // 2. Criar Peças/BOM (Composição Modelo) e Opcionais
            const pecasModeloData = [
                { modelo_id: modelo.id, nome_parte: 'Fibras Vidro Premium', num_molde: molde ? molde.id : null, categoria: 'BIG_PART' },
                { modelo_id: modelo.id, nome_parte: 'Gelcoat Branco Neve', num_molde: null, categoria: 'SMALL_PART' }
            ];
            const { error: errPecas } = await supabase.from('composicao_modelo').insert(pecasModeloData);
            if (errPecas) logs.push(`❌ Erro Peças: ${errPecas.message}`);
            else logs.push("✅ B.O.M (Lista de Materiais Básicos) interligada ao Barco");

            const opcoesData = [{ modelo_id: modelo.id, nome_opcao: 'Motor 300hp Mercury V8' }];
            const { error: errOpc } = await supabase.from('opcionais').insert(opcoesData);
            if (!errOpc) logs.push("✅ Opcionais criados (Motor V8)");
            
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
                    { modelo_id: modelo.id, estacao_id: estacoes[0].id, sequencia: 1, tempo_estimado_minutos: 120 },
                    { modelo_id: modelo.id, estacao_id: estacoes[1].id, sequencia: 2, tempo_estimado_minutos: 240 },
                    { modelo_id: modelo.id, estacao_id: estacoes[2].id, sequencia: 3, tempo_estimado_minutos: 360 }
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

/**
 * Script para injetar o Barco Dourado (Golden Data) para o Manual de Utilizador
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE credentials in environment.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function injectGoldenData() {
    console.log("Iniciando Injeção do Golden Data...");

    // 1. Criar Molde
    const { data: molde, error: errMolde } = await supabase.from('moldes').insert({
        nome: 'Molde Golden X-Pro',
        estado: 'Disponível',
        localizacao: 'Armazém A',
        ciclos_utilizacao: 0,
        limite_ciclos: 50,
        data_ultima_manutencao: new Date().toISOString()
    }).select().single();
    
    if (errMolde) console.error("Erro Molde:", errMolde.message);
    else console.log("✅ Molde Criado:", molde.nome);

    // 2. Criar Peças (BOM)
    const pecasData = [
        { nome_peca: 'Fibras Vidro Premium', tipo: 'Standard', codigo_referencia: 'FBR-001', custo_estimado: 500, stock_atual: 100 },
        { nome_peca: 'Gelcoat Branco Neve', tipo: 'Standard', codigo_referencia: 'GEL-002', custo_estimado: 200, stock_atual: 50 },
        { nome_peca: 'Motor 300hp Mercury V8', tipo: 'Opcional', codigo_referencia: 'MOT-300V8', custo_estimado: 8000, stock_atual: 10 }
    ];
    
    const { data: pecas, error: errPecas } = await supabase.from('pecas').insert(pecasData).select();
    if (errPecas) console.error("Erro Peças:", errPecas.message);
    else console.log("✅ Peças Criadas:", pecas.length);

    // 3. Criar Modelo (Barco)
    const { data: modelo, error: errModelo } = await supabase.from('modelos').insert({
        nome_modelo: 'Brunswick X-Pro',
        descricao: 'Barco desportivo de alta performance com materiais de luxo (Manual Edition)',
        comprimento: 7.5,
        boca: 2.5,
        peso: 1500,
        capacidade_passageiros: 8,
        data_lancamento: '2026-03-21'
    }).select().single();

    if (errModelo) console.error("Erro Modelo:", errModelo.message);
    else console.log("✅ Modelo Criado:", modelo.nome_modelo);

    if (modelo && pecas) {
        // Ligar Peças ao Modelo (BOM)
        const pecasModeloData = pecas.map(p => ({
            modelo_id: modelo.id,
            peca_id: p.id,
            quantidade_necessaria: p.tipo === 'Standard' ? 10 : 1,
            obrigatorio: p.tipo === 'Standard'
        }));
        await supabase.from('modelo_pecas').insert(pecasModeloData);
        console.log("✅ B.O.M (Lista de Materiais) interligada ao Barco");
        
        // Ligar Molde ao Modelo
        if (molde) {
            await supabase.from('modelo_moldes').insert({
                modelo_id: modelo.id,
                molde_id: molde.id
            });
            console.log("✅ Molde associado ao Modelo");
        }
    }

    // 4. Mapear Estações Existentes para construir o Roteiro
    const { data: estacoes } = await supabase.from('estacoes').select('*').order('nome_estacao', { ascending: true });
    
    if (estacoes && estacoes.length >= 3 && modelo) {
        const roteiros = [
            { modelo_id: modelo.id, estaçao_id: null, estacao_id: estacoes[0].id, sequencia: 1, tempo_estimado_minutos: 120, instrucoes_especificas: 'Aplicar Gelcoat Branco Neve uniformemente.' },
            { modelo_id: modelo.id, estaçao_id: null, estacao_id: estacoes[1].id, sequencia: 2, tempo_estimado_minutos: 240, instrucoes_especificas: 'Laminação Estrutural com Fibras Premium.' },
            { modelo_id: modelo.id, estaçao_id: null, estacao_id: estacoes[2].id, sequencia: 3, tempo_estimado_minutos: 360, instrucoes_especificas: 'Montagem Final do Motor Mercury V8 300hp.' }
        ];
        
        const { error: errRot } = await supabase.from('roteiros_producao').insert(roteiros);
        if (errRot) console.error("Erro Roteiro:", errRot.message);
        else console.log("✅ Roteiro de 3 Estações Mapeado.");
    }

    // 5. Configurar Regra de Qualidade/Sequência Genérica
    const { error: errRegra } = await supabase.from('regras_sequencia').insert({
        nome_regra: 'Pintura Anti-bolhas B.X-Pro',
        descricao: 'A temperatura do molde Deck 300 deve estar acima de 20ºC antes de laminar o X-Pro',
        condicao: 'Condição Atmosférica e Molde',
        acao: 'Alertar / Bloquear Tarefa'
    });
    if (!errRegra) console.log("✅ Regra de Sequência / Validação criada.");

    console.log("🎯 Golden Data Injection Concluída com Sucesso!");
}

injectGoldenData();

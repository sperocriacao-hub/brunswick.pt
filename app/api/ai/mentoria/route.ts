import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "API Key não configurada no servidor." }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        const systemInstructionText = `Você é um 'Coach Executivo Industrial Lean' experiente, desenhado para ajudar Diretores da fábrica Brunswick a avaliarem e a desenvolverem os seus Supervisores/Líderes fabris. 
            Sua resposta deve ser estruturada SEMPRE em formato JSON com três chaves estritas:
            {
               "alertas": ["ponto critico 1", "ponto critico 2"],
               "elogios": ["onde ele acertou 1", "onde ele acertou 2"],
               "pdi": ["Tarefa prática PDI 1", "Tarefa prática PDI 2", "Tarefa prática PDI 3"]
            }
            
            Instruções do PDI (Plano de Desenvolvimento Individual): Sugira tarefas micro, práticas e acionáveis (ex: "Fazer uma reunião stand-up amanha sobre Qualidade com a linha").
            Seja rigoroso, diplomático, focado em Lean Manufacturing.`;

        let model;
        // Tentamos modelos do mais robusto para os universais, pois algumas Chaves API/Regiões não têm acesso a strings diretas.
        const modelKeys = ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest", "gemini-pro"];
        
        let result = null;
        let lastError = null;

        const prompt = `${systemInstructionText}\n\nAnalise o perfil e métricas de desempenho deste líder e crie um Diagnóstico e Plano de Mentoria.
        DADOS DO DIRIGENTE:
        Nome: ${body.nome}
        Cargo e Área: ${body.cargo} (${body.area || 'Geral'})
        OEE Médio da sua Equipa Efetiva: ${body.equipaOee?.toFixed(1) || '0'}%
        Tempo Médio Pessoal de Resposta a Andons (Resolução de Quedas de Linha): ${body.mtrAndon} minutos
        Índice de Liderança Democrático (Avaliação Ascendente/Quizzes): ${body.mentoriaScore?.toFixed(1) || '0'} / 5.0
        Avaliação Oficial de Higiene e Segurança no Trabalho (HST): ${body.notaHst?.toFixed(1) || 'N/A'} / 5.0
        Avaliação Oficial de Cumprimento de Objetivos: ${body.notaObjetivos?.toFixed(1) || 'N/A'} / 5.0
        Atos de Mentoria/Acompanhamento emitidos por este líder: ${body.mentorshipCount} acompanhamentos.
        
        Sintetize os problemas críticos (se a nota oficial de HST for baixa, se atingir poucos objetivos, se as respostas a anomalias do Andon forem lentas, ou se as avaliações da base forem más), elogie os pontos fortes evidentes como acima de 3.8/5.0 em notas, e estabeleça 3 tarefas urgentes de PDI.`;

        for (const modelKey of modelKeys) {
            try {
                model = genAI.getGenerativeModel({ model: modelKey });
                result = await model.generateContent(prompt);
                break; // Se deu sucesso, não vai para o próximo modelo.
            } catch (error) {
                lastError = error;
                console.warn(`[AI Mentorship] Falhou modelo: ${modelKey}`, error);
            }
        }

        if (!result) {
            console.error("AI Mentorship Exhausted Models Error:", lastError);
            
            // Tentativa Final: Buscar dinamicamente os modelos que a conta do utilizador suporta
            try {
                const modelsReq = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                const modelsData = await modelsReq.json();
                
                if (modelsData.models && modelsData.models.length > 0) {
                    const validModels = modelsData.models.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'));
                    if (validModels.length > 0) {
                        const dynamicModelName = validModels[0].name.replace('models/', '');
                        console.log(`[AI Mentorship] Tentando modelo dinâmico encontrado na conta: ${dynamicModelName}`);
                        model = genAI.getGenerativeModel({ model: dynamicModelName });
                        result = await model.generateContent(prompt);
                    }
                }
            } catch (dynamicError) {
                console.error("Erro ao buscar modelos dinâmicos:", dynamicError);
            }

            // Se mesmo assim não houver resultado, aí sim explodimos o erro
            if (!result) {
                // Tentaremos formatar a lista de modelos para facilitar o debug do user
                let availableModelsStr = "";
                try {
                    const modelsReq = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                    const modelsData = await modelsReq.json();
                    if (modelsData.models) {
                        availableModelsStr = modelsData.models.map((m: any) => m.name).join(", ");
                    }
                } catch (e) {}

                throw new Error(`Nenhum modelo suportado associado à sua API Key. Erro retornado: ${(lastError as any)?.message || 'Desconhecido'}. Modelos disponíveis na sua chave: [${availableModelsStr || 'Nenhum reportado'}]`);
            }
        }
        
        const responseText = result.response.text();
        
        // Remove blocos de markdown ```json se existirem para podermos parsear limpo
        let jsonOutput;
        try {
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            // Find JSON block with regex in case Gemini added leading trailing text
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonOutput = JSON.parse(jsonMatch[0]);
            } else {
                jsonOutput = JSON.parse(cleanJson);
            }
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", responseText);
            throw new Error("A IA não retornou um formato válido. Tente gerar de novo.");
        }

        return NextResponse.json({ data: jsonOutput });
    } catch (error: any) {
        console.error("AI Mentorship Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

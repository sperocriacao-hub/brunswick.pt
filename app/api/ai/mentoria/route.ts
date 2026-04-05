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
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash", 
            systemInstruction: `Você é um 'Coach Executivo Industrial Lean' experiente, desenhado para ajudar Diretores da fábrica Brunswick a avaliarem e a desenvolverem os seus Supervisores/Líderes fabris. 
                Sua resposta deve ser estruturada SEMPRE em formato JSON com três chaves estritas:
                {
                   "alertas": ["ponto critico 1", "ponto critico 2"],
                   "elogios": ["onde ele acertou 1", "onde ele acertou 2"],
                   "pdi": ["Tarefa prática PDI 1", "Tarefa prática PDI 2", "Tarefa prática PDI 3"]
                }
                
                Instruções do PDI (Plano de Desenvolvimento Individual): Sugira tarefas micro, práticas e acionáveis (ex: "Fazer uma reunião stand-up amanha sobre Qualidade com a linha").
                Seja rigoroso, diplomático, focado em Lean Manufacturing.`
        });

        const prompt = `Analise o perfil e métricas de desempenho deste líder e crie um Diagnóstico e Plano de Mentoria.
        DADOS DO DIRIGENTE:
        Nome: ${body.nome}
        Cargo e Área: ${body.cargo} (${body.area || 'Geral'})
        OEE Médio da sua Equipa Efetiva: ${body.equipaOee?.toFixed(1) || '0'}%
        Tempo Médio Pessoal de Resposta a Andons (Resolução de Quedas de Linha): ${body.mtrAndon} minutos
        Avaliação Top-Down (Cultura e Atitude dada pela Direção): ${body.mentoriaScore?.toFixed(1) || '0'} / 5.0
        Atos de Mentoria/Acompanhamento emitidos por este líder: ${body.mentorshipCount} acompanhamentos.
        
        Sintetize os problemas críticos (se o OEE for baixo, se as respostas a anomalias do Andon forem lentas, ou se as avaliações forem más), elogie os pontos fortes e estabeleça 3 tarefas urgentes de PDI.`;

        const result = await model.generateContent(prompt);
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

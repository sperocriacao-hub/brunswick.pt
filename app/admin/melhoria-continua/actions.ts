'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
// Assumes you have process.env.GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function submitNovaAcao(payload: any) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { error } = await supabase.from('central_acoes_globais').insert([payload]);
        if (error) throw error;

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function processarTextoIA(texto: string) {
    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: "A chave GEMINI_API_KEY não está configurada no servidor." };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `
És um experiente Gestor de Melhoria Contínua Industrial.
Lê o seguinte texto (que pode ser a transcrição de uma reunião, um desabafo ou notas soltas) e extrai todas as potenciais ações corretivas ou tarefas de melhoria.

O texto de origem é:
"""
${texto}
"""

Retorna o resultado ESTRITAMENTE em formato JSON. Não uses Markdown, apenas o JSON cru que represente um Array de objetos.
Cada objeto deve ter:
- titulo (string curto e claro)
- descricao (string)
- categoria (deve ser exatamente um destes: 'Eficiencia', 'Entregas', 'Scraps', 'Andons', 'Gargalos', 'Consumiveis', 'Material Variance', 'Produtividade', 'Formacoes', 'Outro')
- responsavel_nome (string ou null)
- sugestao_conclusao (string, a tua ideia brilhante baseada em WCM ou TPM para como resolver isto de forma permanente)

Exemplo de output:
[
  {
    "titulo": "Reparar Máquina de Corte",
    "descricao": "A máquina bloqueou 3 vezes ontem causando refugos.",
    "categoria": "Scraps",
    "responsavel_nome": "João Manutenção",
    "sugestao_conclusao": "Implementar plano de manutenção autónoma na lâmina e sensor."
  }
]
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Tentativa de limpar marcações Markdown caso o LLM insista em colocar
        let cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const actions = JSON.parse(cleanJson);

        return { success: true, data: actions };
    } catch (e: any) {
        return { success: false, error: e.message || "Falha a processar via IA." };
    }
}

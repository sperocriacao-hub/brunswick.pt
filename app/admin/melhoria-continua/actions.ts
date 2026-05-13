'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper function to dynamically find an available model for the user's API Key
async function getValidModel() {
    // Try preferred stable models first
    const preferredModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro"];
    let firstValidModel = "gemini-1.5-flash"; // default fallback

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await res.json();
        if (data && data.models) {
            const validModels = data.models.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'));
            if (validModels.length > 0) {
                // Check if any of our preferred models exist
                const availableNames = validModels.map((m: any) => m.name.replace('models/', ''));
                for (const pref of preferredModels) {
                    if (availableNames.includes(pref)) {
                        return genAI.getGenerativeModel({ model: pref });
                    }
                }
                // If none of preferred exist, just grab the first one that supports generateContent
                firstValidModel = availableNames[0];
            }
        }
    } catch (e) {
        console.warn("Failed to fetch dynamic models list, using fallback.");
    }
    
    return genAI.getGenerativeModel({ model: firstValidModel });
}

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

export async function updateAcaoGlobal(id: string, payload: any) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { error } = await supabase.from('central_acoes_globais').update(payload).eq('id', id);
        if (error) throw error;

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function processarTextoIA(texto: string, areasFabrica: any[] = [], linhasProducao: any[] = [], categorias: string[] = [], estacoes: any[] = []) {
    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: "A chave GEMINI_API_KEY não está configurada no servidor." };
    }

    try {
        const model = await getValidModel();

        const areasList = areasFabrica.map(a => `- ID: ${a.id} | Nome: ${a.nome_area}`).join('\n');
        const linhasList = linhasProducao.map(l => `- ID: ${l.id} | Linha: ${l.letra_linha}`).join('\n');
        const estacoesList = estacoes.map(e => `- ID: ${e.id} | Estação: ${e.nome_estacao} (Área ID: ${e.area_id})`).join('\n');
        const categoriasList = categorias.length > 0 ? categorias.join(', ') : "'Eficiencia', 'Entregas', 'Scraps', 'Andons', 'Gargalos', 'Consumiveis', 'Material Variance', 'Produtividade', 'Formacoes', 'Outro', '5S'";

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
- categoria (deve ser exatamente um destes: ${categoriasList})
- responsavel_nome (string ou null)
- area_id (string com o ID da área, ou null se não for possível deduzir. Usa APENAS os IDs da lista abaixo)
- linha_id (string com o ID da Linha de Produção, ou null. Apenas aplicável se a área for relacionada com "Montagem" e se o texto mencionar letras de linha como "Linha A", "Linha B")
- estacao_id (string com o ID da Estação, ou null. Apenas usar se o texto mencionar uma estação ou posto específico)
- data_limite (MUITO IMPORTANTE: string no formato exato "YYYY-MM-DD" se o texto mencionar datas, prazos como "até dia X", "amanhã", "na próxima sexta", ou null apenas se for impossível deduzir uma data limite. Força a extração de data limite sempre que possível, o utilizador queixa-se que tu ignoras prazos claros.)
- sugestao_conclusao (string, a tua ideia brilhante baseada em WCM ou TPM para como resolver isto de forma permanente)

Áreas da Fábrica disponíveis:
${areasList || 'Sem áreas definidas.'}

Linhas de Produção disponíveis (Para Montagem):
${linhasList || 'Sem linhas definidas.'}

Estações de Trabalho disponíveis:
${estacoesList || 'Sem estações definidas.'}

Exemplo de output:
[
  {
    "titulo": "Reparar Máquina de Corte",
    "descricao": "A máquina bloqueou 3 vezes ontem causando refugos.",
    "categoria": "Scraps",
    "responsavel_nome": "João Manutenção",
    "area_id": "uuid-da-area",
    "linha_id": "uuid-da-linha",
    "estacao_id": "uuid-da-estacao",
    "data_limite": "2026-05-10",
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

export async function pedirAvaliacaoPlanoIA(textoPlano: string) {
    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: "Chave GEMINI_API_KEY em falta." };
    }
    try {
        const model = await getValidModel();
        const prompt = `
És um Auditor Master Black Belt em Lean Six Sigma.
Vou dar-te o rascunho de um plano de ação que um líder de linha escreveu manualmente.
Avalia a qualidade deste plano de ação (0 a 10) baseando-te na clareza, se ataca a causa raiz, e se é SMART (Específico, Mensurável, etc).

Plano escrito pelo utilizador:
"${textoPlano}"

Devolve o resultado ESTRITAMENTE num JSON com o formato:
{
  "nota": 7,
  "feedback_curto": "O plano é um pouco vago na medição do resultado.",
  "sugestao_melhoria": "Adiciona qual é a máquina específica e define que o sensor deve ser limpo a cada turno."
}
`;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        let cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const avaliacao = JSON.parse(cleanJson);
        return { success: true, data: avaliacao };
    } catch (e: any) {
        return { success: false, error: "Erro ao pedir avaliação à IA: " + e.message };
    }
}

export async function pivotarEstrategiaIA(descricaoFalha: string) {
    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: "Chave GEMINI_API_KEY em falta." };
    }
    try {
        const model = await getValidModel();
        const prompt = `
Atuas como um Conselheiro de Engenharia WCM. 
Foi implementada a seguinte Ação Corretiva na fábrica, mas após a verificação de eficácia, concluiu-se que FALHOU (foi ineficaz) e o problema reincidiu.

Descrição da ação que falhou:
"${descricaoFalha}"

Como a ação falhou, precisamos de "pivotar" a estratégia. 
Surgere 2 ações corretivas alternativas, pensando fora da caixa (ex: Poka-Yoke, Automação, Mudança de Material), que ataquem o problema de um ângulo diferente.
Responde num texto formatado curto e direto, sem formatações complexas, apenas parágrafos simples.
`;
        const result = await model.generateContent(prompt);
        return { success: true, data: result.response.text() };
    } catch (e: any) {
        return { success: false, error: "Erro ao gerar estratégia alternativa: " + e.message };
    }
}
// ---- Gestão de Categorias Dinâmicas ----

export async function getCategoriasAcoes() {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data, error } = await supabase.from('central_acoes_categorias').select('nome').order('nome');
        if (error) throw error;
        return { success: true, data: data.map(c => c.nome) };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function addCategoriaAcao(nome: string) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { error } = await supabase.from('central_acoes_categorias').insert([{ nome }]);
        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ---- War Room Analytics (V4 Preparação) ----
export async function warRoomAnalyticsIA(pergunta: string, dadosDashboardText: string) {
    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: "Chave GEMINI_API_KEY em falta." };
    }
    try {
        const model = await getValidModel();
        const prompt = `
És o Diretor de Operações de uma Fábrica (Sistema M.E.S).
Estás na Sala de Análise (War Room). O Diretor Geral fez-te a seguinte pergunta sobre a fábrica:
"${pergunta}"

Eu extraí o painel de todas as ações atuais na fábrica para te ajudar a responder com base em dados reais:
DADOS DA FÁBRICA:
"""
${dadosDashboardText}
"""

Responde diretamente à pergunta dele de forma executiva, baseando-te EXCLUSIVAMENTE nos dados fornecidos acima. Sê analítico, deteta tendências (qual o módulo com mais atrasos, qual o responsável com mais carga) e recomenda um foco tático. Responde em Português corporativo, usando formatação simples (bullet points, etc).
`;
        const result = await model.generateContent(prompt);
        return { success: true, data: result.response.text() };
    } catch (e: any) {
        return { success: false, error: "Erro na War Room IA: " + e.message };
    }
}

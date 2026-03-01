-- Migration 0030: Módulo Qualidade Avançada (RNCs, 8D, A3)

-- 1. Tabela Principal de Não Conformidades (RNC)
CREATE TABLE IF NOT EXISTS public.qualidade_rnc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_rnc VARCHAR(50) UNIQUE NOT NULL, -- Ex: RNC-2026-001
    
    -- Vínculos M.E.S.
    ordem_producao_id UUID REFERENCES public.ordens_producao(id) ON DELETE SET NULL,
    estacao_id UUID REFERENCES public.estacoes(id) ON DELETE SET NULL,
    
    -- Dados da Detenção
    detetado_por_nome VARCHAR(255) NOT NULL,
    data_deteccao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Classificação
    tipo_defeito VARCHAR(100) NOT NULL, -- Ex: Dimensional, Estético, Material
    gravidade VARCHAR(50) NOT NULL DEFAULT 'Media' CHECK (gravidade IN ('Baixa', 'Media', 'Critica', 'Bloqueante')),
    descricao_problema TEXT NOT NULL,
    acao_imediata TEXT, -- O que foi feito logo na hora (Containment)
    
    status VARCHAR(50) NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Em Investigacao', 'Concluido', 'Cancelado')),
    
    anexos_url JSONB DEFAULT '[]'::JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Relatórios 8D (Vinculada a RNC Opcionalmente)
CREATE TABLE IF NOT EXISTS public.qualidade_8d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rnc_id UUID REFERENCES public.qualidade_rnc(id) ON DELETE CASCADE,
    numero_8d VARCHAR(50) UNIQUE NOT NULL, -- Ex: 8D-2026-001

    -- As 8 Disciplinas
    d1_equipa TEXT,                           -- Equipa e Líder
    d2_problema TEXT,                         -- Descrição detalhada (Quem, Onde, Quando, O Quê)
    d3_contencao TEXT,                        -- Ações imediatas provisórias (Isolamento)
    d4_causa_raiz TEXT,                       -- Metodologia 5 Porquês / Ishikawa
    d5_acao_permanente TEXT,                  -- Soluções Permanentes Planeadas (PCA)
    d6_implementacao TEXT,                    -- Validação das Soluções no terreno
    d7_prevencao TEXT,                        -- Como garantir que não volta a acontecer (SOPs, TPM)
    d8_reconhecimento TEXT,                   -- Equipa envolvida celebrada/notificada
    
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'D1-D3', 'D4-D5', 'Concluido')),
    responsavel_nome VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Relatórios A3 (Pensamento Lean Visual)
CREATE TABLE IF NOT EXISTS public.qualidade_a3 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rnc_id UUID REFERENCES public.qualidade_rnc(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    
    -- Blocos Clássicos A3 (Esquerda)
    background TEXT,                          -- Contexto: Porquê este problema importa?
    condicao_atual TEXT,                      -- O que está a acontecer hoje (Factos)
    objetivo TEXT,                            -- Condição Alvo (Métricas SMART)
    analise_causa TEXT,                       -- Desenho da Causa (Pode suportar imagens/texto descritivo 5W)
    
    -- Blocos Clássicos A3 (Direita)
    contramedidas TEXT,                       -- Soluções propostas
    plano_acao JSONB DEFAULT '[]'::JSONB,     -- Lista estruturada [{tarefa, quem, quando, status}]
    seguimento TEXT,                          -- Como vamos verificar se funcionou?
    
    status VARCHAR(50) NOT NULL DEFAULT 'Em Desenvolvimento' CHECK (status IN ('Em Desenvolvimento', 'Aguardando Aprovacao', 'Implementado', 'Auditoria')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.qualidade_rnc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualidade_8d ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualidade_a3 ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Permitir leitura anonima rnc" ON public.qualidade_rnc FOR SELECT USING (true);
CREATE POLICY "Permitir leitura anonima 8d" ON public.qualidade_8d FOR SELECT USING (true);
CREATE POLICY "Permitir leitura anonima a3" ON public.qualidade_a3 FOR SELECT USING (true);

CREATE POLICY "Permitir escrita anonima rnc" ON public.qualidade_rnc FOR ALL USING (true);
CREATE POLICY "Permitir escrita anonima 8d" ON public.qualidade_8d FOR ALL USING (true);
CREATE POLICY "Permitir escrita anonima a3" ON public.qualidade_a3 FOR ALL USING (true);

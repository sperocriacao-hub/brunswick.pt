-- Migration 0079: Hub NASA V3.1 - Correção de RNCs e Tabela de Categorias

-- 1. Tabela de Categorias Dinâmicas
CREATE TABLE IF NOT EXISTS public.central_acoes_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir as categorias padrão caso não existam
INSERT INTO public.central_acoes_categorias (nome)
VALUES 
    ('Eficiência'), 
    ('Scraps'), 
    ('Consumíveis'), 
    ('Outro')
ON CONFLICT (nome) DO NOTHING;

-- Permitir leitura e escrita genérica
ALTER TABLE public.central_acoes_categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL for authenticated users on categorias" ON public.central_acoes_categorias FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 2. Correção da View Mestra (RNCs empacotadas no 'contramedidas')
DROP VIEW IF EXISTS public.view_master_acoes;
CREATE VIEW public.view_master_acoes AS

-- AÇÕES LEAN
SELECT 
    id,
    titulo,
    descricao,
    'Lean/Kaizen' AS modulo_origem,
    origem_tipo AS categoria,
    responsavel_nome,
    status,
    created_at,
    data_limite,
    data_conclusao,
    data_verificacao,
    status_eficacia
FROM public.lean_acoes

UNION ALL

-- AÇÕES HST
SELECT 
    id,
    'Ação Preventiva/Corretiva'::VARCHAR(255) AS titulo,
    descricao_acao AS descricao,
    'HST' AS modulo_origem,
    'Ocorrencia/8D' AS categoria,
    NULL::VARCHAR(255) AS responsavel_nome,
    status,
    created_at,
    data_prevista::TIMESTAMP WITH TIME ZONE AS data_limite,
    data_conclusao::TIMESTAMP WITH TIME ZONE AS data_conclusao,
    data_verificacao,
    status_eficacia
FROM public.hst_acoes

UNION ALL

-- AÇÕES GLOBAIS / EFICIÊNCIA
SELECT 
    id,
    titulo,
    descricao,
    'Geral' AS modulo_origem,
    categoria,
    responsavel_nome,
    status,
    created_at,
    data_limite,
    data_conclusao,
    data_verificacao,
    status_eficacia
FROM public.central_acoes_globais

UNION ALL

-- EXTRAÇÃO DAS AÇÕES DOS RELATÓRIOS A3 (Qualidade RNC)
-- Explodimos o campo "contramedidas" que armazena a string JSON do plano
SELECT 
    a3.id,
    'Ação do A3: ' || a3.titulo AS titulo,
    (acao->>'tarefa') AS descricao,
    'Qualidade' AS modulo_origem,
    'RNC/A3' AS categoria,
    (acao->>'quem') AS responsavel_nome,
    COALESCE(acao->>'status', 'To Do') AS status,
    a3.created_at,
    CASE 
        WHEN acao->>'quando' IS NOT NULL AND acao->>'quando' != '' 
        THEN (acao->>'quando')::TIMESTAMP WITH TIME ZONE 
        ELSE NULL 
    END AS data_limite,
    NULL::TIMESTAMP WITH TIME ZONE AS data_conclusao,
    NULL::TIMESTAMP WITH TIME ZONE AS data_verificacao,
    'Não Verificado'::VARCHAR(50) AS status_eficacia
FROM public.qualidade_a3 a3,
LATERAL jsonb_array_elements(
    CASE 
        WHEN a3.contramedidas IS NOT NULL AND a3.contramedidas LIKE '[%' 
        THEN a3.contramedidas::jsonb 
        ELSE '[]'::jsonb 
    END
) AS acao;

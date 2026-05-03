-- Migration 0078: Hub NASA - Expansão PDCA e Integração de Ações RNC

-- 1. Adicionar colunas PDCA nas tabelas de ações existentes
ALTER TABLE public.central_acoes_globais ADD COLUMN IF NOT EXISTS data_verificacao TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.central_acoes_globais ADD COLUMN IF NOT EXISTS status_eficacia VARCHAR(50) DEFAULT 'Não Verificado' CHECK (status_eficacia IN ('Não Verificado', 'Eficaz', 'Ineficaz', 'Em Teste'));

ALTER TABLE public.lean_acoes ADD COLUMN IF NOT EXISTS data_verificacao TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.lean_acoes ADD COLUMN IF NOT EXISTS status_eficacia VARCHAR(50) DEFAULT 'Não Verificado' CHECK (status_eficacia IN ('Não Verificado', 'Eficaz', 'Ineficaz', 'Em Teste'));

ALTER TABLE public.hst_acoes ADD COLUMN IF NOT EXISTS data_verificacao TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.hst_acoes ADD COLUMN IF NOT EXISTS status_eficacia VARCHAR(50) DEFAULT 'Não Verificado' CHECK (status_eficacia IN ('Não Verificado', 'Eficaz', 'Ineficaz', 'Em Teste'));


-- 2. Atualizar a View Mestra para incluir campos PDCA e ações embutidas nos JSONs dos A3
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
-- Explodimos o JSON "plano_acao" -> [{tarefa, quem, quando, status}]
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
        WHEN jsonb_typeof(a3.plano_acao) = 'array' THEN a3.plano_acao 
        ELSE '[]'::jsonb 
    END
) AS acao;

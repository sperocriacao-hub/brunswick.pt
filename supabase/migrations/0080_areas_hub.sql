-- Migration 0080: Hub V3.2 - Inclusão de Filtros por Área e Correção de Bug RNC

-- 1. Adicionar `area_id` nas tabelas que não tinham
ALTER TABLE public.central_acoes_globais ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas_fabrica(id) ON DELETE SET NULL;
ALTER TABLE public.hst_acoes ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas_fabrica(id) ON DELETE SET NULL;

-- 2. Recriar View Mestra com o LEFT JOIN das áreas e a correção do acao->>'o_que'
DROP VIEW IF EXISTS public.view_master_acoes;
CREATE VIEW public.view_master_acoes AS

-- AÇÕES LEAN
SELECT 
    la.id,
    la.titulo,
    la.descricao,
    'Lean/Kaizen' AS modulo_origem,
    la.origem_tipo AS categoria,
    la.responsavel_nome,
    la.status,
    la.created_at,
    la.data_limite,
    la.data_conclusao,
    la.data_verificacao,
    la.status_eficacia,
    la.area_id,
    af.nome_area
FROM public.lean_acoes la
LEFT JOIN public.areas_fabrica af ON la.area_id = af.id

UNION ALL

-- AÇÕES HST
SELECT 
    ha.id,
    'Ação Preventiva/Corretiva'::VARCHAR(255) AS titulo,
    ha.descricao_acao AS descricao,
    'HST' AS modulo_origem,
    'Ocorrencia/8D' AS categoria,
    NULL::VARCHAR(255) AS responsavel_nome,
    ha.status,
    ha.created_at,
    ha.data_prevista::TIMESTAMP WITH TIME ZONE AS data_limite,
    ha.data_conclusao::TIMESTAMP WITH TIME ZONE AS data_conclusao,
    ha.data_verificacao,
    ha.status_eficacia,
    ha.area_id,
    af.nome_area
FROM public.hst_acoes ha
LEFT JOIN public.areas_fabrica af ON ha.area_id = af.id

UNION ALL

-- AÇÕES GLOBAIS / EFICIÊNCIA
SELECT 
    ca.id,
    ca.titulo,
    ca.descricao,
    'Geral' AS modulo_origem,
    ca.categoria,
    ca.responsavel_nome,
    ca.status,
    ca.created_at,
    ca.data_limite,
    ca.data_conclusao,
    ca.data_verificacao,
    ca.status_eficacia,
    ca.area_id,
    af.nome_area
FROM public.central_acoes_globais ca
LEFT JOIN public.areas_fabrica af ON ca.area_id = af.id

UNION ALL

-- EXTRAÇÃO DAS AÇÕES DOS RELATÓRIOS A3 (Qualidade RNC)
-- Explodimos o "contramedidas" JSON e obtemos a área via RNC -> Estação -> Área
SELECT 
    a3.id,
    'Ação do A3: ' || a3.titulo AS titulo,
    (acao->>'o_que') AS descricao, -- BUGS FIXED HERE (tarefa -> o_que)
    'Qualidade' AS modulo_origem,
    'RNC/A3' AS categoria,
    (acao->>'quem') AS responsavel_nome,
    COALESCE(acao->>'status', 'Pendente') AS status,
    a3.created_at,
    CASE 
        WHEN acao->>'quando' IS NOT NULL AND acao->>'quando' != '' 
        THEN (acao->>'quando')::TIMESTAMP WITH TIME ZONE 
        ELSE NULL 
    END AS data_limite,
    NULL::TIMESTAMP WITH TIME ZONE AS data_conclusao,
    NULL::TIMESTAMP WITH TIME ZONE AS data_verificacao,
    'Não Verificado'::VARCHAR(50) AS status_eficacia,
    e.area_id,
    af.nome_area
FROM public.qualidade_a3 a3
LEFT JOIN public.qualidade_rnc r ON a3.rnc_id = r.id
LEFT JOIN public.estacoes e ON r.estacao_id = e.id
LEFT JOIN public.areas_fabrica af ON e.area_id = af.id,
LATERAL jsonb_array_elements(
    CASE 
        WHEN a3.contramedidas IS NOT NULL AND a3.contramedidas LIKE '[%' 
        THEN a3.contramedidas::jsonb 
        ELSE '[]'::jsonb 
    END
) AS acao;

-- Migration 0089: Atualizar Hub V3.4 - Adicionar 5S Ações (Explosão do 5W2H)

DROP VIEW IF EXISTS public.view_master_acoes;
CREATE VIEW public.view_master_acoes AS

-- 1. AÇÕES LEAN (Com suporte inteligente para desdobramento do JSON plano_acao_5w2h)
SELECT 
    la.id,
    CASE 
        WHEN acao IS NOT NULL AND acao->>'o_que' IS NOT NULL THEN 'Ação A3: ' || (acao->>'o_que')
        ELSE la.titulo
    END AS titulo,
    CASE 
        WHEN acao IS NOT NULL AND acao->>'o_que' IS NOT NULL THEN (acao->>'o_que')
        ELSE la.descricao
    END AS descricao,
    'Lean/Kaizen' AS modulo_origem,
    la.origem_tipo AS categoria,
    COALESCE(acao->>'quem', la.responsavel_nome) AS responsavel_nome,
    CASE 
        WHEN (acao->>'status') ILIKE 'Feito' THEN 'Concluido'
        WHEN (acao->>'status') ILIKE 'Done' THEN 'Concluido'
        WHEN (acao->>'status') IS NOT NULL THEN (acao->>'status')
        ELSE la.status
    END AS status,
    la.created_at,
    CASE 
        WHEN acao->>'quando' IS NOT NULL AND acao->>'quando' != '' THEN (acao->>'quando')::TIMESTAMP WITH TIME ZONE
        ELSE la.data_limite
    END AS data_limite,
    la.data_conclusao,
    la.data_verificacao,
    la.status_eficacia,
    la.area_id,
    af.nome_area
FROM public.lean_acoes la
LEFT JOIN public.areas_fabrica af ON la.area_id = af.id
LEFT JOIN LATERAL jsonb_array_elements(
    CASE 
        WHEN jsonb_typeof(la.plano_acao_5w2h) = 'array' AND jsonb_array_length(la.plano_acao_5w2h) > 0 
        THEN la.plano_acao_5w2h 
        ELSE '[null]'::jsonb 
    END
) AS acao ON true

UNION ALL

-- 2. AÇÕES HST
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

-- 3. AÇÕES GLOBAIS / EFICIÊNCIA
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

-- 4. EXTRAÇÃO DAS AÇÕES DOS RELATÓRIOS A3 (Qualidade RNC)
SELECT 
    a3.id,
    'Ação do A3: ' || a3.titulo AS titulo,
    (acao->>'o_que') AS descricao,
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
) AS acao

UNION ALL

-- 5. AÇÕES LEAN 5S (COM EXPLOSÃO DO 5W2H)
SELECT 
    l5a.id,
    CASE 
        WHEN acao IS NOT NULL AND acao->>'o_que' IS NOT NULL THEN 'Ação 5S: ' || (acao->>'o_que')
        ELSE 'Falha 5S'
    END AS titulo,
    CASE 
        WHEN acao IS NOT NULL AND acao->>'o_que' IS NOT NULL THEN (acao->>'o_que')
        ELSE l5a.descricao_acao
    END AS descricao,
    'Lean/5S' AS modulo_origem,
    'Auditoria 5S' AS categoria,
    COALESCE(acao->>'quem', (SELECT nome_operador FROM public.operadores WHERE id = l5a.responsavel_id)) AS responsavel_nome,
    CASE 
        WHEN (acao->>'status') ILIKE 'Feito' THEN 'Concluido'
        WHEN (acao->>'status') ILIKE 'Done' THEN 'Concluido'
        WHEN (acao->>'status') IS NOT NULL THEN (acao->>'status')
        ELSE l5a.status
    END AS status,
    l5a.created_at,
    CASE 
        WHEN acao->>'quando' IS NOT NULL AND acao->>'quando' != '' THEN (acao->>'quando')::TIMESTAMP WITH TIME ZONE
        ELSE l5a.data_limite
    END AS data_limite,
    l5a.data_conclusao,
    NULL::TIMESTAMP WITH TIME ZONE AS data_verificacao,
    l5a.validacao_eficacia AS status_eficacia,
    l5a.area_id,
    af.nome_area
FROM public.lean_5s_acoes l5a
LEFT JOIN public.areas_fabrica af ON l5a.area_id = af.id
LEFT JOIN LATERAL jsonb_array_elements(
    CASE 
        WHEN jsonb_typeof(l5a.plano_acao_5w2h) = 'array' AND jsonb_array_length(l5a.plano_acao_5w2h) > 0 
        THEN l5a.plano_acao_5w2h 
        ELSE '[null]'::jsonb 
    END
) AS acao ON true
WHERE l5a.status != 'Em Analise' AND l5a.status != 'Rejeitado';

-- Migration 0094: Corrigir a visualização do HST no Action Hub para extrair do JSON d5_acao_corretiva

DROP VIEW IF EXISTS public.view_master_acoes;
CREATE VIEW public.view_master_acoes AS

-- 1. AÇÕES LEAN
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
    COALESCE(acao->>'quem', COALESCE(op.nome_operador, la.responsavel_nome)) AS responsavel_nome,
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
    af.nome_area,
    la.linha_id,
    lp.letra_linha AS nome_linha,
    la.estacao_id,
    e.nome_estacao,
    la.responsavel_id
FROM public.lean_acoes la
LEFT JOIN public.areas_fabrica af ON la.area_id = af.id
LEFT JOIN public.linhas_producao lp ON la.linha_id = lp.id
LEFT JOIN public.estacoes e ON la.estacao_id = e.id
LEFT JOIN public.operadores op ON la.responsavel_id = op.id
LEFT JOIN LATERAL jsonb_array_elements(
    CASE 
        WHEN jsonb_typeof(la.plano_acao_5w2h) = 'array' AND jsonb_array_length(la.plano_acao_5w2h) > 0 
        THEN la.plano_acao_5w2h 
        ELSE '[null]'::jsonb 
    END
) AS acao ON true

UNION ALL

-- 2. EXTRAÇÃO DAS AÇÕES DOS RELATÓRIOS 8D (HST)
SELECT 
    h8.id,
    'Ação HST: ' || COALESCE(ho.tipo_ocorrencia, 'Segurança') AS titulo,
    (acao->>'o_que') AS descricao,
    'HST' AS modulo_origem,
    'Ocorrencia/8D' AS categoria,
    (acao->>'quem') AS responsavel_nome,
    CASE 
        WHEN (acao->>'status') ILIKE 'Feito' THEN 'Concluido'
        WHEN (acao->>'status') ILIKE 'Done' THEN 'Concluido'
        ELSE COALESCE(acao->>'status', 'Pendente')
    END AS status,
    h8.created_at,
    CASE 
        WHEN acao->>'quando' IS NOT NULL AND acao->>'quando' != '' 
        THEN (acao->>'quando')::TIMESTAMP WITH TIME ZONE 
        ELSE NULL 
    END AS data_limite,
    NULL::TIMESTAMP WITH TIME ZONE AS data_conclusao,
    NULL::TIMESTAMP WITH TIME ZONE AS data_verificacao,
    'Não Verificado'::VARCHAR(50) AS status_eficacia,
    ho.area_id,
    af.nome_area,
    e.linha_id,
    lp.letra_linha AS nome_linha,
    ho.estacao_id,
    e.nome_estacao,
    NULL::UUID AS responsavel_id
FROM public.hst_8d h8
LEFT JOIN public.hst_ocorrencias ho ON h8.ocorrencia_id = ho.id
LEFT JOIN public.estacoes e ON ho.estacao_id = e.id
LEFT JOIN public.areas_fabrica af ON ho.area_id = af.id
LEFT JOIN public.linhas_producao lp ON e.linha_id = lp.id,
LATERAL jsonb_array_elements(
    CASE 
        WHEN h8.d5_acao_corretiva IS NOT NULL AND h8.d5_acao_corretiva LIKE '[%' 
        THEN h8.d5_acao_corretiva::jsonb 
        ELSE '[]'::jsonb 
    END
) AS acao

UNION ALL

-- 3. AÇÕES GLOBAIS
SELECT 
    ca.id,
    ca.titulo,
    ca.descricao,
    'Geral' AS modulo_origem,
    ca.categoria,
    COALESCE(op.nome_operador, ca.responsavel_nome) AS responsavel_nome,
    ca.status,
    ca.created_at,
    ca.data_limite,
    ca.data_conclusao,
    ca.data_verificacao,
    ca.status_eficacia,
    ca.area_id,
    af.nome_area,
    ca.linha_id,
    lp.letra_linha AS nome_linha,
    ca.estacao_id,
    e.nome_estacao,
    ca.responsavel_id
FROM public.central_acoes_globais ca
LEFT JOIN public.areas_fabrica af ON ca.area_id = af.id
LEFT JOIN public.linhas_producao lp ON ca.linha_id = lp.id
LEFT JOIN public.estacoes e ON ca.estacao_id = e.id
LEFT JOIN public.operadores op ON ca.responsavel_id = op.id

UNION ALL

-- 4. QUALIDADE A3
SELECT 
    a3.id,
    'Ação do A3: ' || a3.titulo AS titulo,
    (acao->>'o_que') AS descricao,
    'Qualidade' AS modulo_origem,
    'RNC/A3' AS categoria,
    (acao->>'quem') AS responsavel_nome,
    CASE 
        WHEN (acao->>'status') ILIKE 'Feito' THEN 'Concluido'
        WHEN (acao->>'status') ILIKE 'Done' THEN 'Concluido'
        ELSE COALESCE(acao->>'status', 'Pendente')
    END AS status,
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
    af.nome_area,
    e.linha_id,
    lp.letra_linha AS nome_linha,
    e.id AS estacao_id,
    e.nome_estacao,
    NULL::UUID AS responsavel_id
FROM public.qualidade_a3 a3
LEFT JOIN public.qualidade_rnc r ON a3.rnc_id = r.id
LEFT JOIN public.estacoes e ON r.estacao_id = e.id
LEFT JOIN public.areas_fabrica af ON e.area_id = af.id
LEFT JOIN public.linhas_producao lp ON e.linha_id = lp.id,
LATERAL jsonb_array_elements(
    CASE 
        WHEN a3.contramedidas IS NOT NULL AND a3.contramedidas LIKE '[%' 
        THEN a3.contramedidas::jsonb 
        ELSE '[]'::jsonb 
    END
) AS acao

UNION ALL

-- 5. LEAN 5S
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
    af.nome_area,
    l5a.linha_id,
    lp.letra_linha AS nome_linha,
    l5a.estacao_id,
    e.nome_estacao,
    l5a.responsavel_id
FROM public.lean_5s_acoes l5a
LEFT JOIN public.areas_fabrica af ON l5a.area_id = af.id
LEFT JOIN public.linhas_producao lp ON l5a.linha_id = lp.id
LEFT JOIN public.estacoes e ON l5a.estacao_id = e.id
LEFT JOIN LATERAL jsonb_array_elements(
    CASE 
        WHEN jsonb_typeof(l5a.plano_acao_5w2h) = 'array' AND jsonb_array_length(l5a.plano_acao_5w2h) > 0 
        THEN l5a.plano_acao_5w2h 
        ELSE '[null]'::jsonb 
    END
) AS acao ON true
WHERE l5a.status != 'Em Analise' AND l5a.status != 'Rejeitado';

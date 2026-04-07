-- 1. Migrar toda a informação existente nos 8D para a tabela de A3 Lean Canvas
INSERT INTO public.qualidade_a3 (
    rnc_id,
    titulo,
    autor,
    background,
    condicao_atual,
    analise_causa,
    contramedidas,
    status,
    created_at,
    updated_at
)
SELECT 
    rnc_id, 
    COALESCE(numero_8d, 'MIGRADO 8D'), 
    COALESCE(responsavel_nome, 'Administrador'), 
    d2_problema, 
    d3_contencao, 
    d4_causa_raiz, 
    d5_acao_permanente, 
    CASE WHEN status = 'Concluido' THEN 'Implementado' ELSE 'Em Desenvolvimento' END,
    created_at, 
    updated_at
FROM public.qualidade_8d;

-- 2. Apagar a tabela de Relatórios 8D
DROP TABLE IF EXISTS public.qualidade_8d CASCADE;

-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0044: Factory TVs Opções de Layout JSON
-- ======================================================================================

-- 1. Adicionar coluna opções_layout à tabela base configuracoes_tv
ALTER TABLE public.configuracoes_tv
ADD COLUMN IF NOT EXISTS opcoes_layout JSONB DEFAULT '{}'::jsonb;

-- 2. Apagar a view antiga para o Supabase não se queixar da nova coluna "opcoes_layout" no meio das colunas
DROP VIEW IF EXISTS public.vw_tvs_configuradas;

-- 3. Recriar a View vw_tvs_configuradas com a coluna na nova posição
CREATE OR REPLACE VIEW public.vw_tvs_configuradas AS
SELECT 
    t.id,
    t.nome_tv,
    t.tipo_alvo,
    t.alvo_id,
    t.layout_preferencial,
    t.opcoes_layout,
    CASE 
        WHEN t.tipo_alvo = 'LINHA' THEN l.descricao_linha
        WHEN t.tipo_alvo = 'AREA' THEN a.nome_area
        ELSE 'Toda a Fábrica'
    END as nome_alvo_resolvido
FROM 
    public.configuracoes_tv t
LEFT JOIN 
    public.linhas_producao l ON t.alvo_id = l.id
LEFT JOIN 
    public.areas_fabrica a ON t.alvo_id = a.id;

-- 4. Forçar Refresh da API
NOTIFY pgrst, 'reload schema';

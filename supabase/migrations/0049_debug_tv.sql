-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0049: DEBUG & FORCE REBUILD TV COLUMN
-- ======================================================================================

-- 1. Destruir a View Temporariamente para soltar dependências
DROP VIEW IF EXISTS public.vw_tvs_configuradas;

-- 2. Remover a coluna e voltar a criá-la (Isto obriga fisicamente o Supabase a reescrever o Schema)
ALTER TABLE public.configuracoes_tv DROP COLUMN IF EXISTS opcoes_layout CASCADE;
ALTER TABLE public.configuracoes_tv ADD COLUMN opcoes_layout JSONB DEFAULT '{}'::jsonb;

-- 3. Recriar a View 
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

-- 4. Notificar a API para limpar a cache absoluta
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

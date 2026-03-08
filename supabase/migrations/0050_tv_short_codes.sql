-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0050: Códigos Curtos para TV (TV Provisioning)
-- ======================================================================================

-- 1. Adicionar coluna codigo_curto à tabela base configuracoes_tv
ALTER TABLE public.configuracoes_tv
ADD COLUMN IF NOT EXISTS codigo_curto VARCHAR(10) UNIQUE;

-- 2. Gerar códigos curtos automáticos para as TVs que já existirem na base de dados (Ex: "A8B2X")
UPDATE public.configuracoes_tv
SET codigo_curto = upper(substring(md5(random()::text) from 1 for 5))
WHERE codigo_curto IS NULL;

-- 3. Agora que as TVs antigas têm código, forçar a coluna a ser NOT NULL no futuro
ALTER TABLE public.configuracoes_tv ALTER COLUMN codigo_curto SET NOT NULL;

-- 4. Apagar a view para evitar conflitos de cache e reconstruções no meio das colunas
DROP VIEW IF EXISTS public.vw_tvs_configuradas;

-- 5. Recriar a View vw_tvs_configuradas com a coluna na nova posição
CREATE OR REPLACE VIEW public.vw_tvs_configuradas AS
SELECT 
    t.id,
    t.nome_tv,
    t.tipo_alvo,
    t.alvo_id,
    t.layout_preferencial,
    t.opcoes_layout,
    t.codigo_curto,
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

-- 6. Forçar Refresh da API
NOTIFY pgrst, 'reload schema';

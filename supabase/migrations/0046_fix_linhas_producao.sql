-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0046: Correção de Dependências de Base (Linhas e Áreas)
-- ======================================================================================

-- 1. Garantir que a tabela `linhas_producao` existe (Prevenção do erro "relation does not exist")
CREATE TABLE IF NOT EXISTS public.linhas_producao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    letra_linha VARCHAR(10) NOT NULL,
    descricao_linha VARCHAR(255),
    capacidade_diaria INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Garantir que a tabela `areas_fabrica` existe (A outra dependência na VIEW da TV)
CREATE TABLE IF NOT EXISTS public.areas_fabrica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_area VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Recriar a View das TVs, agora que as dependências garantidamente existem
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

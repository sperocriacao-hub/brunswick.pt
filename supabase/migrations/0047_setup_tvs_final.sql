-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0047: SETUP FINAL E DEFINITIVO DAS TVs
-- ======================================================================================

-- 1. GARANTIR DEPENDÊNCIAS BASE (Linhas e Áreas)
CREATE TABLE IF NOT EXISTS public.linhas_producao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    letra_linha VARCHAR(10) NOT NULL,
    descricao_linha VARCHAR(255),
    capacidade_diaria INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.areas_fabrica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_area VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GARANTIR A TABELA PRINCIPAL DAS TVs
CREATE TABLE IF NOT EXISTS public.configuracoes_tv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_tv VARCHAR(255) NOT NULL,
    tipo_alvo VARCHAR(50) NOT NULL DEFAULT 'AREA', -- 'LINHA', 'AREA', 'GERAL'
    alvo_id UUID,
    layout_preferencial VARCHAR(50) NOT NULL DEFAULT 'KPI_HINTS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ADICIONAR A COLUNA DE WIDGETS NASA (JSONB)
ALTER TABLE public.configuracoes_tv
ADD COLUMN IF NOT EXISTS opcoes_layout JSONB DEFAULT '{}'::jsonb;

-- 4. ATIVAR SEGURANÇA (RLS)
ALTER TABLE public.configuracoes_tv ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Permitir leitura anonima para hardware tvs configuracoes" 
        ON public.configuracoes_tv FOR SELECT 
        USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Permitir CRUD admin/gestor em configuracoes_tv" 
        ON public.configuracoes_tv FOR ALL 
        USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. CRIAR A VIEW FINAL QUE LIGA TUDO
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

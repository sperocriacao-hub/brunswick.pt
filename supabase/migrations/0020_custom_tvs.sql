-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0020: Configuração de Televisões (Hardware Mapeado)
-- ======================================================================================

CREATE TABLE IF NOT EXISTS public.configuracoes_tv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_tv VARCHAR(255) NOT NULL, -- Exemplo: "Ecran 55" Entrada Laminacao"
    tipo_alvo VARCHAR(50) NOT NULL DEFAULT 'AREA', -- 'LINHA', 'AREA', 'GERAL'
    alvo_id UUID, -- Relacionamento flexível com linha/área, nulo se for fábrica inteira
    layout_preferencial VARCHAR(50) NOT NULL DEFAULT 'KPI_HINTS', -- Qual o layout React a renderizar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS
ALTER TABLE public.configuracoes_tv ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Permitir leitura anonima para hardware tvs configuracoes" 
    ON public.configuracoes_tv FOR SELECT 
    USING (true);

CREATE POLICY "Permitir CRUD admin/gestor em configuracoes_tv" 
    ON public.configuracoes_tv FOR ALL 
    USING (true); -- M2M (Service Role passa), Auth Web a ser reforçado a posteriori.

-- Criar View para unificar os nomes das áreas ou das linhas no dashboard sem fazer joins complexos no Frontend
CREATE OR REPLACE VIEW public.vw_tvs_configuradas AS
SELECT 
    t.id,
    t.nome_tv,
    t.tipo_alvo,
    t.alvo_id,
    t.layout_preferencial,
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

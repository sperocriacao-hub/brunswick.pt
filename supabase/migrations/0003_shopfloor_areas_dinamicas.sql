-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0003: ÁREAS DE FÁBRICA DINÂMICAS E SEQUENCIADOR KANBAN
-- ======================================================================================

-- 1. CRIAR TABELA DE ÁREAS (AS COLUNAS DO KANBAN 2D)
-- A ordem_sequencial define a posição X na grelha do Shopfloor.
CREATE TABLE public.areas_fabrica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_area VARCHAR(255) NOT NULL UNIQUE,
    descricao TEXT,
    ordem_sequencial INTEGER NOT NULL DEFAULT 1,
    cor_destaque VARCHAR(50) DEFAULT 'var(--primary)',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para auto-atualizar o updated_at das Areas
CREATE TRIGGER update_areas_fabrica_updated_at 
BEFORE UPDATE ON public.areas_fabrica 
FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

-- 2. ALTERAR A TABELA DE ESTAÇÕES PARA REFERENCIAR AS NOVAS ÁREAS
-- Primeiro apagamos as colunas de texto livre (hardcoded) criadas na migração 0002.
ALTER TABLE public.estacoes
    DROP COLUMN IF EXISTS area_grupo,
    ADD COLUMN area_id UUID REFERENCES public.areas_fabrica(id) ON DELETE SET NULL;

-- (Opcional) A sub_area pode manter-se como texto livre ou FK futuramente,
-- por agora mantemos a sub_area como texto pois tem de granular muito (ex: Pintura Base vs Verniz)
-- Mas a COLUNA MASTER (Área Kanban) já é relacional.

-- 3. ENABLE ROW LEVEL SECURITY PARA AS ÁREAS
ALTER TABLE public.areas_fabrica ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES PARA AS ÁREAS
CREATE POLICY "Permitir Leitura de Areas Autenticados" 
ON public.areas_fabrica FOR SELECT TO authenticated USING (true);

CREATE POLICY "CRUD Total Autenticados Areas" 
ON public.areas_fabrica FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ======================================================================================
-- 5. POPULAR COM AS PRIMEIRAS ÁREAS PREDEFINIDAS DO CLIENTE (MOCKUPS BASE)
-- Injetamos de imediato a ordem e os offsets satélites baseados nas necessidades da indústria naval
-- ======================================================================================
INSERT INTO public.areas_fabrica (nome_area, descricao, ordem_sequencial, cor_destaque) VALUES
    ('Laminação', 'Produção dos cascos em fibra e resinas', 1, '#3b82f6'),
    ('Corte', 'Recorte das rebarbas de coberta e convés', 2, '#64748b'),
    ('Reparação', 'Controlo Qualidade e Correção de Gelcoat', 3, '#f59e0b'),
    ('Pré-montagem', 'Acoplamentos iniciais de sistemas e convés', 4, '#8b5cf6'),
    ('Montagem', 'Linha de montagem pesada de motores e casco', 5, '#10b981'),
    ('Carpintaria', 'Módulo Satélite OFF-LINE: Teca Interior (Alimenta Várias)', 6, '#84cc16'),
    ('Estofos', 'Módulo Satélite OFF-LINE: Bancos e Telas (Alimenta Montagem)', 7, '#ec4899');

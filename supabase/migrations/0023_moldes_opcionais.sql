-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0023: GESTÃO AVANÇADA DE MOLDES (CATEGORIZAÇÃO & OPCIONAIS)
-- ======================================================================================

-- 1. Expansão da Tabela de Moldes Existente
ALTER TABLE public.moldes
    ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'BIG_PART' CHECK (categoria IN ('BIG_PART', 'MEDIUM_PART', 'SMALL_PART')),
    ADD COLUMN IF NOT EXISTS tipo_parte VARCHAR(100), -- Ex: 'Casco', 'Coberta', 'HardTop', 'Caixa Gelo'
    ADD COLUMN IF NOT EXISTS modelo_base_id UUID REFERENCES public.modelos(id) ON DELETE SET NULL, -- Se o molde é exclusivo de um barco
    ADD COLUMN IF NOT EXISTS moldagem_obrigatoria BOOLEAN DEFAULT false; -- Se TRUE, o barco não pode ser fabricado sem instanciar este molde.

-- 2. Tabela Associativa: Moldes que apenas são necessários caso uma OP subscrita possua certo Opcional
CREATE TABLE IF NOT EXISTS public.moldes_opcionais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    molde_id UUID NOT NULL REFERENCES public.moldes(id) ON DELETE CASCADE,
    opcional_id UUID NOT NULL REFERENCES public.opcionais(id) ON DELETE CASCADE,
    UNIQUE(molde_id, opcional_id)
);

-- RLS Segurança
ALTER TABLE public.moldes_opcionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura_Moldes_Opcionais" ON public.moldes_opcionais FOR SELECT TO authenticated USING (true);
CREATE POLICY "CRUD_Moldes_Opcionais" ON public.moldes_opcionais FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notificar Cliente REST
NOTIFY pgrst, 'reload schema';

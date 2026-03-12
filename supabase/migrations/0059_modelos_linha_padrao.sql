-- ======================================================================================
-- MIGRATION: 0059_modelos_linha_padrao.sql
-- Adiciona a associação de cada Modelo de Embarcação à sua Linha de Produção Principal
-- ======================================================================================

ALTER TABLE public.modelos 
ADD COLUMN IF NOT EXISTS linha_padrao_id UUID REFERENCES public.linhas_producao(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.modelos.linha_padrao_id IS 'Indica qual é a Linha de Produção por defeito na qual este modelo naval costuma ser montado/produzido';

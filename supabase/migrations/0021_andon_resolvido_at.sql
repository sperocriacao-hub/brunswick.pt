-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0021: Adição de Resolução At para Cálculo OEE Andon
-- ======================================================================================

ALTER TABLE public.alertas_andon
    ADD COLUMN IF NOT EXISTS resolvido_at TIMESTAMPTZ;

-- Recarregar schema (para que o backend leia postgrest sem erros de cache)
NOTIFY pgrst, 'reload schema';

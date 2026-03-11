-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0058: ALERTAS ANDON LOCAL OCORRENCIA
-- Adicionar coluna 'local_ocorrencia_id' para distinguir onde o problema ocorreu 
-- de quem é a estação causadora ('estacao_id')
-- ======================================================================================

ALTER TABLE public.alertas_andon
ADD COLUMN IF NOT EXISTS local_ocorrencia_id UUID REFERENCES public.estacoes(id) ON DELETE SET NULL;

-- Backwards compatibility: Para os alertas existentes, assumimos que o local é igual à causa
UPDATE public.alertas_andon
SET local_ocorrencia_id = estacao_id
WHERE local_ocorrencia_id IS NULL;

-- Tornar NOT NULL no futuro se necessário, por enquanto deixamos flexível.
CREATE INDEX idx_andon_local_ocorrencia ON public.alertas_andon(local_ocorrencia_id);

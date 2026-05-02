-- Adicionar coluna para rastreio de modelo e hin no Andon
ALTER TABLE alertas_andon ADD COLUMN IF NOT EXISTS modelo_hin TEXT;

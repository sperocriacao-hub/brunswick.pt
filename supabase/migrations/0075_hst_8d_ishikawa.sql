-- Migração 0075: Adicionar tipo_analise_causa ao HST 8D

ALTER TABLE public.hst_8d
ADD COLUMN IF NOT EXISTS tipo_analise_causa VARCHAR(50) DEFAULT '5-Whys';

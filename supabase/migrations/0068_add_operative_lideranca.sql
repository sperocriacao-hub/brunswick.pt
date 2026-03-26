-- Caso a tabela original já tenha sido criada (Migration 0067), 
-- este script adiciona os 6 novos pilares operacionais à avaliação da Liderança
ALTER TABLE public.avaliacoes_lideranca 
ADD COLUMN IF NOT EXISTS nota_hst NUMERIC(3,1) NOT NULL DEFAULT 3.0,
ADD COLUMN IF NOT EXISTS nota_epi NUMERIC(3,1) NOT NULL DEFAULT 3.0,
ADD COLUMN IF NOT EXISTS nota_5s NUMERIC(3,1) NOT NULL DEFAULT 3.0,
ADD COLUMN IF NOT EXISTS nota_eficiencia NUMERIC(3,1) NOT NULL DEFAULT 3.0,
ADD COLUMN IF NOT EXISTS nota_objetivos NUMERIC(3,1) NOT NULL DEFAULT 3.0,
ADD COLUMN IF NOT EXISTS nota_atitude NUMERIC(3,1) NOT NULL DEFAULT 3.0;

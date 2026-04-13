-- Migração 0070: Expansão da Academia Fabril (Roadmaps e Integração Automática)

-- 1. Adicionar Data Estimada para Gráfico de Gantt
ALTER TABLE public.rh_planos_formacao 
ADD COLUMN IF NOT EXISTS data_fim_estimada DATE;

-- Lógica para migrações anteriores: se não tem, assumimos +14 dias desde a data de inicio
UPDATE public.rh_planos_formacao 
SET data_fim_estimada = data_inicio + INTERVAL '14 days' 
WHERE data_fim_estimada IS NULL AND data_fim IS NULL;

-- Re-adiciona as colunas de planeamento semanal (Legacy Support)
-- O módulo de Planeamento Semanal (Kanban) utiliza estas colunas para alinhar
-- OPs em dias da semana e ordem física da linha (drag and drop).

ALTER TABLE public.ordens_producao
    ADD COLUMN IF NOT EXISTS semana_planeada VARCHAR(50) DEFAULT 'BACKLOG',
    ADD COLUMN IF NOT EXISTS ordem_sequencial_linha INTEGER DEFAULT 0;

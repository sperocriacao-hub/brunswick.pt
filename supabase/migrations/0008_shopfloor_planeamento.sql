-- Migração 0008: Extensões Planeamento de Produção Semanal (Kanban/Drag&Drop)
-- Adiciona campos logísticos para a indexação temporal e posicional no tabuleiro M.E.S.

ALTER TABLE public.ordens_producao
ADD COLUMN IF NOT EXISTS semana_planeada VARCHAR(20) NULL, -- Exemplo: 'W34-2026'
ADD COLUMN IF NOT EXISTS ordem_sequencial_linha INTEGER DEFAULT 0, -- Índice visual (drag & drop Y axis)
ADD COLUMN IF NOT EXISTS data_prevista_inicio TIMESTAMPTZ NULL; -- Anchor Start Time para Roteiros

-- Adicionamos comentários à tabela para auto-documentação PostgreSQL
COMMENT ON COLUMN public.ordens_producao.semana_planeada IS 'Semana Alvo para início de Produção (Ex: W52-2025). Serve de coluna no Quadro Kanban.';
COMMENT ON COLUMN public.ordens_producao.ordem_sequencial_linha IS 'Posição relativa do Barco (Order Index) face a outros na mesma linha durante a Semana/Dia.';
COMMENT ON COLUMN public.ordens_producao.data_prevista_inicio IS 'Data/Hora oficial de disparo do primeiro Offset dos Roteiros, preenchido via drop interativo.';

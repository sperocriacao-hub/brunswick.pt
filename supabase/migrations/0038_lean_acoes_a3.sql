-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0038: ATUALIZAR LEAN AÇÕES PARA RELATORIO A3 / PDCA
-- Adiciona colunas avançadas à tabela de Ações Lean para suportar resolução 
-- estruturada de problemas em vez de um simples To-Do List.
-- ======================================================================================

-- 1. Adicionar Campos A3 à Tabela de Ações Lean
ALTER TABLE public.lean_acoes 
ADD COLUMN se_not_exists equipa_trabalho TEXT, -- Ex: Zé (Manut), Maria (Qualidade)
ADD COLUMN se_not_exists causa_raiz_5w JSONB DEFAULT '[]'::jsonb, -- Array de 5 Porquês
ADD COLUMN se_not_exists plano_acao_5w2h JSONB DEFAULT '[]'::jsonb, -- Array de Sub-tarefas 5W2H
ADD COLUMN se_not_exists indicadores_sucesso TEXT,
ADD COLUMN se_not_exists validacao_eficacia VARCHAR(50) DEFAULT 'Pendente' CHECK (validacao_eficacia IN ('Pendente', 'Eficaz', 'Ineficaz'));

-- Nota: Utilizamos se_not_exists em Postgres 11+ via um DO block se necessário,
-- mas como o Supabase suporta `ADD COLUMN IF NOT EXISTS`, vamos usar a sintaxe limpa:
-- Correção sintática padronizada:
ALTER TABLE public.lean_acoes ADD COLUMN IF NOT EXISTS equipa_trabalho TEXT;
ALTER TABLE public.lean_acoes ADD COLUMN IF NOT EXISTS causa_raiz_5w JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.lean_acoes ADD COLUMN IF NOT EXISTS plano_acao_5w2h JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.lean_acoes ADD COLUMN IF NOT EXISTS indicadores_sucesso TEXT;
ALTER TABLE public.lean_acoes ADD COLUMN IF NOT EXISTS validacao_eficacia VARCHAR(50) DEFAULT 'Pendente' CHECK (validacao_eficacia IN ('Pendente', 'Eficaz', 'Ineficaz'));

-- ======================================================================================
-- FIM DA MIGRAÇÃO
-- ======================================================================================

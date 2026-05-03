-- Migração 0074: Standardize Scrum Boards (RNC, Lean, HST) e Ishikawa

-- -----------------------------------------------------------------------
-- 1. ADICIONAR NOVA COLUNA PARA TIPO DE ANÁLISE CAUSA RAIZ
-- -----------------------------------------------------------------------
-- Na Qualidade (A3/8D partilhado em Qualidade e HST)
ALTER TABLE public.qualidade_a3
ADD COLUMN IF NOT EXISTS tipo_analise_causa VARCHAR(50) DEFAULT '5-Whys';

-- No Lean (Ações contêm a própria análise)
ALTER TABLE public.lean_acoes
ADD COLUMN IF NOT EXISTS tipo_analise_causa VARCHAR(50) DEFAULT '5-Whys';


-- -----------------------------------------------------------------------
-- 2. REMOVER CONSTRAINTS ANTIGAS DE STATUS
-- -----------------------------------------------------------------------
-- Qualidade (RNC)
ALTER TABLE public.qualidade_rnc DROP CONSTRAINT IF EXISTS qualidade_rnc_status_check;

-- Lean (Ações)
ALTER TABLE public.lean_acoes DROP CONSTRAINT IF EXISTS lean_acoes_status_check;

-- HST (Ações Kanban)
ALTER TABLE public.hst_acoes DROP CONSTRAINT IF EXISTS hst_acoes_status_check;


-- -----------------------------------------------------------------------
-- 3. TRADUZIR ESTADOS ANTIGOS NOS DADOS (MIGRATION DE DADOS PENDENTES)
-- -----------------------------------------------------------------------
-- Lean Ações
UPDATE public.lean_acoes SET status = 'Aberto' WHERE status = 'To Do';
UPDATE public.lean_acoes SET status = 'Em Investigacao' WHERE status = 'In Progress';
UPDATE public.lean_acoes SET status = 'Validacao' WHERE status = 'Blocked';
UPDATE public.lean_acoes SET status = 'Concluido' WHERE status = 'Done';

-- HST Ações
UPDATE public.hst_acoes SET status = 'Aberto' WHERE status = 'To Do';
UPDATE public.hst_acoes SET status = 'Em Investigacao' WHERE status = 'In Progress';
UPDATE public.hst_acoes SET status = 'Validacao' WHERE status = 'Blocked';
UPDATE public.hst_acoes SET status = 'Concluido' WHERE status = 'Done';


-- -----------------------------------------------------------------------
-- 4. APLICAR NOVAS CONSTRAINTS (CHECK) PARA GARANTIR INTEGRIDADE
-- -----------------------------------------------------------------------
-- Qualidade (RNC) - Adicionado o Validacao e atualizado o Cancelado
ALTER TABLE public.qualidade_rnc 
ADD CONSTRAINT qualidade_rnc_status_check 
CHECK (status IN ('Aberto', 'Em Investigacao', 'Validacao', 'Concluido', 'Cancelado'));

-- Lean (Ações)
ALTER TABLE public.lean_acoes 
ADD CONSTRAINT lean_acoes_status_check 
CHECK (status IN ('Aberto', 'Em Investigacao', 'Validacao', 'Concluido'));

-- HST (Ações Kanban)
ALTER TABLE public.hst_acoes 
ADD CONSTRAINT hst_acoes_status_check 
CHECK (status IN ('Aberto', 'Em Investigacao', 'Validacao', 'Concluido'));

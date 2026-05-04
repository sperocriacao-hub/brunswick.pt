-- Migration 0081: Remover Check Constraints Restritivas e Corrigir Nomes de Colunas

-- 1. CENTRAL DE AÇÕES (Hub Global)
-- Remover a restrição rígida de categorias para permitir Categorias Dinâmicas (tabela central_acoes_categorias)
ALTER TABLE public.central_acoes_globais DROP CONSTRAINT IF EXISTS central_acoes_globais_categoria_check;
ALTER TABLE public.central_acoes_globais DROP CONSTRAINT IF EXISTS central_acoes_globais_status_check;

-- 2. QUALIDADE RNC e A3
-- Remover a restrição de status do RNC para permitir "Encerrado", "Cancelado" de forma dinâmica
ALTER TABLE public.qualidade_rnc DROP CONSTRAINT IF EXISTS qualidade_rnc_status_check;
-- Adicionar a coluna contexto_producao que era enviada pelo frontend mas não existia na BD
ALTER TABLE public.qualidade_rnc ADD COLUMN IF NOT EXISTS contexto_producao VARCHAR(255);

ALTER TABLE public.qualidade_a3 DROP CONSTRAINT IF EXISTS qualidade_a3_status_check;

-- 3. LEAN AÇÕES e HST AÇÕES
-- Remover a restrição de status para permitir padronização com "Concluido" e "Encerrado" sem crashes
ALTER TABLE public.lean_acoes DROP CONSTRAINT IF EXISTS lean_acoes_status_check;
ALTER TABLE public.lean_kaizen DROP CONSTRAINT IF EXISTS lean_kaizen_status_check;
ALTER TABLE public.hst_acoes DROP CONSTRAINT IF EXISTS hst_acoes_status_check;

-- 4. AUSÊNCIAS RH
-- Tentar renomear a coluna 'observacoes' para 'motivo_observacao' apenas por precaução, 
-- caso o 0073 tenha sido usado. No entanto o Frontend foi alterado para usar 'observacoes',
-- logo esta alteração é apenas defensiva. Se a coluna já não existir, vai ignorar com DO block.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rh_ausencias' AND column_name = 'motivo_observacao'
  ) THEN
    -- A coluna motivo_observacao já existe (0076 funcionou bem e estava vazia), garantimos que observacoes tambem existe
    ALTER TABLE public.rh_ausencias ADD COLUMN IF NOT EXISTS observacoes TEXT;
  END IF;
END $$;

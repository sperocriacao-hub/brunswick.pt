-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0037: FIX DA EXTENSÃO MODDATETIME (ARGUMENTOS)
-- A extensão moddatetime() exige que se passe o nome da coluna alvo como argumento.
-- Esta migração apaga os triggers inválidos criados nas migrações anteriores e 
-- recria-os com a sintaxe correta `moddatetime(updated_at)` para evitar o erro:
-- "A single argument was expected".
-- ======================================================================================

-- 1. Tabela: Lean Kaizen
DROP TRIGGER IF EXISTS handle_updated_at_kaizen ON public.lean_kaizen;
CREATE TRIGGER handle_updated_at_kaizen BEFORE UPDATE ON public.lean_kaizen 
FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- 2. Tabela: Lean Ações (Global)
DROP TRIGGER IF EXISTS handle_updated_at_acoes ON public.lean_acoes;
CREATE TRIGGER handle_updated_at_acoes BEFORE UPDATE ON public.lean_acoes 
FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- 3. Tabela: HST Ocorrências
-- Fix preventivo, pois também foi instanciada na migração 32 com o mesmo erro
DROP TRIGGER IF EXISTS handle_updated_at_hst_ocorrencias ON public.hst_ocorrencias;
CREATE TRIGGER handle_updated_at_hst_ocorrencias BEFORE UPDATE ON public.hst_ocorrencias 
FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- ======================================================================================
-- FIM DA MIGRAÇÃO
-- ======================================================================================

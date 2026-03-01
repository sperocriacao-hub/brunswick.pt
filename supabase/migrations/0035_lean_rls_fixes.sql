-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0035: RLS PARA COMITÊ KAIZEN E AÇÕES (ADMIN SEM SESSÃO)
-- Na ausência de Service Role Key Vercel, o admin opera com Anon Key. 
-- Precisamos desbloquear UPDATE na lean_kaizen e INSERT/UPDATE na lean_acoes.
-- ======================================================================================

-- 1. Desbloquear a edição do Kaizen (Para o Comitê poder Aceitar/Rejeitar)
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.lean_kaizen;
CREATE POLICY "Permitir Update Kaizen Comite" ON public.lean_kaizen FOR UPDATE USING (true);

-- 2. Desbloquear o Módulo de Ações Globais Lean
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.lean_acoes;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.lean_acoes;

CREATE POLICY "Permitir Insert Lean Acoes" ON public.lean_acoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir Update Lean Acoes" ON public.lean_acoes FOR UPDATE USING (true);
CREATE POLICY "Permitir Delete Lean Acoes" ON public.lean_acoes FOR DELETE USING (true);

-- ======================================================================================
-- FIM DA MIGRAÇÃO
-- ======================================================================================

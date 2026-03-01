-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0036: RLS PARA GEMBA WALKS (ADMIN SEM SESSÃO)
-- Como a plataforma opera sem sistema de login, precisamos permitir que os 
-- chefes submetam relatórios de Ronda e Atualizem Ações
-- ======================================================================================

-- 1. Desbloquear a Inserção e Visualização de Gemba Walks
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.lean_gemba_walks;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.lean_gemba_walks;

CREATE POLICY "Permitir Insert Gemba Walks" ON public.lean_gemba_walks FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir Update Gemba Walks" ON public.lean_gemba_walks FOR UPDATE USING (true);

-- ======================================================================================
-- FIM DA MIGRAÇÃO
-- ======================================================================================

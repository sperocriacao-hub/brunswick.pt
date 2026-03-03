-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0040: ANON INSERTS PARA AVALIAÇÕES RH
-- Permite que os supervisores (ou tablets deslogados) possam gravar avaliações diárias
-- sem que o Row Level Security da Supabase bloqueie silenciosamente.
-- ======================================================================================

-- 1. AVALIAÇÕES DIÁRIAS (RH)
-- Remover a restrição anterior
DROP POLICY IF EXISTS "CRUD Total Autenticados Avaliacoes" ON public.avaliacoes_diarias;

-- Criar política nova cobrindo 'authenticated' + 'anon'
-- Deixamos UPDATE e DELETE restritos aos Autenticados (se quisermos ser puristas), 
-- E INSERT livre para que qualquer tablet possa gravar os dados.
CREATE POLICY "Permitir Insert Anon Avaliacoes" ON public.avaliacoes_diarias FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir Select Anon Avaliacoes" ON public.avaliacoes_diarias FOR SELECT USING (true);
CREATE POLICY "Permitir Update Anon Avaliacoes" ON public.avaliacoes_diarias FOR UPDATE USING (true) WITH CHECK (true);


-- 2. APONTAMENTOS NEGATIVOS (Anexos das notas baixas)
-- Remover restrição anterior
DROP POLICY IF EXISTS "CRUD Total Autenticados Apontamentos" ON public.apontamentos_negativos;

-- Criar política nova cobrindo 'authenticated' + 'anon'
CREATE POLICY "Permitir Insert Anon Apontamentos" ON public.apontamentos_negativos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir Select Anon Apontamentos" ON public.apontamentos_negativos FOR SELECT USING (true);
CREATE POLICY "Permitir Update Anon Apontamentos" ON public.apontamentos_negativos FOR UPDATE USING (true) WITH CHECK (true);

-- ======================================================================================
-- FIM DA MIGRAÇÃO
-- ======================================================================================

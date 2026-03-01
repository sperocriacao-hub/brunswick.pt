-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0034: ANON INSERTS PARA KAIZEN (TABLET YIELD)
-- Permite que os tablets (sem sessão iniciada) possam gravar ideias de melhoria
-- diretamente na tabela `lean_kaizen`.
-- ======================================================================================

-- 1. Apagar a política antiga restritiva que exigia login para inserir Kaizens
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.lean_kaizen;

-- 2. Criar a nova política abrangente (Permite Anon e Authenticated)
CREATE POLICY "Permitir Insert de Kaizens" ON public.lean_kaizen FOR INSERT WITH CHECK (true);

-- 3. (Opcional - mas recomendado) Fazer o mesmo para RNCs caso futuramente 
-- o tablet também porte o formulário de não-conformidades.
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.qualidade_rnc;
CREATE POLICY "Permitir Insert de RNCs" ON public.qualidade_rnc FOR INSERT WITH CHECK (true);

-- ======================================================================================
-- FIM DA MIGRAÇÃO
-- ======================================================================================

-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0016: KIOSK ANON RLS POLICIES (PLANEAMENTO)
-- Permite que a página de Planeamento (que não tem Service Role) consiga ler 
-- as linhas de produção, roteiros e opcionais.
-- ======================================================================================

-- Activar RLS de Segurança nas tabelas (caso ainda não estejam)
ALTER TABLE public.linhas_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roteiros_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opcionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moldes ENABLE ROW LEVEL SECURITY;

-- 1. Permissão de Leitura para Linhas e Opcionais
CREATE POLICY "Permitir Leitura de Linhas Anon" ON public.linhas_producao FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir Leitura de Opcionais Anon" ON public.opcionais FOR SELECT TO anon USING (true);

-- 2. Permissão de Leitura para Roteiros e Moldes
CREATE POLICY "Permitir Leitura de Roteiros Anon" ON public.roteiros_producao FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir Leitura de Moldes Anon" ON public.moldes FOR SELECT TO anon USING (true);

-- ======================================================================================
-- FIM DA MIGRAÇÃO
-- ======================================================================================

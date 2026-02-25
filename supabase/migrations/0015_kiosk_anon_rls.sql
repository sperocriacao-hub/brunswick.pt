-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0015: KIOSK ANON RLS POLICIES
-- Permite que os tablets e ESP32 (kiosks sem login) consigam listar as estações 
-- e ordens de produção ativas através do endpoint anónimo.
-- ======================================================================================

-- 1. Permissão de Leitura para Tablets Kiosk na Estrutura da Fábrica
CREATE POLICY "Permitir Leitura de Areas Anon" ON public.areas_fabrica FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir Leitura de Estacoes Anon" ON public.estacoes FOR SELECT TO anon USING (true);

-- 2. Permissão de Leitura para Modelos e Produção (necessário para listar os barcos vivos na linha)
CREATE POLICY "Permitir Leitura de Modelos Anon" ON public.modelos FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir Leitura de Ordens Anon" ON public.ordens_producao FOR SELECT TO anon USING (true);

-- 3. Permissão de Leitura para Log de Conclusão (para filtrar os macrotimings e não mostrar barcos já feitos)
-- Verificar se a tabela log_estacao_conclusao já tem RLS ativado, se não ativamos.
ALTER TABLE public.log_estacao_conclusao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir Leitura de Conclusoes Anon" ON public.log_estacao_conclusao FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir Leitura de Conclusoes Auth" ON public.log_estacao_conclusao FOR SELECT TO authenticated USING (true);

-- ======================================================================================
-- FIM DA MIGRAÇÃO
-- ======================================================================================

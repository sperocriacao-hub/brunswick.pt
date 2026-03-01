-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0033: ANON READS PARA TERMINAIS HMI KIOSK
-- Permite que os tablets (kiosks sem login de sessão) consigam listar 
-- as Entidades Laborais (Operadores) essenciais para reportar Defeitos e Kaizens.
-- ======================================================================================

-- Permitir que a API pública leia a lista de funcionários ativos (usado nos Dropdowns dos Tablets Operador)
CREATE POLICY "Permitir Leitura de Operadores Anon" ON public.operadores FOR SELECT TO anon USING (true);

-- ======================================================================================
-- FIM DA MIGRAÇÃO
-- ======================================================================================

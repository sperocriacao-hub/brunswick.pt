-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0048: Force Schema Cache Reload
-- ======================================================================================

-- O PostgREST (API do Supabase) em cache não reconheceu de imediato a nova coluna adicionada.
-- Este comando força uma recarga imediata à estrutura de cache do schema.

NOTIFY pgrst, 'reload schema';

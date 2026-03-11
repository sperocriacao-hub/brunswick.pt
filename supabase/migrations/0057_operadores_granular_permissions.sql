-- --------------------------------------------------------------------------------------
-- 0057_operadores_granular_permissions.sql
-- Change Role-Based Authorization to Granular Sidebar Topic Access
-- --------------------------------------------------------------------------------------

-- Add a column to store the specific array of allowed path substrings (e.g. ['/admin/producao/ordens', '/admin/engenharia'])
ALTER TABLE public.operadores ADD COLUMN IF NOT EXISTS permissoes_modulos TEXT[] DEFAULT '{}';

-- Optional: If an existing user is 'Admin', grant them widespread access (or rely on frontend logic to short-circuit Admins)
-- The application architecture specifies that 'Admin' will short-circuit and not even read `permissoes_modulos`, so no backfill is strictly necessary for Admins.

-- Grant existing non-Admins who had access to the system some baseline access so they don't lose everything immediately, if desired.
-- UPDATE public.operadores SET permissoes_modulos = ARRAY['/operador'] WHERE possui_acesso_sistema = true AND nivel_permissao = 'Operador';
-- UPDATE public.operadores SET permissoes_modulos = ARRAY['/admin/producao', '/operador'] WHERE possui_acesso_sistema = true AND nivel_permissao = 'Supervisor';
-- UPDATE public.operadores SET permissoes_modulos = ARRAY['/admin/producao', '/admin/engenharia'] WHERE possui_acesso_sistema = true AND nivel_permissao = 'Planeador';

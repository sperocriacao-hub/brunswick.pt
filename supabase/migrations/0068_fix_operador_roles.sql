-- Migration 0068: Remover restrição estrita de nivel de permissao dos operadores
-- Permite ao RH selecionar e gravar roles modernos ("Recursos Humanos", "Qualidade", etc) sem ser bloqueado pela Base de Dados

ALTER TABLE public.operadores DROP CONSTRAINT IF EXISTS operadores_nivel_permissao_check;

NOTIFY pgrst, 'reload schema';

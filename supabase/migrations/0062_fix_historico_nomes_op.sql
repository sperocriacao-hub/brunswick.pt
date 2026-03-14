-- -----------------------------------------------------------------------------
-- MIGRATION 0062: Retroactive Display Name Update for Historic OPs
-- -----------------------------------------------------------------------------

-- Fix ALL existing production orders that do not have a display name populated
UPDATE public.ordens_producao op
SET display_nome = (
    SELECT nome_modelo 
    FROM public.modelos m 
    WHERE m.id = op.modelo_id
) || ' # ' || op.hin_hull_id
WHERE op.display_nome IS NULL 
  AND op.modelo_id IS NOT NULL 
  AND op.hin_hull_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- MIGRATION: Drop Unique Constraints on Hull Number & Serial Number
-- -----------------------------------------------------------------------------
-- Removes the global uniqueness limitation on hin_hull_id and num_serie
-- allowing different boat models to share the same sequence numbers (e.g., "012").

ALTER TABLE public.ordens_producao 
  DROP CONSTRAINT IF EXISTS ordens_producao_hin_hull_id_key,
  DROP CONSTRAINT IF EXISTS ordens_producao_num_serie_key;

-- Optionally, if we ever need to enforce uniqueness per model, we could do:
-- ADD CONSTRAINT ordens_producao_modelo_hull_unique UNIQUE (modelo_id, hin_hull_id);

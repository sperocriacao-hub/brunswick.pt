-- Migration 0057: Revert Modelos Extensions
-- The business does not require tracking generic categories or product image URLs anymore.
-- Production Line assignment (linha_id) remains as it is critical for MES routing.

ALTER TABLE public.modelos DROP COLUMN IF EXISTS imagem_url;
ALTER TABLE public.modelos DROP COLUMN IF EXISTS categoria;

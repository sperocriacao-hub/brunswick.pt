-- -----------------------------------------------------------------------------
-- MIGRATION 0061: Add OP Tracking Metadata (RFID & Display Name)
-- -----------------------------------------------------------------------------

-- 1. Add new columns to ordens_producao
ALTER TABLE public.ordens_producao
ADD COLUMN IF NOT EXISTS rfid_token VARCHAR(255) NULL UNIQUE,
ADD COLUMN IF NOT EXISTS display_nome VARCHAR(255) NULL;

-- 2. Add documentation comments
COMMENT ON COLUMN public.ordens_producao.rfid_token IS 'Token Físico RFID atribuído à OP (ex: Cartão amarrado ao Manual do Barco) para tracking IoT.';
COMMENT ON COLUMN public.ordens_producao.display_nome IS 'Nome human-readable auto-gerado do Barco (Modelo + # + HIN) para Display em Tablets (ex: Brunswick 210 # 012).';

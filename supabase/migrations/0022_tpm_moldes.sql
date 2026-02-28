-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0022: TPM MOLDES (MANUTENÇÃO PREVENTIVA TOTAL)
-- ======================================================================================

ALTER TABLE public.moldes
  ADD COLUMN IF NOT EXISTS ultima_manutencao_at TIMESTAMPTZ DEFAULT NOW();

-- Criar a Função Validadora de Desgaste do Molde
CREATE OR REPLACE FUNCTION public.check_molde_tpm_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o desgaste atingiu ou passou do limite e o molde continua ativo, força manutenção.
    IF NEW.ciclos_estimados >= NEW.manutenir_em AND NEW.status = 'Ativo' THEN
        NEW.status := 'Em Manutenção';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Engatar o Trigger de Desgaste
DROP TRIGGER IF EXISTS trg_check_molde_tpm ON public.moldes;
CREATE TRIGGER trg_check_molde_tpm
BEFORE UPDATE ON public.moldes
FOR EACH ROW EXECUTE PROCEDURE public.check_molde_tpm_status();

NOTIFY pgrst, 'reload schema';

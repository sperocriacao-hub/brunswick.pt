-- Drop the broken triggers that lacked the column argument
DROP TRIGGER IF EXISTS handle_updated_at_hst_8d ON public.hst_8d;
DROP TRIGGER IF EXISTS handle_updated_at_hst_acoes ON public.hst_acoes;

-- Recreate triggers correctly with the 'updated_at' argument
CREATE TRIGGER handle_updated_at_hst_8d BEFORE UPDATE ON public.hst_8d FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
CREATE TRIGGER handle_updated_at_hst_acoes BEFORE UPDATE ON public.hst_acoes FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

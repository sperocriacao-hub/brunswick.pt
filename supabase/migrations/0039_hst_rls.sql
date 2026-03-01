-- Allow anonymous inserts and updates for the HST Dashboard
ALTER TABLE public.hst_ocorrencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.hst_ocorrencias;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.hst_ocorrencias;

CREATE POLICY "Enable insert for all users" ON public.hst_ocorrencias FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.hst_ocorrencias FOR UPDATE USING (true);

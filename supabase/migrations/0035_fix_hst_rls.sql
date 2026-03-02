-- Drop restrictive policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.hst_matriz_epis;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.hst_matriz_epis;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.hst_ocorrencias;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.hst_ocorrencias;

-- Recreate policies for full app access (Server Actions using Anon Key)
CREATE POLICY "Enable insert for all users" ON public.hst_matriz_epis FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.hst_matriz_epis FOR UPDATE USING (true);

CREATE POLICY "Enable insert for all users" ON public.hst_ocorrencias FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.hst_ocorrencias FOR UPDATE USING (true);

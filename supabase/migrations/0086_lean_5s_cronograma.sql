CREATE TABLE IF NOT EXISTS public.lean_5s_cronograma (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditor_id UUID REFERENCES public.operadores(id) ON DELETE CASCADE,
    area_id UUID REFERENCES public.areas_fabrica(id) ON DELETE CASCADE,
    linha_id UUID REFERENCES public.linhas_producao(id) ON DELETE CASCADE,
    estacao_id UUID REFERENCES public.estacoes(id) ON DELETE CASCADE,
    data_prevista DATE NOT NULL,
    data_realizada DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.lean_5s_cronograma ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.lean_5s_cronograma FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.lean_5s_cronograma FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.lean_5s_cronograma FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.lean_5s_cronograma FOR DELETE USING (true);

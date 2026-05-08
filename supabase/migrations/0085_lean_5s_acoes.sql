CREATE TABLE IF NOT EXISTS public.lean_5s_acoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao_acao TEXT NOT NULL,
    prioridade VARCHAR(50) DEFAULT 'Média',
    status VARCHAR(50) DEFAULT 'Aberto',
    area_id UUID REFERENCES public.areas_fabrica(id) ON DELETE SET NULL,
    linha_id UUID REFERENCES public.linhas_producao(id) ON DELETE SET NULL,
    estacao_id UUID REFERENCES public.estacoes(id) ON DELETE SET NULL,
    responsavel_id UUID REFERENCES public.operadores(id) ON DELETE SET NULL,
    data_limite TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.lean_5s_acoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.lean_5s_acoes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.lean_5s_acoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.lean_5s_acoes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.lean_5s_acoes FOR DELETE USING (true);

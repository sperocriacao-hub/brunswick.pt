CREATE TABLE IF NOT EXISTS public.avaliacoes_lideranca (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcionario_id UUID REFERENCES public.operadores(id),
    supervisor_nome TEXT NOT NULL,
    data_avaliacao DATE NOT NULL,
    nota_hst NUMERIC(3,1) NOT NULL,
    nota_epi NUMERIC(3,1) NOT NULL,
    nota_5s NUMERIC(3,1) NOT NULL,
    nota_eficiencia NUMERIC(3,1) NOT NULL,
    nota_objetivos NUMERIC(3,1) NOT NULL,
    nota_atitude NUMERIC(3,1) NOT NULL,
    nota_gestao_motivacao NUMERIC(3,1) NOT NULL,
    nota_desenvolvimento NUMERIC(3,1) NOT NULL,
    nota_desperdicios NUMERIC(3,1) NOT NULL,
    nota_qualidade NUMERIC(3,1) NOT NULL,
    nota_operacoes NUMERIC(3,1) NOT NULL,
    nota_melhoria NUMERIC(3,1) NOT NULL,
    nota_kpis NUMERIC(3,1) NOT NULL,
    nota_cultura NUMERIC(3,1) NOT NULL,
    justificativas TEXT,
    data_registo TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(funcionario_id, data_avaliacao)
);

-- Habilitar RLS e Politicas caso necessário (opcional se admin for o unico a escrever via service_role)
ALTER TABLE public.avaliacoes_lideranca ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all active users"
    ON public.avaliacoes_lideranca FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON public.avaliacoes_lideranca FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON public.avaliacoes_lideranca FOR UPDATE
    USING (true);

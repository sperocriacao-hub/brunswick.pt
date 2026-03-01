-- Migration 0027: Moldes Categorization & B.O.M Linkage

-- 2. Create the Pivot Table for Moldes <-> Opcionais (B.O.M)
CREATE TABLE IF NOT EXISTS public.moldes_opcionais (
    molde_id UUID NOT NULL REFERENCES public.moldes(id) ON DELETE CASCADE,
    opcional_id UUID NOT NULL REFERENCES public.opcionais(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (molde_id, opcional_id)
);

COMMENT ON TABLE public.moldes_opcionais IS 'Tabela Relacional que define os Moldes obrigatórios descerem ao Shopfloor caso a Engenharia adicione o Opcional Y a um Barco.';

-- RLS Policies para a Pivot Table
ALTER TABLE public.moldes_opcionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
    ON public.moldes_opcionais FOR SELECT
    USING (true);

CREATE POLICY "Enable write access for admins"
    ON public.moldes_opcionais FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.operadores
            WHERE id = auth.uid() AND nivel_permissao IN ('Planeador', 'Admin')
        )
    );

-- Migration 0076: Criar Tabela rh_ausencias para gestão de faltas e afastamentos

CREATE TABLE IF NOT EXISTS public.rh_ausencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operador_id UUID NOT NULL REFERENCES public.operadores(id) ON DELETE CASCADE,
    tipo_ausencia VARCHAR(50) NOT NULL CHECK (tipo_ausencia IN ('Baixa Médica', 'Férias', 'Falta Justificada', 'Falta Injustificada', 'Outro', 'Afastamento/Licença')),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    motivo_observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indices para facilitar cruzamento por data no Radar Shopfloor
CREATE INDEX IF NOT EXISTS rh_ausencias_operador_idx ON public.rh_ausencias (operador_id);
CREATE INDEX IF NOT EXISTS rh_ausencias_datas_idx ON public.rh_ausencias (data_inicio, data_fim);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_rh_ausencias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rh_ausencias_updated_at ON public.rh_ausencias;
CREATE TRIGGER trg_rh_ausencias_updated_at
BEFORE UPDATE ON public.rh_ausencias
FOR EACH ROW EXECUTE FUNCTION update_rh_ausencias_updated_at();

-- RLS
ALTER TABLE public.rh_ausencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL for authenticated users on rh_ausencias"
    ON public.rh_ausencias
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

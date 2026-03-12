-- MIGRATION: 0060_qcis_audits_table.sql
-- DESCRIPTION: Creates the analytics table for holding the daily SAP Quality Control Information System (QCIS) defect logs.

CREATE TABLE IF NOT EXISTS public.qcis_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fail_date DATE,
    boat_id TEXT,
    model_ref TEXT,
    peca TEXT,
    responsible_area TEXT,
    hull_number INTEGER,
    component_name TEXT,
    substation_name TEXT,
    defect_description TEXT,
    seccao TEXT,
    count_of_defects INTEGER,
    defect_comment TEXT,
    linha_linha TEXT,
    lista_categoria TEXT,
    lista_sub TEXT,
    lista_gate TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS e permitir Leitura Livre para dashboards e Insercao para a API (Service Role bypassa RLS anyway).
ALTER TABLE public.qcis_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View qcis analytics for authenticated users" 
ON public.qcis_audits FOR SELECT 
TO authenticated 
USING (true);

-- Indexing heavily used fields for the dashboard filters
CREATE INDEX IF NOT EXISTS idx_qcis_fail_date ON public.qcis_audits(fail_date);
CREATE INDEX IF NOT EXISTS idx_qcis_model_ref ON public.qcis_audits(model_ref);
CREATE INDEX IF NOT EXISTS idx_qcis_lista_categoria ON public.qcis_audits(lista_categoria);
CREATE INDEX IF NOT EXISTS idx_qcis_lista_gate ON public.qcis_audits(lista_gate);

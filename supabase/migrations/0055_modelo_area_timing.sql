-- Migração 0055: Regras de Sequenciamento Fabril (Planeamento)
-- Criação da tabela que liga uma Área a um Modelo para definir o seu SLA (Duração) e o seu Offset de planeamento (Dias Mestre).

CREATE TABLE public.modelo_area_timing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modelo_id UUID NOT NULL REFERENCES public.modelos(id) ON DELETE CASCADE,
    area_id UUID NOT NULL REFERENCES public.areas_fabrica(id) ON DELETE CASCADE,
    offset_dias INTEGER NOT NULL DEFAULT 0,
    duracao_dias INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Garante que um modelo só tem uma regra temporal por área, permitindo assim Upserts baseados em conflito
    UNIQUE(modelo_id, area_id)
);

-- Trigger auto-update timestamp
CREATE TRIGGER trg_modelo_area_timing_updated_at 
BEFORE UPDATE ON public.modelo_area_timing 
FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

-- RLS
ALTER TABLE public.modelo_area_timing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users REGRAS TIMING" ON public.modelo_area_timing FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users REGRAS TIMING" ON public.modelo_area_timing FOR ALL TO authenticated USING (true) WITH CHECK (true);

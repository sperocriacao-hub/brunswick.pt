-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0063: METAS DE HORAS/HOMEM (H/H) POR MODELO
-- ======================================================================================

-- Esta tabela mapeia o "Target H/H" (Horas-Homem planeadas) para a construção de um determinado Modelo
-- Naval, permitindo alocar essas horas de forma cirúrgica a um Escopo (Ex: Área inteira, Estação, ou cruzamento Área+Linha).

CREATE TABLE IF NOT EXISTS public.modelo_metas_hh (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modelo_id UUID NOT NULL REFERENCES public.modelos(id) ON DELETE CASCADE,
    
    -- O tipo de escopo ao qual esta meta H/H se aplica ('AREA', 'ESTACAO', 'AREA_LINHA')
    tipo_alvo VARCHAR(50) NOT NULL,
    
    -- Foreign Keys flexíveis baseadas no tipo de alvo
    area_id UUID REFERENCES public.areas_fabrica(id) ON DELETE CASCADE,
    linha_id UUID REFERENCES public.linhas_producao(id) ON DELETE CASCADE,
    estacao_id UUID REFERENCES public.estacoes(id) ON DELETE CASCADE,
    
    -- O valor numérico de Target H/H para concluir o barco neste escopo
    horas_homem NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Restrições de sanidade de dados
    CONSTRAINT chk_meta_hh_alvo_valido CHECK (
        (tipo_alvo = 'AREA' AND area_id IS NOT NULL AND linha_id IS NULL AND estacao_id IS NULL) OR
        (tipo_alvo = 'AREA_LINHA' AND area_id IS NOT NULL AND linha_id IS NOT NULL AND estacao_id IS NULL) OR
        (tipo_alvo = 'ESTACAO' AND estacao_id IS NOT NULL AND area_id IS NULL AND linha_id IS NULL)
    ),
    -- Bloquear duplicados do mesmo tipo de escopo exato para o mesmo modelo
    CONSTRAINT uq_modelo_metas_hh_escopo UNIQUE NULLS NOT DISTINCT (modelo_id, tipo_alvo, area_id, linha_id, estacao_id)
);

-- Trigger para auto-atualizar o updated_at
CREATE TRIGGER update_modelo_metas_hh_updated_at 
BEFORE UPDATE ON public.modelo_metas_hh 
FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

-- RLS
ALTER TABLE public.modelo_metas_hh ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura total das Metas HH Homem" 
ON public.modelo_metas_hh FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestão total das Metas HH Homem" 
ON public.modelo_metas_hh FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes para performance nos dashboards
CREATE INDEX IF NOT EXISTS idx_metas_hh_modelo ON public.modelo_metas_hh(modelo_id);
CREATE INDEX IF NOT EXISTS idx_metas_hh_area ON public.modelo_metas_hh(area_id);
CREATE INDEX IF NOT EXISTS idx_metas_hh_linha ON public.modelo_metas_hh(linha_id);
CREATE INDEX IF NOT EXISTS idx_metas_hh_estacao ON public.modelo_metas_hh(estacao_id);

COMMENT ON TABLE public.modelo_metas_hh IS 'Metas de Target de Horas/Homem (H/H) exigidas para concluir um Modelo num determinado módulo fabril, essencial para o cálculo de Eficiência.';

-- ======================================================================================
-- MIGRATION 0065: APS (Advanced Planning & Scheduling) - Gestão de Ordens de Produção
-- ======================================================================================
-- Propósito: Adicionar capacidades "NASA-Level" ao escalonamento de produção.
-- 1. Simulador de Cenários (What-If Scenarios)
-- 2. Enriquecimento da tabela `ordens_producao` (Hierarquia, Prioridade, Tracking EDT)
-- 3. Views Preditivas de Gargalos e Tempos Históricos
-- ======================================================================================

-- --------------------------------------------------------------------------------------
-- 1. Criação do Repositório de Cenários de Escalonamento (Simulador What-If)
-- --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.op_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_cenario VARCHAR(255) NOT NULL,
    descricao TEXT,
    is_active BOOLEAN DEFAULT false, -- Apenas um cenário ou nenhum deve estar ativo a definir a produção principal
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger auto update
DROP TRIGGER IF EXISTS update_op_scenarios_updated_at ON public.op_scenarios;
CREATE TRIGGER update_op_scenarios_updated_at 
BEFORE UPDATE ON public.op_scenarios 
FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

-- RLS
ALTER TABLE public.op_scenarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura_Scenarios" ON public.op_scenarios;
CREATE POLICY "Leitura_Scenarios" ON public.op_scenarios FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "CRUD_Scenarios" ON public.op_scenarios;
CREATE POLICY "CRUD_Scenarios" ON public.op_scenarios FOR ALL TO authenticated USING (true);

-- --------------------------------------------------------------------------------------
-- 2. Expansão de Ordens de Produção para APS Nível Superior
-- --------------------------------------------------------------------------------------
ALTER TABLE public.ordens_producao
    -- Capacidade Hierárquica: Uma Ordem Mestra pode ter Sub-Ordens (ex: OP Casco é sub da OP Barco Completo)
    ADD COLUMN IF NOT EXISTS parent_op_id UUID REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
    
    -- Prioridade Dinâmica do Algoritmo: (1: Máxima/Urgência, 3: Normal, 5: Baixa)
    ADD COLUMN IF NOT EXISTS prioridade INTEGER DEFAULT 3,
    
    -- Associação ao Simulador What-If (Se a OP existir apenas num cenário temporário, liga-se a este ID)
    ADD COLUMN IF NOT EXISTS scenario_id UUID REFERENCES public.op_scenarios(id) ON DELETE CASCADE,
    
    -- Estimated Delivery Time (Calculado ativamente pelo algoritmo com base em tempos históricos e offset)
    ADD COLUMN IF NOT EXISTS edt_estimado TIMESTAMPTZ,
    
    -- Correção de Segurança: Restaurar columns caso o admin não tenha corrido a migração 0008 de planeamento base
    ADD COLUMN IF NOT EXISTS data_prevista_inicio TIMESTAMPTZ,

    -- Tipo da OP ('Master' para o produto final, 'Sub-OP' para componentes dependentes)
    ADD COLUMN IF NOT EXISTS op_tipo VARCHAR(50) DEFAULT 'Master' CHECK (op_tipo IN ('Master', 'Sub-OP', 'Draft'));

-- --------------------------------------------------------------------------------------
-- 3. View Preditiva: Tempos de Ciclo Históricos (Real vs Estimado) Engine Machine Learning
-- --------------------------------------------------------------------------------------
-- Correção de Segurança: Restaurar timestamp_inicio caso tenha sido apagado acidentalmente no Supabase
ALTER TABLE public.registos_rfid_realtime ADD COLUMN IF NOT EXISTS timestamp_inicio TIMESTAMPTZ DEFAULT NOW();

-- Objetivo: Identificar Gargalos recolhendo o histórico real das tags RFID nas estações
CREATE OR REPLACE VIEW public.vw_aps_historico_tempos AS
SELECT 
    e.nome_estacao,
    m.nome_modelo,
    COUNT(r.id) AS amostras_coletadas,
    AVG(EXTRACT(EPOCH FROM (r.timestamp_fim - r.timestamp_inicio))/60)::NUMERIC(10,2) AS tempo_medio_real_minutos,
    MIN(EXTRACT(EPOCH FROM (r.timestamp_fim - r.timestamp_inicio))/60)::NUMERIC(10,2) AS melhor_tempo_minutos,
    MAX(EXTRACT(EPOCH FROM (r.timestamp_fim - r.timestamp_inicio))/60)::NUMERIC(10,2) AS pior_tempo_minutos,
    MAX(rp.tempo_ciclo) AS sla_teorico_cadastrado -- Considerando que o roteiro daquela estação pede X
FROM 
    public.registos_rfid_realtime r
JOIN 
    public.ordens_producao op ON r.op_id = op.id
JOIN 
    public.modelos m ON op.modelo_id = m.id
JOIN 
    public.estacoes e ON r.estacao_id = e.id
LEFT JOIN
    public.roteiros_producao rp ON rp.modelo_id = m.id AND rp.estacao_id = e.id
WHERE 
    r.timestamp_fim IS NOT NULL
GROUP BY 
    e.nome_estacao, m.nome_modelo;

-- ======================================================================================
-- FIM DA MIGRAÇÃO 0065
-- ======================================================================================

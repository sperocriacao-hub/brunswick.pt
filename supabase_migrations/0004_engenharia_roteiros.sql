-- =========================================================================================
-- MIGRATION 0004: ENGENHARIA E ROTEIROS DE FABRICO
-- =========================================================================================
-- Propósito: Criar infraestrutura de dados para:
-- 1. Regras de Sequenciamento (Offset e Duração por Modelo/Área)
-- 2. Roteiro Passo a Passo (Peça, Estação Destino, SLA Específico, Sequência Numérica)
-- 3. View Materializada (Consulta rápida para ESP32: O barco 'X' deveria estar aqui agora?)
-- =========================================================================================

-- 1. Regras de Sequenciamento (Offset e Duração por Área)
CREATE TABLE public.modelo_area_timing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modelo_id UUID NOT NULL REFERENCES public.modelos(id) ON DELETE CASCADE,
    area_id UUID NOT NULL REFERENCES public.areas_fabrica(id) ON DELETE CASCADE,
    offset_dias INTEGER NOT NULL DEFAULT 0, -- Dias ANTES do "Dia Zero" em que esta área deve começar (ex: -5 dias)
    duracao_dias INTEGER NOT NULL DEFAULT 1, -- Quantos dias a área tem para concluir o trabalho do barco
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(modelo_id, area_id) -- Não pode haver mais do que uma regra da mesma área para o mesmo barco
);

ALTER TABLE public.modelo_area_timing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users - modelo_area_timing" ON public.modelo_area_timing FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users - modelo_area_timing" ON public.modelo_area_timing FOR ALL USING (auth.role() = 'authenticated');

-- 2. Cadastro do Roteiro Detalhado (O fluxo exato de montagem)
CREATE TABLE public.roteiros_sequencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modelo_id UUID NOT NULL REFERENCES public.modelos(id) ON DELETE CASCADE,
    
    -- Sequência Numérica exata: Ex: Passo 10 -> Passo 20 -> Passo 30
    sequencia_num INTEGER NOT NULL,
    
    -- Ligação à Peça específica cadastrada na BOM (Composição do Modelo)
    parte_id UUID NOT NULL REFERENCES public.modelo_partes(id) ON DELETE CASCADE,
    
    -- Estação física de destino onde esse passo será executado
    estacao_destino_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE RESTRICT,
    
    -- Tempo de Ciclo *ESPECÍFICO* para esta peça nesta estação (pode sobrepor o SLA base da Estação)
    tempo_ciclo_especifico NUMERIC NOT NULL DEFAULT 60.0,
    
    -- Instruções técnicas exclusivas para esse passo
    instrucoes_tecnicas TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(modelo_id, sequencia_num) -- Garantir que num dado barco, dois passos não têm rigorosamente o mesmo número sem querer
);

ALTER TABLE public.roteiros_sequencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users - roteiros_sequencia" ON public.roteiros_sequencia FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users - roteiros_sequencia" ON public.roteiros_sequencia FOR ALL USING (auth.role() = 'authenticated');

-- =========================================================================================
-- 3. INTEGRAÇÃO ESP32: A VIEW DE CONSULTA (Super Rápida)
-- Objetivo: O ESP32 envia "Tag RFID do Barco X" e "Sou a Estação Y". Eu respondo de imediato
-- se ele está no sítio certo e qual o passo / SLA atual.
-- =========================================================================================
-- Para que o sistema saiba "Qual é a Sequência do Dia", precisamos cruzar:
-- A Ordem de Produção (para saber qual o Barco/Tag), o Modelo do Barco, e o Roteiro.

CREATE OR REPLACE VIEW public.vw_esp32_query_fast AS
SELECT 
    op.numero_ordem,
    op.tag_rfid_ordem AS tag_barco,          -- O que o ESP lê no chassi
    rs.estacao_destino_id AS estacao_id,     -- Onde ele deveria estar
    e.nome_estacao,
    e.tag_rfid_estacao AS mac_estacao,       -- MAC/Tag física do Painel ESP32 fixo na parede
    rs.sequencia_num AS passo_atual,
    partes.nome_parte AS peca_a_processar,
    rs.tempo_ciclo_especifico AS sla_minutos_esperado,
    mat.offset_dias,                         -- Informação tática de avatares
    mat.duracao_dias
FROM 
    public.ordens_producao op
JOIN 
    public.modelos m ON op.modelo_id = m.id
JOIN 
    public.roteiros_sequencia rs ON rs.modelo_id = m.id
JOIN 
    public.modelo_partes partes ON rs.parte_id = partes.id
JOIN 
    public.estacoes e ON rs.estacao_destino_id = e.id
LEFT JOIN 
    public.modelo_area_timing mat ON mat.modelo_id = m.id AND mat.area_id = e.area_id
WHERE 
    op.status = 'Em Produção'; 
    -- Numa versão V2 avançada, podíamos filtrar aqui unicamente "A sequence ativa atual", 
    -- usando outra tabela que guarde "Último passo concluído" + 1. 

-- Nota ao utilizador/Edge: A View acima devolve uma matriz pre-calculada. O Backend Next.js (Edge/Supabase API)
-- apenas tem que fazer: SELECT * FROM vw_esp32_query_fast WHERE tag_barco = 'XYZ123' AND mac_estacao = 'ESP_MAC_99'
-- Se retornar 0 rows: "Barco errado nesta estação!". Se retornar 1 row: "Barco Certo! Ativar Painel."

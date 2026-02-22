-- ======================================================================================
-- MIGRATION 0010: OEE HUMANA (Track de Pausas e Desperdícios)
-- ======================================================================================
-- Descrição: 
-- Permite ao M.E.S. Hub e à Dashboard analisar as micro-ausências e as suas causas.
-- Ajudando ao cálculo direto de NVA (Non-Value Added Time).

-- --------------------------------------------------------------------------------------
-- 1. Registo de Pausas / Ausências do Posto (Fase 20)
-- --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.log_pausas_operador (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operador_rfid VARCHAR(255) NOT NULL REFERENCES public.operadores(tag_rfid_operador) ON DELETE CASCADE,
    estacao_id UUID REFERENCES public.estacoes(id) ON DELETE CASCADE,
    motivo VARCHAR(50) NOT NULL CHECK (motivo IN ('WC', 'FORMACAO', 'MEDICO', 'REUNIAO', 'FALTA_MATERIAL', 'OUTRO')),
    timestamp_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    timestamp_fim TIMESTAMPTZ, -- Fica nulo até ele fechar ou picar noutra OP
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS & Políticas
ALTER TABLE public.log_pausas_operador ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir Leitura de Pausas" ON public.log_pausas_operador FOR SELECT TO authenticated USING (true);
CREATE POLICY "CRUD Geral de Pausas" ON public.log_pausas_operador FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Permissão REST para o Hardware (Anon / ESP32)
CREATE POLICY "ESP32 pode inserir Pausa" ON public.log_pausas_operador FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "ESP32 pode atualizar o fim de Pausa" ON public.log_pausas_operador FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- API M.E.S tratará na serverless action de garantir que apenas uma Pausa
-- Morte pode existir para um utilizador de forma síncrona, usando `is('timestamp_fim', null)`.

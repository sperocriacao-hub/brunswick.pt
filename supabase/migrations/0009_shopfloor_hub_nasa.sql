-- ======================================================================================
-- MIGRATION 0009: HUB NASA (IoT Advanced Workflow)
-- ======================================================================================
-- Descrição: 
-- Adiciona a infraestrutura para usar o ESP32 como relógio de ponto (Assiduidade Diária)
-- e como validador Macro de Fecho de Estação (Sinalizando o fim do Barco no posto).

-- --------------------------------------------------------------------------------------
-- 1. Registo de Ponto Diário (Assiduidade RH)
-- --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.log_ponto_diario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operador_rfid VARCHAR(255) NOT NULL REFERENCES public.operadores(tag_rfid_operador) ON DELETE CASCADE,
    estacao_id UUID REFERENCES public.estacoes(id) ON DELETE SET NULL, -- Onde ele picou o ponto
    tipo_registo VARCHAR(50) NOT NULL CHECK (tipo_registo IN ('ENTRADA', 'SAIDA')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS & Políticas para Ponto Diário
ALTER TABLE public.log_ponto_diario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir Leitura do Ponto" ON public.log_ponto_diario FOR SELECT TO authenticated USING (true);
CREATE POLICY "CRUD Geral do Ponto Diário" ON public.log_ponto_diario FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Permite ESP32 (Anon) ou API Key pública inserir pontos da fábrica
CREATE POLICY "ESP32 pode inserir Ponto Diário" ON public.log_ponto_diario FOR INSERT TO anon WITH CHECK (true);

-- --------------------------------------------------------------------------------------
-- 2. Conclusão Macro de Estação (OEE e Pull-System)
-- --------------------------------------------------------------------------------------
-- Sempre que um Team Leader prime Confirmação "Seta Cima" no hardware para dar o barco
-- como finalizado na sua estação.
CREATE TABLE IF NOT EXISTS public.log_estacao_conclusao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    op_id UUID NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
    estacao_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE CASCADE,
    operador_rfid VARCHAR(255) NOT NULL REFERENCES public.operadores(tag_rfid_operador) ON DELETE RESTRICT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(op_id, estacao_id) -- Garantir que uma OP só é concluída 1 vez por Estação
);

-- RLS & Políticas para Conclusão
ALTER TABLE public.log_estacao_conclusao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir Leitura de Conclusoes" ON public.log_estacao_conclusao FOR SELECT TO authenticated USING (true);
CREATE POLICY "CRUD Geral de Conclusoes" ON public.log_estacao_conclusao FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ESP32 pode inserir Conclusoes Macros" ON public.log_estacao_conclusao FOR INSERT TO anon WITH CHECK (true);

-- Opcional (Dependendo de como o frontend interpelar o Backend):
-- Trigger function to maybe auto-update OP status if needed, mas será deixado para
-- as Server Actions do Next.js gerirem o workflow de avanço no Grafo para manter as rules no código.

-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0017: RASTREABILIDADE DE B.O.M. & LOTE
-- Cria a fundação da genealogia fabril permitindo associar peças específicas e
-- números de série/lotes à Ordem de Produção (Barco) em tempo real.
-- ======================================================================================

CREATE TABLE public.rastreabilidade_pecas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    op_id UUID NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
    estacao_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE CASCADE,
    operador_rfid VARCHAR(50) NOT NULL, -- Quem fez a leitura
    
    -- Dados da Matéria Prima
    nome_peca VARCHAR(255) NOT NULL,
    numero_serie_lote VARCHAR(255) NOT NULL,
    fornecedor VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de Estrela para Queries de Relatórios Rápidos (Genealogia)
CREATE INDEX idx_rastrear_op ON public.rastreabilidade_pecas(op_id);
CREATE INDEX idx_rastrear_lote ON public.rastreabilidade_pecas(numero_serie_lote);

-- Politicas RLS (Segurança de Chão de Fábrica)
ALTER TABLE public.rastreabilidade_pecas ENABLE ROW LEVEL SECURITY;

-- Kiosk/Tablets precisam fazer insert dos scans RFID de material
CREATE POLICY "Permitir Insert de Peças Kiosk Anon" 
    ON public.rastreabilidade_pecas 
    FOR INSERT 
    TO anon 
    WITH CHECK (true);

-- Admin Global pode ler os relatórios
CREATE POLICY "Permitir Select Peças" 
    ON public.rastreabilidade_pecas 
    FOR SELECT 
    USING (true);

-- Notificar o DB Realtime se existirem dashboards à escuta
ALTER PUBLICATION supabase_realtime ADD TABLE public.rastreabilidade_pecas;

-- Função utilitária de Timestamp (Caso não exista na BD)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger Atualização de Updated_at
CREATE TRIGGER trg_rastrear_update
BEFORE UPDATE ON public.rastreabilidade_pecas
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

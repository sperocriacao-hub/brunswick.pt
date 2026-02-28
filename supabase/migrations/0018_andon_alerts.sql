-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0018: ALERTAS ANDON (TV DASHBOARD)
-- Tabela para gerir chamadas de emergência (cordão Andon) dos tablets dos operadores,
-- acionando o piscar vermelho nas televisões da linha.
-- ======================================================================================

CREATE TABLE public.alertas_andon (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estacao_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE CASCADE,
    op_id UUID REFERENCES public.ordens_producao(id) ON DELETE CASCADE, -- opcional caso o tablet não tenha barco ativo
    operador_rfid VARCHAR(50) NOT NULL,
    situacao VARCHAR(255) DEFAULT 'AJUDA_REQUERIDA',
    resolvido BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices Rápidos
CREATE INDEX idx_andon_estacao ON public.alertas_andon(estacao_id);
CREATE INDEX idx_andon_resolvido ON public.alertas_andon(resolvido);

-- RLS (Segurança de Chão de Fábrica)
ALTER TABLE public.alertas_andon ENABLE ROW LEVEL SECURITY;

-- Kiosk/Tablets precisam submeter o alarme (INSERT)
CREATE POLICY "Permitir Insert Andon Kiosk" 
    ON public.alertas_andon 
    FOR INSERT 
    TO anon 
    WITH CHECK (true);

-- TV / Kiosk / Admin precisam Ler o Alarme (SELECT)
CREATE POLICY "Permitir Select Andon Geral" 
    ON public.alertas_andon 
    FOR SELECT 
    USING (true);

-- Admin precisa resolver o Alarme (UPDATE)
CREATE POLICY "Permitir Update Andon Admin" 
    ON public.alertas_andon 
    FOR UPDATE
    USING (true);

-- PUBLICAR PARA O REALTIME WEBSOCKETS (PARA A TV PISCAR IMEDIATAMENTE)
ALTER PUBLICATION supabase_realtime ADD TABLE public.alertas_andon;

-- Função utilitária de Timestamp (Garante Updates corretos)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_andon_update
BEFORE UPDATE ON public.alertas_andon
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

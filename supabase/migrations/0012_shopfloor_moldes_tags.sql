-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0012: TRACKING DE PEÇAS IoT E GESTÃO DE MOLDES
-- ======================================================================================

-- 1. Criação do Repositório Físico de Moldes
CREATE TABLE public.moldes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_parte VARCHAR(255) NOT NULL,     -- Ex: 'Casco Inferior VIP', 'Coberta', etc.
    rfid VARCHAR(255) UNIQUE,             -- Tag RFID física cravada diretamente na carcaça do Molde
    ciclos_estimados INTEGER DEFAULT 0,   -- Iterador de laminações efetuadas para cálculo de desgaste
    manutenir_em INTEGER DEFAULT 300,     -- Limite threshold (vida útil) antes do re-alisamento / gelcoat
    status VARCHAR(50) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Em Manutenção', 'Retirado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger auto update
CREATE TRIGGER update_moldes_updated_at 
BEFORE UPDATE ON public.moldes 
FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

-- RLS
ALTER TABLE public.moldes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura_Moldes" ON public.moldes FOR SELECT TO authenticated USING (true);
CREATE POLICY "CRUD_Moldes" ON public.moldes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Expandir Ordens de Produção (Integração Plural RFID e Tracking de Moldes)
ALTER TABLE public.ordens_producao
    -- Identificadores Únicos das Tags NFC/RFID laminadas em cada parte do barco:
    ADD COLUMN IF NOT EXISTS rfid_casco VARCHAR(255) UNIQUE,
    ADD COLUMN IF NOT EXISTS rfid_coberta VARCHAR(255) UNIQUE,
    ADD COLUMN IF NOT EXISTS rfid_small_parts VARCHAR(255) UNIQUE,
    ADD COLUMN IF NOT EXISTS rfid_liner VARCHAR(255) UNIQUE,
    
    -- Atribuição do Molde utilizado para forjar especificamente este Número de Série (SLA/Audit):
    ADD COLUMN IF NOT EXISTS molde_casco_id UUID REFERENCES public.moldes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS molde_coberta_id UUID REFERENCES public.moldes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS molde_small_parts_id UUID REFERENCES public.moldes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS molde_liner_id UUID REFERENCES public.moldes(id) ON DELETE SET NULL;

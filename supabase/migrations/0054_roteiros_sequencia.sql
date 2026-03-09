-- Migração 0054: Roteiros Sequência (Ordem de Operações B.O.M)
-- Criação da tabela que liga o Modelo de Barco, as suas Peças, e a Estação de Destino formando a Árvore de Roteiro (Routing).

CREATE TABLE public.roteiros_sequencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modelo_id UUID NOT NULL REFERENCES public.modelos(id) ON DELETE CASCADE,
    composicao_molde_id UUID NOT NULL REFERENCES public.composicao_modelo(id) ON DELETE CASCADE, -- A peça exata
    estacao_destino_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE RESTRICT,
    sequencia_num INTEGER NOT NULL DEFAULT 10,
    tempo_ciclo_especifico NUMERIC(10,2) NOT NULL DEFAULT 60.0, -- SLA em minutos daquela peça naquela estação
    instrucoes_tecnicas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Garante que num determinado Modelo, não há peças na mesma estação na mesma sequencia sem intenção.
    UNIQUE(modelo_id, sequencia_num)
);

-- Trigger auto-update timestamp
CREATE TRIGGER trg_roteiros_sequencia_updated_at 
BEFORE UPDATE ON public.roteiros_sequencia 
FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

-- RLS
ALTER TABLE public.roteiros_sequencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users ROTEIRO" ON public.roteiros_sequencia FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users ROTEIRO" ON public.roteiros_sequencia FOR ALL TO authenticated USING (true) WITH CHECK (true);

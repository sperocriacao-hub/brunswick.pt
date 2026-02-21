-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0002: ESTRUTURA DE FÁBRICA
-- ======================================================================================

-- 1. ADICIONAR COLUNAS DE ESTRUTURA E CAPACIDADE ÀS ESTAÇÕES EXISTENTES
-- Como a tabela estacoes (criada na migration 0) apenas tinha 'id' e 'nome', 
-- vamos adicionar os parâmetros industriais.
ALTER TABLE public.estacoes
    ADD COLUMN tag_rfid_estacao VARCHAR(255) UNIQUE,
    ADD COLUMN area_grupo VARCHAR(100), -- Ex: Laminação, Montagem, Acabamento
    ADD COLUMN sub_area VARCHAR(100),   -- Ex: Casco Pequeno, Casco Grande
    ADD COLUMN tempo_ciclo_padrao INTEGER DEFAULT 0, -- Em Minutos
    ADD COLUMN status VARCHAR(50) DEFAULT 'Disponível' CHECK (status IN ('Disponível', 'Em Manutenção', 'Inativa')),
    ADD COLUMN capacidade_producao INTEGER DEFAULT 1, -- Quantos barcos/peças por dia
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Criar trigger para auto-atualizar o updated_at das estacoes
CREATE TRIGGER update_estacoes_updated_at BEFORE UPDATE ON public.estacoes FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

-- 2. CRIAR A TABELA PONTE PARA A ÁRVORE DE DEPENDÊNCIAS (GRAFOS)
-- Grafo Dirigido: Define quem vem antes e quem vem depois, permitindo desenhar
-- rotas complexas.
CREATE TABLE public.estacoes_sequencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estacao_predecessora_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE CASCADE,
    estacao_sucessora_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE CASCADE,
    tipo_conector VARCHAR(50) DEFAULT 'STANDARD' CHECK (tipo_conector IN ('STANDARD', 'ALTERNATIVA', 'OBRIGATÓRIA_SIMULTANEA')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(estacao_predecessora_id, estacao_sucessora_id),
    CHECK (estacao_predecessora_id != estacao_sucessora_id) -- Uma estação não pode suceder-se a si própria
);

-- 3. ENABLE ROW LEVEL SECURITY PARA A NOVA TABELA
ALTER TABLE public.estacoes_sequencia ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES PARA A NOVA TABELA PONTE
CREATE POLICY "Permitir Leitura de Sequencia Autenticados" ON public.estacoes_sequencia FOR SELECT TO authenticated USING (true);
CREATE POLICY "CRUD Total Autenticados Sequencia" ON public.estacoes_sequencia FOR ALL TO authenticated USING (true) WITH CHECK (true);

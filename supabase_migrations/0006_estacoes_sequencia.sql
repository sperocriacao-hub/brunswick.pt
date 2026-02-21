-- Migração 0006: Matriz de Dependência de Estações Fabris (Grafos)
-- Finalidade: Permitir definir que a Estação B depende da Conclusão do SLA da Estação A
-- Fundamental para modelação em rede e deteção de gargalos inter-departamentais (Ex: Carpintaria atrasa Linha A)

-- Tabela Trellis (N:M)
CREATE TABLE IF NOT EXISTS public.estacoes_sequencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    predecessora_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE CASCADE, -- Origem do cabo
    sucessora_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE CASCADE,   -- Destino do cabo
    tipo_conducao VARCHAR(50) DEFAULT 'STANDARD', -- Ex: Opcionalmente "FÍSICO", "LÓGICO", "INSPEÇÃO"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(predecessora_id, sucessora_id) -- Impede que liguem a Estação A à B duas vezes
);

-- Garantir que não existem referências circulares imediatas a nível BD (A aponta A)
ALTER TABLE public.estacoes_sequencia ADD CONSTRAINT chk_circular_imediata CHECK (predecessora_id != sucessora_id);

-- Índices de navegação de grafo (para ser super rápido dizer "Quais são os filhos do nó X")
CREATE INDEX IF NOT EXISTS idx_grafo_sucessores ON public.estacoes_sequencia(predecessora_id);
CREATE INDEX IF NOT EXISTS idx_grafo_predecessores ON public.estacoes_sequencia(sucessora_id);

-- Row Level Security
ALTER TABLE public.estacoes_sequencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso de Leitura livre a autenticados (Grafo)" 
ON public.estacoes_sequencia FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Acesso Total Administrativo (Grafo)" 
ON public.estacoes_sequencia FOR ALL 
TO authenticated 
USING (true); -- Segurança tratada ao nível do Middleware Next.js e claims JWT

-- View Materializada Utilitária: "Grafo Extendido"
-- Objetivo: Alimentar rapidamente o front-end React Flow (Trazendo Label XYZ em vez de apenas UUIDs)
CREATE OR REPLACE VIEW vw_grafo_estacoes_labels AS
SELECT 
    es.id as link_id,
    es.predecessora_id as source_id,
    e1.nome_estacao as source_label,
    es.sucessora_id as target_id,
    e2.nome_estacao as target_label
FROM 
    public.estacoes_sequencia es
JOIN 
    public.estacoes e1 ON e1.id = es.predecessora_id
JOIN 
    public.estacoes e2 ON e2.id = es.sucessora_id;

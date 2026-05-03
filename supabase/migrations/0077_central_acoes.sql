-- Migration 0077: Central de Ações (Smart Action Hub)

-- 1. Nova Tabela de Ações Globais (Origens Avulsas / IA)
CREATE TABLE IF NOT EXISTS public.central_acoes_globais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100) NOT NULL CHECK (categoria IN ('Eficiencia', 'Entregas', 'Scraps', 'Andons', 'Gargalos', 'Consumiveis', 'Material Variance', 'Produtividade', 'Formacoes', 'Outro')),
    responsavel_nome VARCHAR(255),
    
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    data_limite TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(50) NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Em Investigacao', 'Validacao', 'Concluido')),
    
    origem_ia BOOLEAN DEFAULT FALSE, -- Flag para saber se foi gerada pela Inteligência Artificial
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_central_acoes_globais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_central_acoes_globais_updated_at ON public.central_acoes_globais;
CREATE TRIGGER trg_central_acoes_globais_updated_at
BEFORE UPDATE ON public.central_acoes_globais
FOR EACH ROW EXECUTE FUNCTION update_central_acoes_globais_updated_at();

-- RLS
ALTER TABLE public.central_acoes_globais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL for authenticated users on central_acoes_globais" ON public.central_acoes_globais FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. VIEW UNIFICADA (Torre de Controlo / Dashboard)
-- Juntamos Ações do Lean, HST e as Novas Globais
DROP VIEW IF EXISTS public.view_master_acoes;
CREATE VIEW public.view_master_acoes AS
SELECT 
    id,
    titulo,
    descricao,
    'Lean/Kaizen' AS modulo_origem,
    origem_tipo AS categoria,
    responsavel_nome,
    status,
    created_at,
    data_limite,
    data_conclusao
FROM public.lean_acoes

UNION ALL

SELECT 
    id,
    'Ação Preventiva/Corretiva'::VARCHAR(255) AS titulo,
    descricao_acao AS descricao,
    'HST' AS modulo_origem,
    'Ocorrencia/8D' AS categoria,
    NULL::VARCHAR(255) AS responsavel_nome,
    status,
    created_at,
    data_prevista::TIMESTAMP WITH TIME ZONE AS data_limite,
    data_conclusao::TIMESTAMP WITH TIME ZONE AS data_conclusao
FROM public.hst_acoes

UNION ALL

SELECT 
    id,
    titulo,
    descricao,
    'Geral' AS modulo_origem,
    categoria,
    responsavel_nome,
    status,
    created_at,
    data_limite,
    data_conclusao
FROM public.central_acoes_globais;

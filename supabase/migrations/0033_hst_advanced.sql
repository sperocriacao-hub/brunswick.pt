-- Migration 0033: Advanced Health and Safety (HST 8D & Actions)
CREATE EXTENSION IF NOT EXISTS moddatetime schema extensions;

-- 1. Tabela: Investigação 8D para Acidentes de Trabalho
CREATE TABLE IF NOT EXISTS public.hst_8d (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ocorrencia_id UUID REFERENCES public.hst_ocorrencias(id) ON DELETE CASCADE,
    
    d1_equipa TEXT,                           -- D1: Formar Equipa
    d2_descricao_problema TEXT,               -- D2: Descrever o Problema
    d3_acao_contencao TEXT,                   -- D3: Ações de Contenção Imediata
    d4_causa_raiz TEXT,                       -- D4: Analisar Causa Raiz
    d5_acao_corretiva TEXT,                   -- D5: Desenvolver Ações Corretivas
    d6_implementacao TEXT,                    -- D6: Implementar Ações Corretivas
    d7_prevencao TEXT,                        -- D7: Prevenir Recorrência
    d8_reconhecimento TEXT,                   -- D8: Reconhecer a Equipa
    
    status VARCHAR(50) NOT NULL DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Em Investigacao', 'Concluido')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(ocorrencia_id) -- Apenas um Relatório 8D por Acidente
);

-- 2. Tabela: Ações Corretivas/Preventivas HST (Kanban)
CREATE TABLE IF NOT EXISTS public.hst_acoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ocorrencia_id UUID REFERENCES public.hst_ocorrencias(id) ON DELETE CASCADE,
    relatorio_8d_id UUID REFERENCES public.hst_8d(id) ON DELETE CASCADE,
    
    descricao_acao TEXT NOT NULL,
    responsavel_id UUID REFERENCES public.operadores(id) ON DELETE SET NULL,
    
    data_prevista DATE,
    data_conclusao DATE,
    
    prioridade VARCHAR(50) NOT NULL DEFAULT 'Media' CHECK (prioridade IN ('Baixa', 'Media', 'Alta', 'Critica')),
    status VARCHAR(50) NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Blocked', 'Done')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at_hst_8d BEFORE UPDATE ON public.hst_8d FOR EACH ROW EXECUTE PROCEDURE moddatetime();
CREATE TRIGGER handle_updated_at_hst_acoes BEFORE UPDATE ON public.hst_acoes FOR EACH ROW EXECUTE PROCEDURE moddatetime();

-- RLS Policies
ALTER TABLE public.hst_8d ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hst_acoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.hst_8d FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.hst_8d FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.hst_8d FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.hst_acoes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.hst_acoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.hst_acoes FOR UPDATE USING (true);

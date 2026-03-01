-- Migration 0031: Lean Management (Kaizen, Gemba Walks & Kanban Ações)
CREATE EXTENSION IF NOT EXISTS moddatetime schema extensions;
-- 1. Tabela: Ideias Kaizen
CREATE TABLE IF NOT EXISTS public.lean_kaizen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    colaborador_id UUID REFERENCES public.operadores(id) ON DELETE SET NULL,
    area_id UUID REFERENCES public.areas_fabrica(id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao_atual TEXT NOT NULL,
    proposta_melhoria TEXT NOT NULL,
    beneficios_esperados TEXT NOT NULL,
    categoria VARCHAR(100) NOT NULL CHECK (categoria IN ('Qualidade', 'Seguranca', 'Produtividade', 'Ergonomia', 'Custo')),
    
    -- Avaliação do Comitê
    esforco_estimado INTEGER CHECK (esforco_estimado BETWEEN 1 AND 10),
    impacto_estimado INTEGER CHECK (impacto_estimado BETWEEN 1 AND 10),
    avaliado_por VARCHAR(255),
    data_avaliacao TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(50) NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Analise', 'Aceite', 'Rejeitada', 'Implementada')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela: Auditorias de Liderança (Gemba Walks)
CREATE TABLE IF NOT EXISTS public.lean_gemba_walks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipa_auditora TEXT NOT NULL, -- Nomes dos Diretores/Líderes
    area_auditada_id UUID REFERENCES public.areas_fabrica(id) ON DELETE SET NULL,
    observacoes TEXT NOT NULL,
    oportunidades_melhoria TEXT,
    data_ronda TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela: Ações Lean (Scrum / Kanban Global)
-- Consolida Ações de Kaizen, Gemba, RNCs, etc.
CREATE TABLE IF NOT EXISTS public.lean_acoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    
    -- Referência (De onde veio a Ação?)
    origem_tipo VARCHAR(100) CHECK (origem_tipo IN ('Kaizen', 'Gemba Walk', 'RNC/8D', 'RNC/A3', 'Reuniao Diaria', 'Auditoria')),
    origem_id UUID, -- Pode apontar para o ID do Kaizen, do Gemba Walk, etc.
    
    area_id UUID REFERENCES public.areas_fabrica(id) ON DELETE SET NULL,
    responsavel_nome VARCHAR(255),
    
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    data_limite TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(50) NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Blocked', 'Done')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at_kaizen BEFORE UPDATE ON public.lean_kaizen FOR EACH ROW EXECUTE PROCEDURE moddatetime();
CREATE TRIGGER handle_updated_at_acoes BEFORE UPDATE ON public.lean_acoes FOR EACH ROW EXECUTE PROCEDURE moddatetime();

-- RLS Policies
ALTER TABLE public.lean_kaizen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lean_gemba_walks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lean_acoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.lean_kaizen FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.lean_kaizen FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.lean_kaizen FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.lean_gemba_walks FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.lean_gemba_walks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.lean_gemba_walks FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.lean_acoes FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.lean_acoes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.lean_acoes FOR UPDATE USING (auth.role() = 'authenticated');

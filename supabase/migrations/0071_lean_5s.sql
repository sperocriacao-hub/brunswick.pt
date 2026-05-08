-- ==========================================
-- MÓDULO LEAN: 5S FABRIL (Auditorias Dinâmicas)
-- ==========================================

-- 1. Tabela de Banco de Perguntas (Checklists)
CREATE TABLE public.lean_5s_perguntas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID REFERENCES public.areas_fabrica(id) ON DELETE CASCADE, -- Se for NULL, aplica-se a todas as áreas
    categoria TEXT NOT NULL CHECK (categoria IN ('1S - Utilização', '2S - Arrumação', '3S - Limpeza', '4S - Normalização', '5S - Disciplina')),
    pergunta TEXT NOT NULL,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela Mestra de Auditorias 5S
CREATE TABLE public.lean_5s_auditorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditor_id UUID REFERENCES public.operadores(id) ON DELETE SET NULL, -- Quem audita
    area_id UUID REFERENCES public.areas_fabrica(id) ON DELETE CASCADE NOT NULL, -- Área auditada
    estacao_id UUID REFERENCES public.estacoes(id) ON DELETE CASCADE, -- (Opcional) Estação específica auditada
    data_auditoria TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    pontuacao_obtida NUMERIC(5,2) DEFAULT 0,
    pontuacao_maxima NUMERIC(5,2) DEFAULT 0,
    percentagem NUMERIC(5,2) DEFAULT 0,
    status TEXT DEFAULT 'Concluída',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Respostas Individuais
CREATE TABLE public.lean_5s_respostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditoria_id UUID REFERENCES public.lean_5s_auditorias(id) ON DELETE CASCADE NOT NULL,
    pergunta_id UUID REFERENCES public.lean_5s_perguntas(id) ON DELETE CASCADE NOT NULL,
    resultado TEXT NOT NULL CHECK (resultado IN ('Pass', 'Fail', 'N/A')),
    observacoes TEXT,
    foto_url TEXT,
    acao_gerada_id UUID, -- Liga à ação criada no Smart Action Hub se houver Não Conformidade
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- RLS (Row Level Security) - Políticas
-- ==========================================
ALTER TABLE public.lean_5s_perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lean_5s_auditorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lean_5s_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura a todos" ON public.lean_5s_perguntas FOR SELECT USING (true);
CREATE POLICY "Permitir leitura a todos" ON public.lean_5s_auditorias FOR SELECT USING (true);
CREATE POLICY "Permitir leitura a todos" ON public.lean_5s_respostas FOR SELECT USING (true);

CREATE POLICY "Permitir escrita a todos (Admin)" ON public.lean_5s_perguntas FOR ALL USING (true);
CREATE POLICY "Permitir escrita a todos (Admin)" ON public.lean_5s_auditorias FOR ALL USING (true);
CREATE POLICY "Permitir escrita a todos (Admin)" ON public.lean_5s_respostas FOR ALL USING (true);

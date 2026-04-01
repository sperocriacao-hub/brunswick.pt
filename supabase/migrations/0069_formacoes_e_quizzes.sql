-- Migração 0069: Academia Fabril (Módulo de Formações e Feedback do Clima / Kiosk 2.0)

-- --------------------------------------------------------------------------------------
-- 1. TABELAS: Feedback do Clima e Satisfação Pessoal (Anónimo)
-- --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_satisfacao_perguntas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    texto_pergunta TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL DEFAULT 'Geral',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_satisfacao_respostas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pergunta_id UUID NOT NULL REFERENCES public.quiz_satisfacao_perguntas(id) ON DELETE CASCADE,
    nota NUMERIC(3,1) NOT NULL CHECK (nota >= 0 AND nota <= 4), 
    area_id UUID REFERENCES public.areas_fabrica(id) ON DELETE SET NULL, -- Rastilho local de onde veio a indignação/alegria, mas sem ID de utente para o manter anónimo
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- --------------------------------------------------------------------------------------
-- 2. TABELAS: Plano de Formação Fabril (O 'Smart ILUO' Planner)
-- --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rh_planos_formacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formando_id UUID NOT NULL REFERENCES public.operadores(id) ON DELETE CASCADE,
    formador_id UUID NOT NULL REFERENCES public.operadores(id) ON DELETE RESTRICT,
    estacao_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL,
    data_fim DATE, -- Null significa Formação Vitalícia ou Contínua até progressão ILUO
    status VARCHAR(20) NOT NULL DEFAULT 'Planeado' CHECK (status IN ('Planeado', 'Em Curso', 'Concluída', 'Reprovada', 'Suspensa')),
    notas_gerais TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- --------------------------------------------------------------------------------------
-- 3. TABELAS: Avaliação do Mestre e Aprendiz (Feedback Formação - Não Anónimo!!)
-- --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_formacao_perguntas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    texto_pergunta TEXT NOT NULL,
    alvo_avaliacao VARCHAR(50) NOT NULL CHECK (alvo_avaliacao IN ('Avaliar Formando', 'Avaliar Formador')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_formacao_respostas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formacao_id UUID NOT NULL REFERENCES public.rh_planos_formacao(id) ON DELETE CASCADE,
    pergunta_id UUID NOT NULL REFERENCES public.quiz_formacao_perguntas(id) ON DELETE CASCADE,
    avaliador_id UUID NOT NULL REFERENCES public.operadores(id) ON DELETE CASCADE, -- Essencial para confirmar se a nota é legitima (Quem preencheu foi o Formando ou Formador?)
    nota NUMERIC(3,1) NOT NULL CHECK (nota >= 0 AND nota <= 4), 
    comentario TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(formacao_id, pergunta_id, avaliador_id) -- Uma pessoa só preenche 1 vez a mesma pergunta daquela mesma formação específica
);


-- --------------------------------------------------------------------------------------
-- 4. ÍNDICES & RLS (SEGURANÇA SUPABASE)
-- --------------------------------------------------------------------------------------

-- Índices de Otimização Operacionais (Para Querying Massivo nas Matrizes RH)
CREATE INDEX IF NOT EXISTS idx_planos_formacao_formando ON public.rh_planos_formacao(formando_id);
CREATE INDEX IF NOT EXISTS idx_planos_formacao_formador ON public.rh_planos_formacao(formador_id);
CREATE INDEX IF NOT EXISTS idx_planos_formacao_estacao ON public.rh_planos_formacao(estacao_id);
CREATE INDEX IF NOT EXISTS idx_quiz_satisfacao_respostas_pergunta ON public.quiz_satisfacao_respostas(pergunta_id);
CREATE INDEX IF NOT EXISTS idx_quiz_formacao_respostas_formacao ON public.quiz_formacao_respostas(formacao_id);

-- Ligar RLS 
ALTER TABLE public.quiz_satisfacao_perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_satisfacao_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_planos_formacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_formacao_perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_formacao_respostas ENABLE ROW LEVEL SECURITY;

-- Políticas Universais para Leitura (Painel RH e Dashboards TV's)
CREATE POLICY "Leitura Todos RH Planos" ON public.rh_planos_formacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura Perguntas F" ON public.quiz_formacao_perguntas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura Respostas F" ON public.quiz_formacao_respostas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura Perguntas Clima" ON public.quiz_satisfacao_perguntas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura Respostas Clima" ON public.quiz_satisfacao_respostas FOR SELECT TO authenticated USING (true);

-- Políticas de Operação Geral para Autenticados (A App front-end filtra via UX quem acede aonde)
CREATE POLICY "All Access RH Planos" ON public.rh_planos_formacao FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "All Access Perguntas F" ON public.quiz_formacao_perguntas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "All Access Respostas F" ON public.quiz_formacao_respostas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "All Access Perguntas Clima" ON public.quiz_satisfacao_perguntas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "All Access Respostas Clima" ON public.quiz_satisfacao_respostas FOR ALL TO authenticated USING (true) WITH CHECK (true);

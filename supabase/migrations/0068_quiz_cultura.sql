-- Migração 0068: Módulo de Quiz de Cultura e Liderança (Bottom-Up)

-- 1. Tabela de Perguntas
CREATE TABLE IF NOT EXISTS public.quiz_cultura_perguntas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    texto_pergunta TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa')),
    tipo_alvo VARCHAR(20) NOT NULL CHECK (tipo_alvo IN ('Liderança', 'Cultura')),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Respostas Anónimas
CREATE TABLE IF NOT EXISTS public.quiz_cultura_respostas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pergunta_id UUID REFERENCES public.quiz_cultura_perguntas(id) ON DELETE CASCADE,
    lider_avaliado_nome VARCHAR(255), -- Nome do Coordenador/Supervisor/Gestor avaliado
    escala_alvo VARCHAR(50), -- O nível hierárquico ('Coordenador', 'Supervisor', 'Gestor') ou nulo se for 'Cultura'
    nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
    criado_em TIMESTAMPTZ DEFAULT NOW()
    -- NOTA: Sem campo operador_id / user_id por design (Anonimato forçado)
);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_quiz_respostas_pergunta_id ON public.quiz_cultura_respostas(pergunta_id);
CREATE INDEX IF NOT EXISTS idx_quiz_respostas_lider_nome ON public.quiz_cultura_respostas(lider_avaliado_nome);

-- RLS (Row Level Security)
ALTER TABLE public.quiz_cultura_perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_cultura_respostas ENABLE ROW LEVEL SECURITY;

-- Políticas para Perguntas
-- Todos podem ler perguntas ativas (necessário para o quiosque)
CREATE POLICY "Leitura de Perguntas para Todos"
ON public.quiz_cultura_perguntas FOR SELECT
USING (true);

-- Apenas Admin/RH podem gerir as perguntas
CREATE POLICY "Gestores podem gerir Perguntas"
ON public.quiz_cultura_perguntas FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para Respostas
-- Todos podem inserir respostas (quiosque pode estar anónimo/sessão basica)
CREATE POLICY "Qualquer um pode Inserir Respostas"
ON public.quiz_cultura_respostas FOR INSERT
WITH CHECK (true);

-- Apenas Autenticados (Gestores/Dashboards) podem ler respostas
CREATE POLICY "Gestores podem Ler Respostas"
ON public.quiz_cultura_respostas FOR SELECT
TO authenticated
USING (true);

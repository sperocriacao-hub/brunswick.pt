-- Migration 0036: HST Certifications and Audits

-- 1. Tipos de Certificações Mestre
CREATE TABLE IF NOT EXISTS public.hst_tipos_certificacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Certificações Atribuídas aos Operadores
CREATE TABLE IF NOT EXISTS public.hst_operadores_certificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operador_id UUID REFERENCES public.operadores(id) ON DELETE CASCADE,
    tipo_certificacao_id UUID REFERENCES public.hst_tipos_certificacao(id) ON DELETE CASCADE,
    data_emissao DATE NOT NULL,
    data_validade DATE NOT NULL,
    anexo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(operador_id, tipo_certificacao_id)
);

-- 3. Tópicos de Auditoria de Segurança (O que avaliar?)
CREATE TABLE IF NOT EXISTS public.hst_auditorias_topicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topico VARCHAR(255) NOT NULL, -- ex: "As vias de circulação estão desobstruídas?"
    categoria VARCHAR(100) NOT NULL, -- ex: "5S", "Ergonomia", "EPIs"
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Instâncias de Auditorias Realizadas
CREATE TABLE IF NOT EXISTS public.hst_auditorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID REFERENCES public.areas_fabrica(id) ON DELETE CASCADE,
    auditor_id UUID REFERENCES public.operadores(id) ON DELETE SET NULL, -- Quem avaliou
    data_auditoria TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    score_percentual NUMERIC(5,2), -- 0.00 a 100.00
    observacoes_gerais TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Respostas da Auditoria aos Tópicos
CREATE TABLE IF NOT EXISTS public.hst_auditorias_respostas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auditoria_id UUID REFERENCES public.hst_auditorias(id) ON DELETE CASCADE,
    topico_id UUID REFERENCES public.hst_auditorias_topicos(id) ON DELETE CASCADE,
    conforme BOOLEAN NOT NULL, -- true (👍 Conforme) ou false (👎 Não Conforme)
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(auditoria_id, topico_id)
);

-- ROW LEVEL SECURITY (Relaxado para Server Actions via Anon Key)
ALTER TABLE public.hst_tipos_certificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hst_operadores_certificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hst_auditorias_topicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hst_auditorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hst_auditorias_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for all users" ON public.hst_tipos_certificacao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.hst_operadores_certificacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.hst_auditorias_topicos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.hst_auditorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.hst_auditorias_respostas FOR ALL USING (true) WITH CHECK (true);

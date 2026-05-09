ALTER TABLE public.lean_5s_acoes
ADD COLUMN esforco_estimado INTEGER,
ADD COLUMN impacto_estimado INTEGER,
ADD COLUMN avaliado_por TEXT,
ADD COLUMN data_avaliacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN tipo_analise_causa TEXT DEFAULT '5-Whys',
ADD COLUMN causa_raiz_5w JSONB DEFAULT '[]'::jsonb,
ADD COLUMN plano_acao_5w2h JSONB DEFAULT '[]'::jsonb,
ADD COLUMN equipa_trabalho TEXT,
ADD COLUMN indicadores_sucesso TEXT,
ADD COLUMN validacao_eficacia TEXT DEFAULT 'Pendente',
ADD COLUMN data_conclusao TIMESTAMP WITH TIME ZONE;

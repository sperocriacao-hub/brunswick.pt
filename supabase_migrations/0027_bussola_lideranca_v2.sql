-- Nova estrutura relacional ID para as Estações Fabris (Geral Liderança e Apoio)
ALTER TABLE estacoes ADD COLUMN IF NOT EXISTS lider_t1_id UUID REFERENCES operadores(id);
ALTER TABLE estacoes ADD COLUMN IF NOT EXISTS supervisor_t1_id UUID REFERENCES operadores(id);
ALTER TABLE estacoes ADD COLUMN IF NOT EXISTS lider_t2_id UUID REFERENCES operadores(id);
ALTER TABLE estacoes ADD COLUMN IF NOT EXISTS supervisor_t2_id UUID REFERENCES operadores(id);

-- Suporte
ALTER TABLE estacoes ADD COLUMN IF NOT EXISTS manutencao_id UUID REFERENCES operadores(id);
ALTER TABLE estacoes ADD COLUMN IF NOT EXISTS qualidade_id UUID REFERENCES operadores(id);
ALTER TABLE estacoes ADD COLUMN IF NOT EXISTS logistica_id UUID REFERENCES operadores(id);

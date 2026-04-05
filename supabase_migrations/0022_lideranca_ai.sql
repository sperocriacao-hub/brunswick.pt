-- Tabela para Avaliações Bottom-Up (Operários avaliando Liderança)
CREATE TABLE IF NOT EXISTS avaliacoes_bottom_up (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operador_rfid VARCHAR(255) NOT NULL,
    lider_avaliado_nome VARCHAR(255) NOT NULL,
    pontuacao_seguranca INTEGER CHECK (pontuacao_seguranca BETWEEN 1 AND 5),
    pontuacao_justica INTEGER CHECK (pontuacao_justica BETWEEN 1 AND 5),
    pontuacao_comunicacao INTEGER CHECK (pontuacao_comunicacao BETWEEN 1 AND 5),
    pontuacao_autonomia INTEGER CHECK (pontuacao_autonomia BETWEEN 1 AND 5),
    feedback_livre TEXT,
    data_avaliacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela Bússola Mestra: Ligação entre Estação (Prefixo) -> Lideres
CREATE TABLE IF NOT EXISTS bussola_lideranca (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prefixo_estacao VARCHAR(50) NOT NULL UNIQUE,
    lider_t1 VARCHAR(255),
    supervisor_t1 VARCHAR(255),
    lider_t2 VARCHAR(255),
    supervisor_t2 VARCHAR(255)
);

-- População Base (Semente) para as Montagens e Laminação
INSERT INTO bussola_lideranca (prefixo_estacao) VALUES 
('A '), ('B '), ('C '), ('D '), ('HULL'), ('DECK'), ('MP'), ('SP')
ON CONFLICT (prefixo_estacao) DO NOTHING;

-- Habilitar RLS
ALTER TABLE avaliacoes_bottom_up ENABLE ROW LEVEL SECURITY;
ALTER TABLE bussola_lideranca ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Full permissão interna no Server)
CREATE POLICY "Leitura total para admins" ON avaliacoes_bottom_up FOR SELECT USING (true);
CREATE POLICY "Inserção pública para quiosque" ON avaliacoes_bottom_up FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso bussola" ON bussola_lideranca FOR ALL USING (true) WITH CHECK (true);

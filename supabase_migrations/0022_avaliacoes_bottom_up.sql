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

-- Habilitar RLS
ALTER TABLE avaliacoes_bottom_up ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Leitura total para admins e gestores"
    ON avaliacoes_bottom_up FOR SELECT
    USING (true);

CREATE POLICY "Inserção pública para quiosque"
    ON avaliacoes_bottom_up FOR INSERT
    WITH CHECK (true);

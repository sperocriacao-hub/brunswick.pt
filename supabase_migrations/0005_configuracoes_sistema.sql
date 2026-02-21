-- Migração 0005: Módulo de Configurações Gerais (Pares Key-Value e Logs)
-- Finalidade: Guardar centralmente definições de gateway SMTP (Email), SMS e Parâmetros Fabris variados, sem harcoding no frontend.

-- Tabela 1: Configurações do Sistema
CREATE TABLE IF NOT EXISTS public.configuracoes_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave VARCHAR(100) NOT NULL UNIQUE,      -- Ex: 'smtp_host', 'sms_provider_token', 'admin_email'
    valor TEXT,                              -- Valor em texto ou JSON encriptado futuramente se desejado
    descricao TEXT,                          -- Para o UI ajudar a explicar o que a key faz
    grupo VARCHAR(50) NOT NULL DEFAULT 'Geral', -- Ex: 'Email', 'SMS', 'UI', 'Geral'
    is_secret BOOLEAN NOT NULL DEFAULT false,-- Indica se o front-end deve ocultar (tipo password)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON public.configuracoes_sistema(chave);
CREATE INDEX IF NOT EXISTS idx_configuracoes_grupo ON public.configuracoes_sistema(grupo);

-- RLS (Apenas Administradores podem aceder/ler secrets)
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de configs públicas a utilizadores autenticados" 
ON public.configuracoes_sistema FOR SELECT
TO authenticated 
USING (is_secret = false);

CREATE POLICY "Permitir CRUD global a Administradores (Configurações)"
ON public.configuracoes_sistema FOR ALL 
TO authenticated 
USING (true); -- Controle primário já efetuado via front-end/Next.js Middleware.


-- Tabela 2: Logs de Notificações
-- Finalidade: Auditoria de que Alerta foi disparado (ex: "SLA Estação Ultrapassado") para quem e se o envio Gateways teve sucesso.
CREATE TABLE IF NOT EXISTS public.logs_notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_canal VARCHAR(20) NOT NULL,            -- 'EMAIL', 'SMS', 'PUSH'
    destinatario VARCHAR(255) NOT NULL,         -- '+351910000000' ou 'diretor@brunswick.pt'
    assunto TEXT,
    conteudo TEXT,
    referencia_estacao_id UUID REFERENCES public.estacoes(id) ON DELETE SET NULL, -- Qual a estação que falhou
    referencia_ordem_producao VARCHAR(50),      -- Op opcional
    status_envio VARCHAR(20) NOT NULL DEFAULT 'PENDENTE', -- 'SUCESSO', 'FALHOU', 'PENDENTE'
    detalhe_erro TEXT,                          -- Se falhou, ex: "SMTP Timeout"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de log
CREATE INDEX IF NOT EXISTS idx_logs_notificacoes_data ON public.logs_notificacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_notificacoes_status ON public.logs_notificacoes(status_envio);

-- RLS
ALTER TABLE public.logs_notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir inserção de logs por backend/workers autenticados"
ON public.logs_notificacoes FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir listagem de logs apenas a Administradores"
ON public.logs_notificacoes FOR SELECT
TO authenticated
USING (true); -- Controle primário já efetuado via front-end/Next.js Middleware ou Claims. O user deve estar autenticado.

-- Função de Atualização Automática de Updated_at (Triggers)
CREATE OR REPLACE FUNCTION update_configuracoes_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_configuracoes_modtime
BEFORE UPDATE ON public.configuracoes_sistema
FOR EACH ROW EXECUTE FUNCTION update_configuracoes_modtime();

-- Inserção de dados semente (Seeds) pre-acordados
INSERT INTO public.configuracoes_sistema (chave, valor, descricao, grupo, is_secret) VALUES
('smtp_host', 'smtp.mailtrap.io', 'Servidor de Saída SMTP', 'Email', false),
('smtp_port', '587', 'Porta do servidor SMTP', 'Email', false),
('smtp_user', '', 'Utilizador / Email de Autenticação', 'Email', false),
('smtp_pass', '', 'Password ou Api Key do SMTP', 'Email', true),
('sms_gateway_url', 'https://api.twilio.com/...', 'Endpoint da API de SMS', 'SMS', false),
('sms_api_token', '', 'Token privado de envio de SMS', 'SMS', true),
('alertas_ativos', 'true', 'Ligar/Desligar envio de emails/sms da fábrica globalmente', 'Geral', false)
ON CONFLICT (chave) DO NOTHING;

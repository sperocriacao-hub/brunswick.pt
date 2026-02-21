-- ======================================================================================
-- SUPABASE MES - BRUNSWICK.PT - CONFIGURAÇÕES ADMINISTRATIVAS (Camada 2)
-- Database architecture for System Configuration (Forms, Icons, Colors, Notifications)
-- ======================================================================================

-- --------------------------------------------------------------------------------------
-- 1. CREATE TABLES - SISTEMA E CONFIGURAÇÃO
-- --------------------------------------------------------------------------------------

-- Configurações Globais do Sistema (Cores da Empresa, Títulos, Logos)
CREATE TABLE public.sys_config_geral (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave_config VARCHAR(100) NOT NULL UNIQUE, -- ex: 'PRIMARY_COLOR', 'COMPANY_LOGO'
    valor_config TEXT NOT NULL,
    descricao VARCHAR(255),
    tipo_dado VARCHAR(50) DEFAULT 'string', -- 'color', 'url', 'number', 'boolean'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unidades de Medida do Shopfloor (Kg, Litros, Horas, Peças)
CREATE TABLE public.sys_unidades_medida (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_unidade VARCHAR(10) NOT NULL UNIQUE, -- 'KG', 'L', 'UN', 'H'
    nome_unidade VARCHAR(100) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ícones e Assets Visuais (Mapeamento de ícones para as Estações e Tarefas)
CREATE TABLE public.sys_icones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_icone VARCHAR(100) NOT NULL UNIQUE, -- 'IconEngine', 'IconHull', 'IconWarning'
    svg_path TEXT NOT NULL, -- O código SVG
    categoria VARCHAR(50),  -- 'Maquinas', 'Avisos', 'Layout'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Formulários Dinâmicos (Estrutura definida pelo Administrador)
CREATE TABLE public.sys_formularios_template (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_formulario VARCHAR(255) NOT NULL, -- ex: 'Inspeção Casco V1'
    descricao TEXT,
    schema_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- Define os campos dinâmicos ('input', 'select', etc)
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Respostas/Submissões dos Formulários Dinâmicos
CREATE TABLE public.sys_formularios_respostas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formulario_id UUID NOT NULL REFERENCES public.sys_formularios_template(id) ON DELETE RESTRICT,
    ordem_producao_id UUID REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
    operador_rfid VARCHAR(255) REFERENCES public.operadores(tag_rfid_operador),
    respostas_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- A resposta do utilizador
    data_submissao TIMESTAMPTZ DEFAULT NOW()
);

-- Configuração de Notificações, Emails e SMS (Reportes do Servidor)
CREATE TABLE public.sys_notificacoes_reportes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_regra VARCHAR(255) NOT NULL UNIQUE, -- 'Alerta Fim Po_Compra', 'Resumo Producao Diario'
    tipo_canal VARCHAR(50) NOT NULL CHECK (tipo_canal IN ('EMAIL', 'SMS', 'WEBHOOK')),
    destinatarios_array TEXT[] NOT NULL, -- array de emails ou telefones
    evento_gatilho VARCHAR(100) NOT NULL, -- 'FIM_OP', 'ATRASO_ROTEIRO', 'AGENDADO'
    template_mensagem TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs de Envio de Notificações (Auditoria)
CREATE TABLE public.log_notificacoes_enviadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    regra_id UUID REFERENCES public.sys_notificacoes_reportes(id) ON DELETE SET NULL,
    canal_usado VARCHAR(50) NOT NULL,
    destinatario VARCHAR(255) NOT NULL,
    status_envio VARCHAR(50) NOT NULL, -- 'SUCCESS', 'FAILED'
    erro_detalhe TEXT,
    data_envio TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------------------------
-- 2. TRIGGERS DE UPDATED_AT
-- --------------------------------------------------------------------------------------
CREATE TRIGGER update_sys_config_geral_updated_at BEFORE UPDATE ON public.sys_config_geral FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();
CREATE TRIGGER update_sys_unidades_medida_updated_at BEFORE UPDATE ON public.sys_unidades_medida FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();
CREATE TRIGGER update_sys_formularios_template_updated_at BEFORE UPDATE ON public.sys_formularios_template FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();
CREATE TRIGGER update_sys_notificacoes_reportes_updated_at BEFORE UPDATE ON public.sys_notificacoes_reportes FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

-- --------------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
-- --------------------------------------------------------------------------------------
ALTER TABLE public.sys_config_geral ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_unidades_medida ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_icones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_formularios_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_formularios_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_notificacoes_reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_notificacoes_enviadas ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------------------
-- 4. RLS POLICIES (POLÍTICAS)
-- --------------------------------------------------------------------------------------

-- Permite leitura de configurações globais para QUALQUER utilizador (até anónimos) de forma a carregar cores no layout e ícones antes do login, se necessário.
CREATE POLICY "Permitir Leitura ConfigGeral Publica" ON public.sys_config_geral FOR SELECT USING (true);
CREATE POLICY "Permitir Leitura Icones Publica" ON public.sys_icones FOR SELECT USING (true);

-- Restantes tabelas apenas para autenticados
CREATE POLICY "Permitir Leitura Unidades Autenticados" ON public.sys_unidades_medida FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir Leitura Formularios Template Autenticados" ON public.sys_formularios_template FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir Leitura Respostas Formularios Autenticados" ON public.sys_formularios_respostas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir Leitura Regras Notificacao Autenticados" ON public.sys_notificacoes_reportes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir Leitura Logs Notificacao Autenticados" ON public.log_notificacoes_enviadas FOR SELECT TO authenticated USING (true);

-- Permite CRUD Total para Administradores/Autenticados
CREATE POLICY "CRUD Total Autenticados ConfigGeral" ON public.sys_config_geral FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "CRUD Total Autenticados Unidades Medida" ON public.sys_unidades_medida FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "CRUD Total Autenticados Icones" ON public.sys_icones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "CRUD Total Autenticados Formularios Templates" ON public.sys_formularios_template FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "CRUD Total Autenticados Respostas Formularios" ON public.sys_formularios_respostas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "CRUD Total Autenticados Regras Notificacoes" ON public.sys_notificacoes_reportes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "CRUD Total Autenticados Logs Notificacao" ON public.log_notificacoes_enviadas FOR ALL TO authenticated USING (true) WITH CHECK (true);

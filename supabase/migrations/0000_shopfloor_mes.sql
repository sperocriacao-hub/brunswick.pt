-- ======================================================================================
-- SUPABASE MES (Manufacturing Execution System) SCHEMA - BRUNSWICK.PT
-- Database architecture for Shopfloor tracking via RFID (ESP32)
-- ======================================================================================

-- --------------------------------------------------------------------------------------
-- 1. EXTENSIONS & FUNCTIONS
-- --------------------------------------------------------------------------------------
-- Ensures UUID generation is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to automatically update timestamp of updated_at columns
CREATE OR REPLACE FUNCTION set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------------------------
-- 2. CREATE TABLES
-- --------------------------------------------------------------------------------------

-- Modelos de Barcos
CREATE TABLE public.modelos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_modelo VARCHAR(255) NOT NULL,
    model_year VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(nome_modelo, model_year)
);

-- Composição do Modelo (Partes principais e moldes)
CREATE TABLE public.composicao_modelo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modelo_id UUID NOT NULL REFERENCES public.modelos(id) ON DELETE CASCADE,
    nome_parte VARCHAR(255) NOT NULL, -- Ex: Coberta, Casco
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Big', 'Medium', 'Small')),
    tag_rfid_molde VARCHAR(255) UNIQUE, -- Tag física do molde que gera a parte
    num_molde VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opcionais (Extras ou Customizações disponíveis por Modelo)
CREATE TABLE public.opcionais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modelo_id UUID NOT NULL REFERENCES public.modelos(id) ON DELETE CASCADE,
    nome_opcao VARCHAR(255) NOT NULL,
    descricao_opcao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estações de Trabalho (Placeholder necessário para chave estrangeira abaixo)
CREATE TABLE public.estacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_estacao VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tarefas Específicas dos Opcionais
CREATE TABLE public.tarefas_opcionais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opcao_id UUID NOT NULL REFERENCES public.opcionais(id) ON DELETE CASCADE,
    ordem_tarefa INTEGER NOT NULL,
    descricao_tarefa TEXT NOT NULL,
    estacao_destino_id UUID REFERENCES public.estacoes(id) ON DELETE SET NULL,
    imagem_instrucao_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Linhas de Produção Físicas
CREATE TABLE public.linhas_producao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    letra_linha VARCHAR(10) NOT NULL UNIQUE CHECK (letra_linha IN ('A', 'B', 'C', 'D')),
    descricao_linha VARCHAR(255),
    capacidade_diaria INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roteiros Padrão de Produção (Tempo de Ciclo e Dependências)
CREATE TABLE public.roteiros_producao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modelo_id UUID NOT NULL REFERENCES public.modelos(id) ON DELETE CASCADE,
    sequencia INTEGER NOT NULL,
    parte_id UUID REFERENCES public.composicao_modelo(id) ON DELETE SET NULL,
    estacao_id UUID REFERENCES public.estacoes(id) ON DELETE SET NULL,
    tempo_ciclo DECIMAL(10,2) NOT NULL DEFAULT 0.0, -- Em horas ou minutos, dependendo da métrica
    offset_dias INTEGER NOT NULL DEFAULT 0,
    duracao_dias INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ordens de Produção (A Ordem central que arranca a máquina)
CREATE TABLE public.ordens_producao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modelo_id UUID NOT NULL REFERENCES public.modelos(id) ON DELETE RESTRICT,
    linha_id UUID REFERENCES public.linhas_producao(id) ON DELETE RESTRICT,
    op_numero VARCHAR(100) NOT NULL UNIQUE,
    pp_plan VARCHAR(100),
    po_compra VARCHAR(100),
    hin_hull_id VARCHAR(100) UNIQUE,
    num_serie VARCHAR(100) UNIQUE,
    cliente VARCHAR(255),
    pais VARCHAR(100),
    brand_region VARCHAR(100),
    data_inicio TIMESTAMPTZ,
    data_fim TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Operadores (Placeholder necessário para chave estrangeira RFID)
CREATE TABLE public.operadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_operador VARCHAR(255) NOT NULL,
    tag_rfid_operador VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registos Realtime RFID (A Tabela Alimentada pelos ESP32)
CREATE TABLE public.registos_rfid_realtime (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    op_id UUID NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
    estacao_id UUID REFERENCES public.estacoes(id) ON DELETE SET NULL,
    operador_rfid VARCHAR(255) NOT NULL, -- FK referenciando operadores.tag_rfid_operador
    barco_rfid VARCHAR(255) NOT NULL,    -- A tag fisicamente colada no barco/molde
    timestamp_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    timestamp_fim TIMESTAMPTZ,
    FOREIGN KEY (operador_rfid) REFERENCES public.operadores(tag_rfid_operador) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- --------------------------------------------------------------------------------------
-- 3. TRIGGERS
-- --------------------------------------------------------------------------------------
CREATE TRIGGER update_modelos_updated_at BEFORE UPDATE ON public.modelos FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();
CREATE TRIGGER update_composicao_modelo_updated_at BEFORE UPDATE ON public.composicao_modelo FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();
CREATE TRIGGER update_opcionais_updated_at BEFORE UPDATE ON public.opcionais FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();
CREATE TRIGGER update_tarefas_opcionais_updated_at BEFORE UPDATE ON public.tarefas_opcionais FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();
CREATE TRIGGER update_linhas_producao_updated_at BEFORE UPDATE ON public.linhas_producao FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();
CREATE TRIGGER update_roteiros_producao_updated_at BEFORE UPDATE ON public.roteiros_producao FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();
CREATE TRIGGER update_ordens_producao_updated_at BEFORE UPDATE ON public.ordens_producao FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

-- --------------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- --------------------------------------------------------------------------------------
ALTER TABLE public.modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.composicao_modelo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opcionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_opcionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linhas_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roteiros_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registos_rfid_realtime ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------------------
-- 5. RLS POLICIES (POLÍTICAS)
-- --------------------------------------------------------------------------------------

-- Permite leitura global (SELECT) se autenticado (Admin UI)
CREATE POLICY "Permitir Leitura de Modelos Autenticados" ON public.modelos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir Leitura de Composicao Autenticados" ON public.composicao_modelo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir Leitura de Opcionais Autenticados" ON public.opcionais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir Leitura de Estacoes Autenticados" ON public.estacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir Leitura de Tarefas Autenticados" ON public.tarefas_opcionais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir Leitura de Linhas Autenticados" ON public.linhas_producao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir Leitura de Roteiros Autenticados" ON public.roteiros_producao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir Leitura de Ordens Autenticados" ON public.ordens_producao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir Leitura de Operadores Autenticados" ON public.operadores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir Leitura de Registos RFID Autenticados" ON public.registos_rfid_realtime FOR SELECT TO authenticated USING (true);

-- Permite CRUD (All) para os módulos de admin e criação de OPs. (A refinar os perfis 'Admin' futuramente)
CREATE POLICY "CRUD Total Autenticados Modelos" ON public.modelos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "CRUD Total Autenticados Composicao" ON public.composicao_modelo FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "CRUD Total Autenticados Opcionais" ON public.opcionais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "CRUD Total Autenticados Estacoes" ON public.estacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "CRUD Total Autenticados Tarefas" ON public.tarefas_opcionais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "CRUD Total Autenticados Linhas" ON public.linhas_producao FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "CRUD Total Autenticados Roteiros" ON public.roteiros_producao FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "CRUD Total Autenticados Ordens" ON public.ordens_producao FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "CRUD Total Autenticados Operadores" ON public.operadores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "CRUD Total Autenticados Registos RFID" ON public.registos_rfid_realtime FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- API KEY ESP32 (ANON):
-- Os ESP32 usam a chave ANON, logo precisam de permissão específica de INSERT para alimentar a base de dados
-- Isto evita que qualquer utilizador externo apague dados, apenas os ESP32 inserem dados novos ou começam/fecham leituras
CREATE POLICY "Permitir ESP32 Inserir Leituras" ON public.registos_rfid_realtime FOR INSERT TO anon WITH CHECK (true);
-- Permite fechar a leitura (update do timestamp_fim)
CREATE POLICY "Permitir ESP32 Atualizar Fim Leituras" ON public.registos_rfid_realtime FOR UPDATE TO anon USING (true);

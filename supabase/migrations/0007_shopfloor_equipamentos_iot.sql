/* 
  Módulo de Gestão de Dispositivos (ESP32) - Migração 0007
  Tracking de Equipamentos Físicos IoT, Heartbeats e Associações às Estações M.E.S.
*/

-- --------------------------------------------------------------------------------------
-- 1. TABELA PRINCIPAL: EQUIPAMENTOS IOT
-- --------------------------------------------------------------------------------------
CREATE TABLE public.equipamentos_iot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mac_address VARCHAR(50) NOT NULL UNIQUE,   -- Identificador único do hardware (WiFi MAC)
    nome_dispositivo VARCHAR(100) NOT NULL,    -- Ex: 'ESP32_Pintura_A'
    ip_local VARCHAR(50),                      -- Último IP registado na rede local
    versao_firmware VARCHAR(50) DEFAULT 'v1.0.0',
    estacao_id UUID REFERENCES public.estacoes(id) ON DELETE SET NULL, -- A que estação lógica o painel está acoplado (pode ser null se em armazém)
    ultimo_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------------------------
-- 2. TABELA SECUNDÁRIA: LOGS DE COMUNICAÇÃO RAW (Debug Console)
-- --------------------------------------------------------------------------------------
-- Esta tabela guarda não o M.E.S validado, mas os pings RAW dos leitores para efeitos de troubleshooting da API e tags não reconhecidas
CREATE TABLE public.logs_comunicacao_iot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mac_address VARCHAR(50) REFERENCES public.equipamentos_iot(mac_address) ON DELETE CASCADE,
    tipo_evento VARCHAR(50) NOT NULL, -- 'HEARTBEAT', 'RFID_SCAN', 'BOOT', 'ERROR'
    payload_recebido JSONB DEFAULT '{}'::jsonb, -- O corpo inteiro do POST que o ESP32 mandou
    mensagem_resposta VARCHAR(255), -- O que o Supabase devolveu (200 OK, 403 Forbidden, etc)
    status_codigo INTEGER, -- 200, 400, 401, 500
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------------------------
-- 3. UPDATED_AT TRIGGER
-- --------------------------------------------------------------------------------------
CREATE TRIGGER update_equipamentos_iot_updated_at BEFORE UPDATE ON public.equipamentos_iot FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

-- --------------------------------------------------------------------------------------
-- 4. SEGURANÇA E RLS
-- --------------------------------------------------------------------------------------
ALTER TABLE public.equipamentos_iot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_comunicacao_iot ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------------------
-- 5. RLS POLICIES (Configurando acessos para os Painéis e Admins)
-- --------------------------------------------------------------------------------------

-- Administradores: Acesso total a tudo
CREATE POLICY "CRUD Total Autenticados Equipamentos IOT" ON public.equipamentos_iot FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Leitura Todos Autenticados Logs IOT" ON public.logs_comunicacao_iot FOR SELECT TO authenticated USING (true);

-- Dispositivos (Anon): Podem atualizar o seu próprio Heatbeat/IP/Firmware e fazer INSERTs na consola de logs
CREATE POLICY "Permitir Leitura e Update Dispositivos ESP32" ON public.equipamentos_iot 
FOR UPDATE TO anon USING (true);

CREATE POLICY "Permitir Insert Logs Dispositivos ESP32" ON public.logs_comunicacao_iot 
FOR INSERT TO anon WITH CHECK (true);

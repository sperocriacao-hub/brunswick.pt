-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0034: MOTOR DE GATILHOS INDUSTRIAIS (JIT & FEEDER LINES)
-- ======================================================================================

-- --------------------------------------------------------------------------------------
-- 1. MATRIZ DE REGRAS DE GATILHOS (A Configuração da Engenharia)
-- Esta tabela guarda as regras "SE o barco X passar aqui, ENTÃO avisa o Setor Y".
-- --------------------------------------------------------------------------------------
CREATE TABLE public.regras_gatilhos_secundarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modelo_id UUID NOT NULL REFERENCES public.modelos(id) ON DELETE CASCADE,
    estacao_gatilho_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE CASCADE,
    evento_gatilho VARCHAR(50) NOT NULL DEFAULT 'INICIO_ESTACAO' CHECK (evento_gatilho IN ('INICIO_ESTACAO', 'FIM_ESTACAO', '50_PERCENTO')),
    estacao_alvo_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE CASCADE, -- Qual a estação específica (ex: Corte Estofos) a receber o pedido
    descricao_tarefa TEXT NOT NULL, 
    checklist_tarefas JSONB DEFAULT '[]'::jsonb, 
    sla_horas INTEGER NOT NULL DEFAULT 24,
    estacao_destino_id UUID REFERENCES public.estacoes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_regras_gatilhos_updated_at BEFORE UPDATE ON public.regras_gatilhos_secundarios FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

-- --------------------------------------------------------------------------------------
-- 2. ORDENS SECUNDÁRIAS REALTIME (O "Uber" do Shopfloor)
-- --------------------------------------------------------------------------------------
CREATE TABLE public.ordens_secundarias_realtime (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    regra_id UUID NOT NULL REFERENCES public.regras_gatilhos_secundarios(id) ON DELETE RESTRICT,
    op_principal_id UUID NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
    estacao_alvo_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE CASCADE, -- Cópia para facilitar
    checklist_progresso JSONB DEFAULT '[]'::jsonb, 
    status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_CURSO', 'PRONTO_ENTREGA', 'CONCLUIDO')),
    timestamp_disparo TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    timestamp_deadline TIMESTAMPTZ NOT NULL,
    timestamp_conclusao TIMESTAMPTZ,
    operador_rfid VARCHAR(255) REFERENCES public.operadores(tag_rfid_operador) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_ordens_sec_updated_at BEFORE UPDATE ON public.ordens_secundarias_realtime FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

-- --------------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY & POLICIES
-- --------------------------------------------------------------------------------------
ALTER TABLE public.regras_gatilhos_secundarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_secundarias_realtime ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir Leitura Autenticados Regras Gatilhos" ON public.regras_gatilhos_secundarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "CRUD Total Autenticados Regras Gatilhos" ON public.regras_gatilhos_secundarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir Leitura Autenticados Ordens Secundarias" ON public.ordens_secundarias_realtime FOR SELECT TO authenticated USING (true);
CREATE POLICY "CRUD Total Autenticados Ordens Secundarias" ON public.ordens_secundarias_realtime FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- API KEY ESP32/Tablets: Permitir alterar o status do ticket no chão de fábrica
CREATE POLICY "Permitir ESP32 Inserir Ordens Secundarias" ON public.ordens_secundarias_realtime FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir ESP32 Atualizar Ordens Secundarias" ON public.ordens_secundarias_realtime FOR UPDATE TO anon USING (true);

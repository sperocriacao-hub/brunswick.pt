-- ======================================================================================
-- SUPABASE MES - BRUNSWICK.PT - Fase 26: Horários e Feriados (Configuração Fabril)
-- ======================================================================================

-- --------------------------------------------------------------------------------------
-- 1. INSERTS DE CONFIGURAÇÃO GLOBAL (HORÁRIOS MESTRES DE EXPEDIENTE E PAUSA)
-- --------------------------------------------------------------------------------------
INSERT INTO public.configuracoes_sistema (chave, valor, descricao, grupo, is_secret)
VALUES
    ('TURNO_HORA_INICIO', '08:00', 'Hora inicial do turno de trabalho (formato HH:MM)', 'Fabrica', false),
    ('TURNO_HORA_FIM', '17:00', 'Hora final do turno de trabalho (formato HH:MM)', 'Fabrica', false),
    ('PAUSA_REFEICAO_INICIO', '13:00', 'Início da pausa de almoço/descanso principal', 'Fabrica', false),
    ('PAUSA_REFEICAO_FIM', '14:00', 'Fim da pausa de almoço/descanso principal', 'Fabrica', false)
ON CONFLICT (chave) DO NOTHING;

-- --------------------------------------------------------------------------------------
-- 2. TABELA DE FERIADOS E FECHOS CALENDARIZADOS DA FÁBRICA
-- OEE Motor consultará esta tabela para saber as datas que não processam "Horas Uteis"
-- --------------------------------------------------------------------------------------
CREATE TABLE public.sys_feriados_fabrica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_feriado DATE NOT NULL UNIQUE,
    descricao VARCHAR(255) NOT NULL,
    recorrente_anualmente BOOLEAN DEFAULT false, -- Se true, repete todos os anos na mesma DD/MM
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------------------------
-- 3. TRIGGERS DE UPDATED_AT
-- --------------------------------------------------------------------------------------
CREATE TRIGGER update_sys_feriados_fabrica_updated_at 
BEFORE UPDATE ON public.sys_feriados_fabrica 
FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

-- --------------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) E POLÍTICAS
-- --------------------------------------------------------------------------------------
ALTER TABLE public.sys_feriados_fabrica ENABLE ROW LEVEL SECURITY;

-- Qualquer query calculatória poderá ler os feriados
CREATE POLICY "Permitir Leitura Feriados Publica" 
ON public.sys_feriados_fabrica FOR SELECT USING (true);

-- Apenas admins/autenticados podem gerir Feriados
CREATE POLICY "CRUD Total Autenticados Feriados" 
ON public.sys_feriados_fabrica FOR ALL TO authenticated USING (true) WITH CHECK (true);

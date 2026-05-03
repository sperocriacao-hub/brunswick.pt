-- Migration: Criação da Tabela de Ausências (Férias, Baixas, Faltas)

CREATE TABLE IF NOT EXISTS public.rh_ausencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operador_id UUID REFERENCES public.operadores(id) ON DELETE CASCADE,
    tipo_ausencia VARCHAR(100) NOT NULL, -- 'Férias', 'Baixa Médica', 'Falta Justificada', 'Falta Injustificada', 'Afastamento/Licença'
    data_inicio DATE NOT NULL,
    data_fim DATE, -- Pode ser NULL se a data de fim for incerta (ex: baixa prolongada sem previsão)
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ativar RLS
ALTER TABLE public.rh_ausencias ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (CRUD Total para Admins e RH)
CREATE POLICY "Permitir Leitura de Ausências Autenticados" ON public.rh_ausencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "CRUD Total Autenticados Ausências" ON public.rh_ausencias FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Gatilho de Atualização Automática
CREATE TRIGGER update_rh_ausencias_updated_at 
BEFORE UPDATE ON public.rh_ausencias 
FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

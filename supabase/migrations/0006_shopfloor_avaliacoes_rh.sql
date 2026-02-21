/* 
  Matriz de Talentos de RH (Avaliações Diárias) - Migração 0006
  Sistema de pontuação diário por Operador em 7 Eixos, e respetivos Apontamentos Disciplinares.
*/

-- --------------------------------------------------------------------------------------
-- 1. TABELA: AVALIAÇÕES DIÁRIAS (A grelha diária de 7 eixos)
-- --------------------------------------------------------------------------------------
CREATE TABLE public.avaliacoes_diarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcionario_id UUID NOT NULL REFERENCES public.operadores(id) ON DELETE CASCADE,
    supervisor_auth_id UUID, -- FK Opcional para auth.users (se integrarmos Supabase Auth integral) ou guardamos o email/nome logado
    supervisor_nome VARCHAR(255) NOT NULL,
    data_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Eixos Avaliativos (Restrição 0.0 a 4.0)
    nota_hst NUMERIC(3,1) NOT NULL CHECK (nota_hst >= 0.0 AND nota_hst <= 4.0),
    nota_epi NUMERIC(3,1) NOT NULL CHECK (nota_epi >= 0.0 AND nota_epi <= 4.0),
    nota_5s NUMERIC(3,1) NOT NULL CHECK (nota_5s >= 0.0 AND nota_5s <= 4.0),
    nota_qualidade NUMERIC(3,1) NOT NULL CHECK (nota_qualidade >= 0.0 AND nota_qualidade <= 4.0),
    nota_eficiencia NUMERIC(3,1) NOT NULL CHECK (nota_eficiencia >= 0.0 AND nota_eficiencia <= 4.0),
    nota_objetivos NUMERIC(3,1) NOT NULL CHECK (nota_objetivos >= 0.0 AND nota_objetivos <= 4.0),
    nota_atitude NUMERIC(3,1) NOT NULL CHECK (nota_atitude >= 0.0 AND nota_atitude <= 4.0),
    
    -- Campos Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Um Supervisor só pode avaliar o mesmo Operador UMA vez por dia.
    UNIQUE(funcionario_id, supervisor_nome, data_avaliacao)
);


-- --------------------------------------------------------------------------------------
-- 2. TABELA: APONTAMENTOS NEGATIVOS (A justificação obrigatória)
-- --------------------------------------------------------------------------------------
CREATE TABLE public.apontamentos_negativos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcionario_id UUID NOT NULL REFERENCES public.operadores(id) ON DELETE CASCADE,
    avaliacao_origem_id UUID REFERENCES public.avaliacoes_diarias(id) ON DELETE CASCADE,
    supervisor_nome VARCHAR(255) NOT NULL,
    
    -- De onde veio a falha?
    topico_falhado VARCHAR(50) NOT NULL CHECK (topico_falhado IN ('HST', 'EPI', 'Limpeza_5S', 'Qualidade', 'Eficiencia', 'Objetivos', 'Atitude')),
    nota_atribuida NUMERIC(3,1) NOT NULL,
    
    -- Justificativo obrigatório no FrontEnd
    justificacao TEXT NOT NULL,
    data_apontamento DATE NOT NULL DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- --------------------------------------------------------------------------------------
-- 3. TRIGGERS & AUTO-CALCULATORS
-- --------------------------------------------------------------------------------------
-- Sempre que uma avaliação é submetida, queremos atualizar a "matriz_talento_media" cached na Tabela Operadores
CREATE OR REPLACE FUNCTION update_operador_matriz_talento()
RETURNS TRIGGER AS $$
DECLARE
    media_global NUMERIC(3,1);
BEGIN
    -- Calcula a média aritmética agrupada das 7 colunas de todos os testes deste funcionário
    SELECT ROUND(AVG(
        (nota_hst + nota_epi + nota_5s + nota_qualidade + nota_eficiencia + nota_objetivos + nota_atitude) / 7.0
    ), 1)
    INTO media_global
    FROM public.avaliacoes_diarias
    WHERE funcionario_id = NEW.funcionario_id;

    -- Atualiza a BD de HR
    UPDATE public.operadores
    SET matriz_talento_media = media_global
    WHERE id = NEW.funcionario_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_media_talento
AFTER INSERT OR UPDATE ON public.avaliacoes_diarias
FOR EACH ROW
EXECUTE FUNCTION update_operador_matriz_talento();


-- --------------------------------------------------------------------------------------
-- 4. SEGURANÇA E RLS
-- --------------------------------------------------------------------------------------
ALTER TABLE public.avaliacoes_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apontamentos_negativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRUD Total Autenticados Avaliacoes" ON public.avaliacoes_diarias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Leitura Todos Avaliacoes" ON public.avaliacoes_diarias FOR SELECT TO authenticated USING (true);

CREATE POLICY "CRUD Total Autenticados Apontamentos" ON public.apontamentos_negativos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Leitura Todos Apontamentos" ON public.apontamentos_negativos FOR SELECT TO authenticated USING (true);

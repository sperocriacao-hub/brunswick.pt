-- Migration 0032: Health and Safety (HST)
CREATE EXTENSION IF NOT EXISTS moddatetime schema extensions;
-- 1. Tabela: Ocorrências de HST (Acidentes, Incidentes, Near-Miss)
CREATE TABLE IF NOT EXISTS public.hst_ocorrencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    colaborador_id UUID REFERENCES public.operadores(id) ON DELETE SET NULL,
    area_id UUID REFERENCES public.areas_fabrica(id) ON DELETE SET NULL,
    estacao_id UUID REFERENCES public.estacoes(id) ON DELETE SET NULL,
    
    tipo_ocorrencia VARCHAR(100) NOT NULL CHECK (tipo_ocorrencia IN ('Acidente com Baixa', 'Acidente sem Baixa', 'Incidente/Quase-Acidente', 'Doenca Profissional')),
    gravidade VARCHAR(50) NOT NULL CHECK (gravidade IN ('Leve', 'Moderada', 'Grave', 'Fatal')),
    
    data_hora_ocorrencia TIMESTAMP WITH TIME ZONE NOT NULL,
    descricao_evento TEXT NOT NULL,
    lesao_reportada TEXT,
    tratamento_aplicado TEXT,
    
    dias_baixa INTEGER DEFAULT 0,
    
    status VARCHAR(50) NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Em Investigacao', 'Fechado')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela: Matriz de EPIs por Área 
-- Armazena o tipo de EPI obrigatório no cruzamento com a Area Fabril
CREATE TABLE IF NOT EXISTS public.hst_matriz_epis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID REFERENCES public.areas_fabrica(id) ON DELETE CASCADE,
    
    -- Checkboxes binários para Obrigatoriedade
    epi_oculos BOOLEAN DEFAULT false,
    epi_protetor_auricular BOOLEAN DEFAULT false,
    epi_mascara_respiratoria BOOLEAN DEFAULT false,
    epi_luvas_anticorte BOOLEAN DEFAULT false,
    epi_luvas_quimicas BOOLEAN DEFAULT false,
    epi_botas_biqueira BOOLEAN DEFAULT false,
    epi_capacete BOOLEAN DEFAULT false,
    epi_fato_macaco BOOLEAN DEFAULT false,
    
    observacoes_adicionais TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(area_id) -- Apenas um registo de matriz por Área
);

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at_hst_ocorrencias BEFORE UPDATE ON public.hst_ocorrencias FOR EACH ROW EXECUTE PROCEDURE moddatetime();

-- RLS Policies
ALTER TABLE public.hst_ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hst_matriz_epis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.hst_ocorrencias FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.hst_ocorrencias FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.hst_ocorrencias FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.hst_matriz_epis FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.hst_matriz_epis FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.hst_matriz_epis FOR UPDATE USING (auth.role() = 'authenticated');

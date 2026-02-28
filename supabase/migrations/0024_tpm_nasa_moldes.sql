-- Migration 0024: TPM NASA Level - Geometrias Avançadas e Rastreabilidade 2D

-- 1. Tabela para associar um ou mais SVGs (Vistas) a um molde físico
CREATE TABLE public.moldes_geometria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    molde_id UUID NOT NULL REFERENCES public.moldes(id) ON DELETE CASCADE,
    nome_vista VARCHAR(100) NOT NULL DEFAULT 'Vista Superior', -- ex: 'Vista Superior', 'Vista Lateral Direita'
    svg_content TEXT NOT NULL, -- Código SVG Bruto do molde
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Intervenções (Ordens de Manutenção Master)
CREATE TABLE public.moldes_intervencoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    molde_id UUID NOT NULL REFERENCES public.moldes(id) ON DELETE CASCADE,
    reportado_por VARCHAR(255) NOT NULL, -- Operador que levantou a Ordem
    prioridade VARCHAR(50) NOT NULL DEFAULT 'Media' CHECK (prioridade IN ('Baixa', 'Media', 'Critica')),
    descricao TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Aberta' CHECK (status IN ('Aberta', 'Em Progresso', 'Validada', 'Encerrada')),
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_conclusao TIMESTAMP WITH TIME ZONE
);

-- 3. Tabela de Pins (Defeitos Geo-Localizados no SVG)
CREATE TABLE public.moldes_defeitos_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intervencao_id UUID NOT NULL REFERENCES public.moldes_intervencoes(id) ON DELETE CASCADE,
    geometria_id UUID REFERENCES public.moldes_geometria(id) ON DELETE CASCADE, -- Qual a vista onde foi marcado?
    
    -- Coordenadas Percentuais (0 a 100%)
    coord_x FLOAT NOT NULL, 
    coord_y FLOAT NOT NULL,
    
    tipo_defeito VARCHAR(100) NOT NULL, -- Ex: Fissura, Gelcoat, Risco, Polimento
    status VARCHAR(50) NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Reparado', 'Validado')),
    
    anotacao_reparador TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.moldes_geometria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moldes_intervencoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moldes_defeitos_pins ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Permitir leitura anonima geometrias" ON public.moldes_geometria FOR SELECT USING (true);
CREATE POLICY "Permitir escrita anonima geometrias" ON public.moldes_geometria FOR ALL USING (true);

CREATE POLICY "Permitir leitura anonima intervencoes" ON public.moldes_intervencoes FOR SELECT USING (true);
CREATE POLICY "Permitir escrita anonima intervencoes" ON public.moldes_intervencoes FOR ALL USING (true);

CREATE POLICY "Permitir leitura anonima pins" ON public.moldes_defeitos_pins FOR SELECT USING (true);
CREATE POLICY "Permitir escrita anonima pins" ON public.moldes_defeitos_pins FOR ALL USING (true);

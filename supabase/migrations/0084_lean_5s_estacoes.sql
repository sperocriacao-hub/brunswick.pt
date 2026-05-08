ALTER TABLE public.lean_5s_perguntas ADD COLUMN estacao_id UUID REFERENCES public.estacoes(id) ON DELETE SET NULL;
ALTER TABLE public.lean_5s_perguntas ADD COLUMN linha_id UUID REFERENCES public.linhas_producao(id) ON DELETE SET NULL;

CREATE TABLE public.lean_5s_cronograma (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditor_id UUID REFERENCES public.operadores(id) ON DELETE CASCADE,
    area_id UUID REFERENCES public.areas_fabrica(id) ON DELETE CASCADE,
    linha_id UUID REFERENCES public.linhas_producao(id) ON DELETE SET NULL,
    estacao_id UUID REFERENCES public.estacoes(id) ON DELETE SET NULL,
    data_prevista DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert classical 5S rules
INSERT INTO public.lean_5s_perguntas (pergunta, categoria, area_id) VALUES
('O chão está livre de lixo, ferramentas e peças espalhadas?', '1S - Utilização', NULL),
('Não existem materiais ou equipamentos não utilizados na área de trabalho?', '1S - Utilização', NULL),
('Todas as ferramentas e equipamentos têm um local definido e identificado?', '2S - Arrumação', NULL),
('O material e ferramentas em uso são guardados imediatamente após a utilização?', '2S - Arrumação', NULL),
('A área de trabalho, as máquinas e equipamentos estão isentos de sujidade/pó/óleo?', '3S - Limpeza', NULL),
('Os pontos de origem da sujidade estão identificados e controlados?', '3S - Limpeza', NULL),
('Existem standards de limpeza e de trabalho afixados e visíveis na área?', '4S - Normalização', NULL),
('As marcações do chão (linhas pedonais, áreas de lixo) estão bem visíveis?', '4S - Normalização', NULL),
('Todos usam o fardamento e EPIs obrigatórios para a zona?', '5S - Disciplina', NULL),
('Os standards de trabalho e instruções operacionais (SOPs) estão a ser rigorosamente cumpridos?', '5S - Disciplina', NULL);

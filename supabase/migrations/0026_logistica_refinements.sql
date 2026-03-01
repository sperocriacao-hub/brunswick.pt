-- Migration 0026: Refinamentos Logística Kitting JIT

-- Modifica a lógica mãe de interligação de roteiro M.E.S para albergar "Toggles" de dependência logística
ALTER TABLE public.estacoes_sequencia
    ADD COLUMN requer_kitting BOOLEAN DEFAULT false,
    ADD COLUMN kitting_offset_horas INTEGER DEFAULT 0;

-- Documentação 
COMMENT ON COLUMN public.estacoes_sequencia.requer_kitting IS 'Verdadeiro se a passagem do Barco para a próxima Estação requer material do Armazém/Supply.';
COMMENT ON COLUMN public.estacoes_sequencia.kitting_offset_horas IS 'Tempo que a App deve alertar o Armazém ANTES do Barco efetivamente lá chegar.';

-- ======================================================================================
-- SUPABASE MES - MIGRAÇÃO 0004: ASSOCIAÇÃO DE ESTAÇÕES A LINHAS ESPECÍFICAS
-- ======================================================================================

-- 1. ADICIONAR LIGAÇÃO OPCIONAL DA ESTAÇÃO A UMA LINHA DE PRODUÇÃO (SWIMLANE)
-- Ao adicionarmos esta Foreign Key, permitimos desenhar a matriz Kanban sem
-- duplicar a mesma máquina fisícamente em todas as linhas.
--
-- Se a estacão for `linha_id IS NULL`, tratamos visualmente como 
-- 'Estação Satélite Universal' (ex: Carpintaria, que serve todas). 
-- Caso contrário, fica ancorada visualmente só à (Swimlane) da sua linha.

ALTER TABLE public.estacoes
    ADD COLUMN linha_id UUID REFERENCES public.linhas_producao(id) ON DELETE SET NULL;

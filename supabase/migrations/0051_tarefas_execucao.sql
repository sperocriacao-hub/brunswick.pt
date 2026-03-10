-- --------------------------------------------------------------------------------------
-- 0051_tarefas_execucao.sql
-- Adiciona rastreio granular de tarefas executadas (Padrao e Opcionais) e Ligacao de Opcionais na OP
-- --------------------------------------------------------------------------------------

-- 1. Ligação Real entre a Ordem de Produção e as Opções Escolhidas (Ex: Ar Condicionado, Upgrade Motor)
CREATE TABLE IF NOT EXISTS public.ordens_producao_opcionais (
    op_id UUID NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
    opcional_id UUID NOT NULL REFERENCES public.opcionais(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (op_id, opcional_id)
);

-- 2. Tabela Log de Ação Física de Cada Tarefa do Tablet (Checklist)
CREATE TABLE IF NOT EXISTS public.tarefas_executadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    op_id UUID NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
    estacao_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE CASCADE,
    
    -- Exatamente um destes deve estar preenchido (Tarefa Standard ou Tarefa Extra-Opcional)
    roteiro_id UUID REFERENCES public.roteiros_producao(id) ON DELETE CASCADE,
    tarefa_opcional_id UUID REFERENCES public.tarefas_opcionais(id) ON DELETE CASCADE,
    
    -- Quem e Quando
    operador_rfid VARCHAR(255) NOT NULL, -- Tag do operador que picou o "Feito"
    timestamp_feito TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chk_tarefa_tipo CHECK (
        (roteiro_id IS NOT NULL AND tarefa_opcional_id IS NULL) OR 
        (roteiro_id IS NULL AND tarefa_opcional_id IS NOT NULL)
    ),
    
    -- Garantir que uma OP não tem a mesma tarefa repetida "Feita" vezes infinitas na mesma estação  
    UNIQUE NULLS NOT DISTINCT (op_id, roteiro_id),
    UNIQUE NULLS NOT DISTINCT (op_id, tarefa_opcional_id)
);

-- Indexes para velocidade (pois os Tablets Consultam isto a cada F5/Ponto)
CREATE INDEX idx_tarefexec_op ON public.tarefas_executadas(op_id);
CREATE INDEX idx_tarefexec_estacao ON public.tarefas_executadas(estacao_id);

-- RLS
ALTER TABLE public.ordens_producao_opcionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_executadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir Leitura e Escrita de OP Opcionais Autenticados" 
    ON public.ordens_producao_opcionais FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir Leitura e Escrita de Tarefas Executadas Autenticados" 
    ON public.tarefas_executadas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- API KEY ESP32/Tablet HMI (ANON):
CREATE POLICY "Permitir ESP32 Inserir Tarefas" 
    ON public.tarefas_executadas FOR INSERT TO anon WITH CHECK (true);
    
CREATE POLICY "Permitir ESP32 Ler Tarefas" 
    ON public.tarefas_executadas FOR SELECT TO anon USING (true);
    
CREATE POLICY "Permitir ESP32 Apagar Tarefas (Uncheck)" 
    ON public.tarefas_executadas FOR DELETE TO anon USING (true);

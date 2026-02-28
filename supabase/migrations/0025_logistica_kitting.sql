-- Migration 0025: Módulo de Kitting Logístico (Just-In-Time)

CREATE TABLE public.logistica_pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordem_producao_id UUID NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
    estacao_destino_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE CASCADE,
    
    -- Se null, significa que foi pedido de forma genérica para a estação, mas o ideal é linkar à Peça/Modelo se houver tracking B.O.M. detalhado.
    peca_solicitada VARCHAR(255), 
    
    status VARCHAR(50) NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Picking', 'Entregue')),
    prioridade VARCHAR(50) NOT NULL DEFAULT 'Normal' CHECK (prioridade IN ('Baixa', 'Normal', 'Urgente')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_picking_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    operador_logistica VARCHAR(255) -- Quem entregou o Kit
);

-- RLS
ALTER TABLE public.logistica_pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura anonima logistica" ON public.logistica_pedidos FOR SELECT USING (true);
CREATE POLICY "Permitir escrita anonima logistica" ON public.logistica_pedidos FOR ALL USING (true);

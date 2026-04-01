-- Tabela Relacional ILUO (Matriz de Polivalência vs Estações)
CREATE TABLE IF NOT EXISTS public.operador_iluo_matriz (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    operador_id UUID NOT NULL REFERENCES public.operadores(id) ON DELETE CASCADE,
    estacao_id UUID NOT NULL REFERENCES public.estacoes(id) ON DELETE CASCADE,
    nivel_iluo VARCHAR(1) NOT NULL CHECK (nivel_iluo IN ('I', 'L', 'U', 'O')),
    avaliador_nome VARCHAR(255),
    data_avaliacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Restrição Unica: Um operário só pode ter UM NÍVEL (registado ativo) numa estação ao mesmo tempo (evitamos duplicações)
    UNIQUE(operador_id, estacao_id)
);

-- Habilitar Row Level Security (RLS) para Segurança Padrão
ALTER TABLE public.operador_iluo_matriz ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Permitir Leitura Pública de Matriz ILUO"
ON public.operador_iluo_matriz FOR SELECT USING (true);

CREATE POLICY "Permitir Inserção de Matriz ILUO"
ON public.operador_iluo_matriz FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir Update de Matriz ILUO"
ON public.operador_iluo_matriz FOR UPDATE USING (true);

CREATE POLICY "Permitir Delete de Matriz ILUO"
ON public.operador_iluo_matriz FOR DELETE USING (true);

-- (Opcional) Script de Seed Migratória (Para não perder os ILUOs antigos gravados na Tabela `operadores`)
-- Isto varre a tabela de operadores, e se o ILUO não for nulo/estação não for nula, cria a versão relacional
INSERT INTO public.operador_iluo_matriz (operador_id, estacao_id, nivel_iluo, avaliador_nome, data_avaliacao)
SELECT 
    id as operador_id, 
    posto_base_id as estacao_id, 
    iluo_nivel as nivel_iluo, 
    'Migração Automática (Seed)' as avaliador_nome, 
    NOW() as data_avaliacao
FROM public.operadores
WHERE posto_base_id IS NOT NULL 
AND iluo_nivel IS NOT NULL 
AND iluo_nivel IN ('I', 'L', 'U', 'O')
ON CONFLICT (operador_id, estacao_id) DO NOTHING;
